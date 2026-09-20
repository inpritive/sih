import cv2
import numpy as np

# Create a 30 fps video with 60 frames (2 seconds)
width, height = 640, 480
out = cv2.VideoWriter('dummy_traffic.mp4', cv2.VideoWriter_fourcc(*'mp4v'), 30, (width, height))

for i in range(60):
    img = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Draw a "car" (rectangle)
    # Move the car across the screen
    x1 = 100 + i * 5
    y1 = 200
    x2 = x1 + 150
    y2 = y1 + 100
    cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), -1)
    
    # Draw a "license plate" (smaller rectangle inside car)
    px1, py1 = x1 + 30, y1 + 40
    px2, py2 = px1 + 90, py1 + 30
    cv2.rectangle(img, (px1, py1), (px2, py2), (255, 255, 255), -1)
    
    # Draw text on the plate
    # Only put text on it after frame 10 so it moves and YOLO detects it
    cv2.putText(img, 'KA01AB1234', (px1 + 2, py2 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)
    
    out.write(img)

out.release()
print("dummy_traffic.mp4 created")
