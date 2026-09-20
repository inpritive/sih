import cv2
import time
import requests
import json
import os
from datetime import datetime, timezone
import argparse
import random
from ultralytics import YOLO
from paddleocr import PaddleOCR

API_URL = "http://localhost:8000"

def get_cameras():
    try:
        response = requests.get(f"{API_URL}/cameras")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching cameras: {e}")
    return []

def main():
    parser = argparse.ArgumentParser(description='Video Feeder for ANPR')
    parser.add_argument('--video', type=str, required=True, help='Path to video file')
    parser.add_argument('--camera-id', type=str, required=True, help='Camera ID to simulate')
    args = parser.parse_args()

    print(f"Loading YOLO model...")
    yolo_model = YOLO('yolov8n.pt') 

    print(f"Loading PaddleOCR...")
    reader = PaddleOCR(use_textline_orientation=True, lang='en')

    video_path = os.path.abspath(args.video)
    print(f"Trying to open video at absolute path: {video_path}")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video stream or file: {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30 # fallback
    
    frame_count = 0

    while(cap.isOpened()):
        ret, frame = cap.read()
        if ret == True:
            # Process ~1 frame per second
            if frame_count % int(fps) == 0:
                print(f"Processing frame {frame_count}, shape: {frame.shape}...")
                
                # YOLOv8 object detection
                results = yolo_model(frame, classes=[2, 3, 5, 7], device='cpu') # car, motorcycle, bus, truck (COCO classes)
                
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        
                        print(f"Detected {yolo_model.names[cls]} with conf {conf:.2f} at [{x1}, {y1}, {x2}, {y2}]")
                        
                        # Extract vehicle image
                        vehicle_img = frame[y1:y2, x1:x2]
                        
                        if vehicle_img.size > 0:
                            # Upscale image if small
                            h, w = vehicle_img.shape[:2]
                            if w < 100:
                                vehicle_img = cv2.resize(vehicle_img, (w*2, h*2), interpolation=cv2.INTER_CUBIC)
                                
                            # Use PaddleOCR to read plate
                            ocr_results = reader.ocr(vehicle_img, cls=True)
                            
                            if ocr_results and ocr_results[0]:
                                for line in ocr_results[0]:
                                    bbox, (text, prob) = line
                                    # Very basic filter, assuming text > 4 chars is a plate
                                    if len(text) > 4:
                                        sighting = {
                                            "plate": text.upper().replace(" ", ""),
                                            "camera_id": args.camera_id,
                                            "timestamp": datetime.now(timezone.utc).isoformat(),
                                            "confidence": float(prob),
                                            "vehicle_type": yolo_model.names[cls],
                                            "color": "unknown" # Color detection requires a separate model/heuristic
                                        }
                                        print(f"Sighting detected: {sighting}")
                                        try:
                                            requests.post(f"{API_URL}/sighting", json=sighting)
                                        except Exception as e:
                                            print(f"Error posting sighting: {e}")

            frame_count += 1
            
        else: 
            break
            
    cap.release()

if __name__ == "__main__":
    main()
