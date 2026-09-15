import asyncio
import websockets
import json

async def listen_for_alerts():
    uri = "wss://sih-gvvh.onrender.com/alerts"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Listening for alerts...\n")
            # Wait for 10 seconds to see if it drops
            await asyncio.wait_for(websocket.recv(), timeout=10.0)
    except Exception as e:
        print(f"Disconnected or Error: {type(e).__name__} - {e}")

if __name__ == "__main__":
    asyncio.run(listen_for_alerts())
