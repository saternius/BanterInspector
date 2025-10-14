#!/usr/bin/env python3
import json
import sys
import os


def simplify(data):
    return data
    # if('message' in data):
    #     content = data['message']['content']
    #     if type(content) == str:
    #         content = [content]
            
    #     for content_item in content:
    #         if 'signature' in content_item:
    #             del content_item['signature']
            
    #     return {
    #         'role': data['message']['role'],
    #         'content': content
    #     }
    # return {}

# Read JSON from stdin
data = json.load(sys.stdin)

try:
    transcript_data = open(data['transcript_path']).read().strip().split("\n")
    # data['data'] = transcript_data
    data['transcript'] = [simplify(json.loads(data)) for data in transcript_data]
except Exception as e:
    data['error'] = str(e)

outfile = open(".claude/last_status.json", "w")
outfile.write(json.dumps(data))
outfile.close()

# Extract values
model = data['model']['display_name']
current_dir = os.path.basename(data['workspace']['current_dir'])

# Check for git branch
git_branch = ""
if os.path.exists('.git'):
    try:
        with open('.git/HEAD', 'r') as f:
            ref = f.read().strip()
            if ref.startswith('ref: refs/heads/'):
                git_branch = f" | 🌿 {ref.replace('ref: refs/heads/', '')}"
    except:
        pass

# Check streaming status
streaming_status = ""
try:
    with open('.claude/streaming', 'r') as f:
        content = f.read().strip()
        if content.lower() == 'true':
            streaming_status = " \033[91m🔴 Streaming\033[0m"  # Red color with ANSI codes
except:
    pass

print(f"[{model}] {streaming_status}")