import cv2
import time
import requests
import json
from datetime import datetime, timezone
import argparse
import random
from ultralytics import YOLO
import easyocr

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

    print(f"Loading EasyOCR...")
    reader = easyocr.Reader(['en'])

    cap = cv2.VideoCapture(args.video)
    if not cap.isOpened():
        print(f"Error opening video stream or file: {args.video}")
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
                print(f"Processing frame {frame_count}...")
                
                # YOLOv8 object detection
                results = yolo_model(frame, classes=[2, 3, 5, 7]) # car, motorcycle, bus, truck (COCO classes)
                
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        
                        # Extract vehicle image
                        vehicle_img = frame[y1:y2, x1:x2]
                        
                        if vehicle_img.size > 0:
                            # Use EasyOCR to read plate
                            ocr_results = reader.readtext(vehicle_img)
                            for (bbox, text, prob) in ocr_results:
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
