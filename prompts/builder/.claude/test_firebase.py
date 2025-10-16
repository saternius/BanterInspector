#!/usr/bin/env python3
import json
import sys
import os

# Test the status_line module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Create a test input that status_line.py expects
test_data = {
    "sessionId": "test-session",
    "timestamp": "test-timestamp-123",
    "message": {
        "role": "user",
        "content": "Test message for Firebase"
    },
    "model": {
        "display_name": "Test Model"
    },
    "workspace": {
        "current_dir": "/test/dir"
    },
    "transcript_path": "/dev/null"  # Non-existent file to test error handling
}

# Write test data to temp file
import tempfile
with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
    json.dump(test_data, f)
    temp_file = f.name

# Run status_line.py with test data
import subprocess
result = subprocess.run(
    [sys.executable, 'status_line.py'],
    stdin=open(temp_file, 'r'),
    capture_output=True,
    text=True,
    cwd=os.path.dirname(os.path.abspath(__file__))
)

print("STDOUT:")
print(result.stdout)
print("\nSTDERR:")
print(result.stderr)

# Clean up
os.unlink(temp_file)

if result.returncode == 0:
    print("\n✅ Test completed successfully")
else:
    print(f"\n❌ Test failed with return code {result.returncode}")