#!/usr/bin/env python3
import json
import sys
import os
import tempfile
import time

# Create test transcript data with multiple messages
messages = [
    {
        "sessionId": "test-session",
        "timestamp": f"timestamp-{int(time.time())}-1",
        "message": {
            "role": "user",
            "content": "First test message for Firebase"
        }
    },
    {
        "sessionId": "test-session",
        "timestamp": f"timestamp-{int(time.time())}-2",
        "message": {
            "role": "assistant",
            "content": [{"text": "Second test message from assistant"}]
        }
    },
    {
        "sessionId": "test-session",
        "timestamp": f"timestamp-{int(time.time())}-3",
        "message": {
            "role": "user",
            "content": "Third test message"
        }
    }
]

# Create a temporary transcript file with multiple entries
transcript_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.jsonl')
for msg in messages:
    transcript_file.write(json.dumps(msg) + "\n")
transcript_file.close()

# Create test input data pointing to the transcript file
test_data = {
    "sessionId": "test-session",
    "timestamp": f"timestamp-{int(time.time())}",
    "model": {
        "display_name": "Test Model"
    },
    "workspace": {
        "current_dir": "/test/dir"
    },
    "transcript_path": transcript_file.name
}

# Write test data to temp file
input_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
json.dump(test_data, input_file)
input_file.close()

print(f"📝 Testing Firebase streaming with {len(messages)} messages")
print(f"   Transcript: {transcript_file.name}")
print(f"   Input data: {input_file.name}")

# Run status_line.py with test data
import subprocess
result = subprocess.run(
    [sys.executable, 'status_line.py'],
    stdin=open(input_file.name, 'r'),
    capture_output=True,
    text=True,
    cwd=os.path.dirname(os.path.abspath(__file__))
)

print("\n📤 Output from status_line.py:")
if result.stdout:
    print("STDOUT:", result.stdout.strip())

if result.stderr:
    print("STDERR:", result.stderr.strip())

# Clean up
os.unlink(transcript_file.name)
os.unlink(input_file.name)

if result.returncode == 0:
    print("\n✅ Test completed successfully!")
    print(f"   {len(messages)} messages should now be in Firebase")
    print("   Run verify_firebase.py to check the stream")
else:
    print(f"\n❌ Test failed with return code {result.returncode}")