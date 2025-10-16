#!/usr/bin/env python3
import json
import sys
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Initialize Firebase Admin SDK
try:
    # Path to firebase-service.json in the microservices/auth-server directory
    service_account_path = '/home/jason/Desktop/sdq3/SideQuest.Banter.Unity/Injection/inspector/microservices/auth-server/firebase-service.json'
    
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://inspector-6bad1-default-rtdb.firebaseio.com'
    })

    # Get database reference for stream
    stream_ref = db.reference('stream')
    firebase_initialized = True
except Exception as e:
    print(f"Warning: Failed to initialize Firebase: {e}", file=sys.stderr)
    firebase_initialized = False

sent_already = set()
def send(message):
    if message['timestamp'] in sent_already: return
    sent_already.add(message['timestamp'])

    # Also append to Firebase if initialized
    if firebase_initialized:
        try:
            stream_ref.push(message)
        except Exception as e:
            print(f"Warning: Failed to send to Firebase: {e}", file=sys.stderr)

def simplify(data):
    if('message' in data):
        content = data['message']['content']
        if type(content) == str:
            content = [content]
            
        for content_item in content:
            if 'signature' in content_item:
                del content_item['signature']
        
        message = {
            "session_id": data['sessionId'],
            'timestamp': data['timestamp'],
            'role': data['message']['role'],
            'content': content
        }
        send(message)
        return message
    
    return {}

# Read JSON from stdin
data = json.load(sys.stdin)

config_path = "/home/jason/Desktop/sdq3/SideQuest.Banter.Unity/Injection/inspector/prompts/builder/.claude"

# Check streaming status
with open(f'{config_path}/streaming', 'r') as f:
    content = f.read().strip()
    stream = content.lower() == 'true'

    streaming_status = " \033[91m🔴 Streaming\033[0m" if stream else ""
    print(f"[{data['model']['display_name']}] {streaming_status}")
    
    
    if stream:
        transcript_data = open(data['transcript_path']).read().strip().split("\n")
        data['transcript'] = [simplify(json.loads(data)) for data in transcript_data]

    
# last_status_path = f"{config_path}/last_status.json"
# outfile = open(last_status_path, "w")
# outfile.write(json.dumps(data))
# outfile.close()