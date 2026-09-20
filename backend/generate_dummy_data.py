import urllib.request
import json
import random
from datetime import datetime, timedelta, timezone
import time

API_URL = "https://sih-gvvh.onrender.com/sighting"

def send_sighting(sighting):
    req = urllib.request.Request(API_URL, method="POST")
    req.add_header('Content-Type', 'application/json')
    data = json.dumps(sighting).encode('utf-8')
    try:
        urllib.request.urlopen(req, data=data)
        return True
    except Exception as e:
        print("Failed:", e)
        return False

def seed_sightings():
    cameras = ["cam_1", "cam_2", "cam_3", "cam_4"]
    
    # 1. Generate trajectories for specific vehicles to track
    target_plates = [
        {"plate": "KA01AB1234", "type": "car", "color": "white"},
        {"plate": "DL03CC8899", "type": "truck", "color": "blue"},
        {"plate": "MH02XY5544", "type": "motorcycle", "color": "black"},
        {"plate": "KA05MJ4411", "type": "car", "color": "silver"}
    ]
    
    for target in target_plates:
        print(f"Generating trajectory for {target['plate']}...")
        base_time = datetime.now(timezone.utc) - timedelta(hours=2)
        
        # Shuffle cameras so trajectories aren't all identical
        traj_cameras = cameras.copy()
        random.shuffle(traj_cameras)
        
        for i, cam_id in enumerate(traj_cameras):
            sighting_time = base_time + timedelta(minutes=i*15)
            s = {
                "plate": target['plate'],
                "camera_id": cam_id,
                "timestamp": sighting_time.isoformat(),
                "confidence": round(random.uniform(0.85, 0.99), 2),
                "vehicle_type": target['type'],
                "color": target['color']
            }
            send_sighting(s)
        
    # 2. Generate random background traffic
    print("Generating background traffic for analytics (this will take a few seconds)...")
    plates = [f"MH{random.randint(10,99)}AB{random.randint(1000,9999)}" for _ in range(50)]
    vehicle_types = ["car", "truck", "motorcycle", "bus"]
    colors = ["white", "black", "red", "blue", "silver", "yellow"]
    
    success_count = 0
    # Add 50 random sightings over the last 24 hours
    for _ in range(50):
        s = {
            "plate": random.choice(plates),
            "camera_id": random.choice(cameras),
            "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=random.randint(0, 1440))).isoformat(),
            "confidence": round(random.uniform(0.65, 0.99), 2),
            "vehicle_type": random.choice(vehicle_types),
            "color": random.choice(colors)
        }
        if send_sighting(s):
            success_count += 1
            
    print(f"Successfully added trajectory for KA05XYZ9999 and {success_count} random sightings to the live database!")

if __name__ == "__main__":
    seed_sightings()
