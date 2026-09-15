import asyncio
import websockets
import json

async def listen_for_alerts():
    uri = "ws://localhost:8000/alerts"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Listening for alerts...\n" + "-"*40)
            while True:
                message = await websocket.recv()
                alert = json.loads(message)
                
                alert_type = alert.get("type", "UNKNOWN").upper()
                print(f"🚨 {alert_type} ALERT!")
                print(f"  Plate: {alert.get('plate')}")
                print(f"  Camera: {alert.get('camera_id')}")
                print(f"  Reason: {alert.get('reason')}")
                print(f"  Confidence: {alert.get('confidence')}")
                print("-" * 40)
    except Exception as e:
        print(f"Disconnected: {e}")

if __name__ == "__main__":
    asyncio.run(listen_for_alerts())
