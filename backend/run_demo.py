import subprocess
import argparse
import sys
import time

def main():
    parser = argparse.ArgumentParser(description='Run Demo Video Feeders')
    parser.add_argument('--api-url', type=str, default="http://127.0.0.1:8000", help='Backend API URL')
    args = parser.parse_args()

    # Map the provided Cloudinary videos to the respective database cameras
    feeds = [
        {
            "camera_id": "cam_1",
            "name": "MG Road",
            "video": "https://res.cloudinary.com/qyxcufjw/video/upload/v1789885380/cam_1.mp4"
        },
        {
            "camera_id": "cam_4",
            "name": "Whitefield",
            "video": "https://res.cloudinary.com/qyxcufjw/video/upload/v1789892763/FInal_Whitefield.mp4"
        },
        {
            "camera_id": "cam_3",
            "name": "Indiranagar",
            "video": "https://res.cloudinary.com/qyxcufjw/video/upload/v1789892595/cam4_Indiranagar_1080p_20260920131718.mp4"
        },
        {
            "camera_id": "cam_2",
            "name": "Koramangala",
            "video": "https://res.cloudinary.com/qyxcufjw/video/upload/v1789916802/WhatsApp_Video_2026-09-20_at_8.36.17_PM.mp4"
        }
    ]

    processes = []
    
    print(f"Starting 4 video feeders targeting API: {args.api_url}")
    print("Press Ctrl+C to stop all feeders.")
    print("-" * 50)

    try:
        for feed in feeds:
            print(f"[*] Launching {feed['name']} ({feed['camera_id']}) stream...")
            cmd = [
                sys.executable, "feeder.py",
                "--video", feed["video"],
                "--camera-id", feed["camera_id"],
                "--api-url", args.api_url
            ]
            
            # We don't pipe stdout so it prints to the console in parallel
            # The output might interleave, but it shows live activity!
            p = subprocess.Popen(cmd)
            processes.append(p)
            time.sleep(2) # stagger start times slightly

        # Wait for them to finish
        for p in processes:
            p.wait()

    except KeyboardInterrupt:
        print("\nStopping all video feeds...")
        for p in processes:
            p.terminate()
        
        print("Demo stopped successfully.")

if __name__ == '__main__':
    main()
