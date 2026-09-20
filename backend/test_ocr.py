import cv2
import numpy as np
from paddleocr import PaddleOCR
from ultralytics import YOLO

# Test YOLO
try:
    print("Testing YOLO loading...")
    model = YOLO('yolov8n.pt')
    print("YOLO loaded successfully.")
except Exception as e:
    print(f"YOLO error: {e}")

# Test PaddleOCR
try:
    print("Testing PaddleOCR loading...")
    ocr = PaddleOCR(use_angle_cls=True, lang='en')
    
    # create a dummy image with some text
    img = np.zeros((100, 300, 3), dtype=np.uint8)
    cv2.putText(img, 'MH12AB1234', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.imwrite('dummy_plate.jpg', img)

    result = ocr.ocr('dummy_plate.jpg', cls=True)
    print("PaddleOCR result:", result)
except Exception as e:
    print(f"PaddleOCR error: {e}")
