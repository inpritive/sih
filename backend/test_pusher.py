import requests
import json
import time
from datetime import datetime, timezone

API_URL = "http://localhost:8000/sighting"

# The three plates we blacklisted in seed_db.py
test_sightings = [
    {
        "plate": "KA01AB1234",
        "camera_id": "cam_1",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": 0.95,
        "vehicle_type": "car",
        "color": "white"
    },
    {
        "plate": "MH02CD5678",
        "camera_id": "cam_2",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": 0.88,
        "vehicle_type": "truck",
        "color": "blue"
    },
    {
        "plate": "DL3CBB1111",
        "camera_id": "cam_3",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": 0.99,
        "vehicle_type": "motorcycle",
        "color": "black"
    }
]

print("Pushing test sightings to the backend to trigger alerts...")

for sighting in test_sightings:
    print(f"\nSending plate {sighting['plate']}...")
    try:
        response = requests.post(API_URL, json=sighting)
        if response.status_code == 200:
            print("  Success! Check your WebSocket terminal.")
        else:
            print(f"  Failed: {response.text}")
    except Exception as e:
        print(f"  Error: {e}")
    time.sleep(2)

print("\nDone pushing test data.")
