import os
os.environ["FLAGS_use_mkldnn"] = "False"
os.environ["KMP_DUPLICATE_LIB_OK"] = "True"

import cv2
import time
import requests
import json
from datetime import datetime, timezone
import argparse
import random
from ultralytics import YOLO
import easyocr

API_URL = "https://anpr-backend-4c60.onrender.com"

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
    parser.add_argument('--api-url', type=str, default="https://anpr-backend-4c60.onrender.com", help='Backend API URL')
    args = parser.parse_args()

    global API_URL
    API_URL = args.api_url.rstrip("/")

    print(f"Loading YOLO model...")
    yolo_model = YOLO('yolov8n.pt') 

    print(f"Loading EasyOCR...")
    try:
        reader = easyocr.Reader(['en'])
        use_real_ocr = True
    except Exception as e:
        print(f"Failed to load EasyOCR, using simulated plates. Error: {e}")
        use_real_ocr = False

    if args.video.startswith("http://") or args.video.startswith("https://"):
        video_path = args.video
    else:
        video_path = os.path.abspath(args.video)
        
    print(f"Trying to open video at path: {video_path}")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video stream or file: {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30 # fallback
    
    frame_count = 0
    last_demo1_time = 0
    last_demo2_time = 0

    while(cap.isOpened()):
        ret, frame = cap.read()
        if ret == True:
            # Process ~1 frame per second
            if frame_count % int(fps) == 0:
                print(f"Processing frame {frame_count}, shape: {frame.shape}...")
                
                # YOLOv8 object detection
                results = yolo_model(frame, classes=[2, 3, 5, 7], device='cpu') # car, motorcycle, bus, truck
                
                detected_boxes = []
                for r in results:
                    for box in r.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        detected_boxes.append((x1, y1, x2, y2, cls, conf))

                # Focus on the 1-2 most prominent vehicles in frame to maintain realistic traffic volume
                detected_boxes.sort(key=lambda b: (b[2] - b[0]) * (b[3] - b[1]), reverse=True)

                for box_data in detected_boxes[:2]:
                    x1, y1, x2, y2, cls, conf = box_data
                    vehicle_img = frame[y1:y2, x1:x2]
                    
                    if vehicle_img.size > 0:
                        ocr_results = None
                        if use_real_ocr:
                            try:
                                h, w = vehicle_img.shape[:2]
                                if w < 100:
                                    vehicle_img = cv2.resize(vehicle_img, (w*2, h*2), interpolation=cv2.INTER_CUBIC)
                                ocr_results = reader.readtext(vehicle_img)
                            except Exception as e:
                                print(f"EasyOCR crash caught: {e}. Falling back to simulated plate reading.")
                                ocr_results = None
                        
                        plate_str = None
                        prob = 0.96
                        if ocr_results:
                            for res in ocr_results:
                                bbox, text, p = res
                                if len(text) > 4:
                                    plate_str = text.upper().replace(" ", "")
                                    prob = float(p)
                                    break
                        
                        if not plate_str:
                            import random
                            state = random.choice(['KA', 'MH', 'DL', 'TN', 'TS'])
                            dist = f"{random.randint(1, 99):02d}"
                            chars = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=2))
                            nums = f"{random.randint(1000, 9999)}"
                            plate_str = f"{state}{dist}{chars}{nums}"
                        
                        # --- INJECT DEMO TRACKING VEHICLES VIA WALL-CLOCK TIMELINES ---
                        now_sec = time.time()
                        cycle_60 = int(now_sec) % 60

                        # Vehicle 1: DEMOCA01 (Moves: cam_1 -> cam_3 -> cam_2 -> cam_4)
                        demo1_windows = {
                            "cam_1": (0, 15),
                            "cam_3": (15, 30),
                            "cam_2": (30, 45),
                            "cam_4": (45, 60),
                        }
                        if args.camera_id in demo1_windows:
                            w_start, w_end = demo1_windows[args.camera_id]
                            if w_start <= cycle_60 < w_end and (now_sec - last_demo1_time > 45):
                                plate_str = "DEMOCA01"
                                last_demo1_time = now_sec

                        # Vehicle 2: DEMOCA02 (Moves: cam_4 -> cam_2 -> cam_3 -> cam_1)
                        demo2_windows = {
                            "cam_4": (0, 15),
                            "cam_2": (15, 30),
                            "cam_3": (30, 45),
                            "cam_1": (45, 60),
                        }
                        if args.camera_id in demo2_windows:
                            w_start, w_end = demo2_windows[args.camera_id]
                            if w_start <= cycle_60 < w_end and (now_sec - last_demo2_time > 45):
                                plate_str = "DEMOCA02"
                                last_demo2_time = now_sec

                        sighting = {
                            "plate": plate_str,
                            "camera_id": args.camera_id,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "confidence": float(prob),
                            "vehicle_type": yolo_model.names[cls],
                            "color": "unknown"
                        }
                        print(f"Sighting detected: {sighting['plate']} on {sighting['camera_id']}")
                        try:
                            requests.post(f"{API_URL}/sighting", json=sighting, timeout=2.0)
                        except Exception as e:
                            print(f"Error posting sighting: {e}")

            frame_count += 1
            
        else: 
            print("Video ended, looping back to start...")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            frame_count = 0
            continue
            
    cap.release()

if __name__ == "__main__":
    main()
