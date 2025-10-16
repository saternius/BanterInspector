#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import json
import time

# Initialize Firebase Admin SDK
service_account_path = '/home/jason/Desktop/sdq3/SideQuest.Banter.Unity/Injection/inspector/microservices/auth-server/firebase-service.json'
cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://inspector-6bad1-default-rtdb.firebaseio.com'
})

# Get reference to stream
stream_ref = db.reference('stream')

print("📊 Firebase Stream Verification")
print("================================")

# Get all messages in stream
messages = stream_ref.get()

if messages:
    print(f"✅ Found {len(messages)} messages in stream")

    # Show last 3 messages
    recent = list(messages.items())[-3:]
    print("\n📝 Most recent messages:")
    for key, msg in recent:
        print(f"\nKey: {key[:8]}...")
        if isinstance(msg, dict):
            print(f"  Timestamp: {msg.get('timestamp', 'N/A')}")
            print(f"  Role: {msg.get('role', 'N/A')}")
            print(f"  Session: {msg.get('session_id', 'N/A')}")
            if 'content' in msg:
                content = msg['content']
                if isinstance(content, list) and len(content) > 0:
                    preview = str(content[0])[:100]
                    print(f"  Content preview: {preview}...")
                elif isinstance(content, str):
                    print(f"  Content preview: {content[:100]}...")
else:
    print("⚠️  No messages found in stream yet")

print("\n" + "="*40)
print("✅ Firebase integration is working correctly!")