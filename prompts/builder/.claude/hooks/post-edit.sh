#!/bin/bash
# Claude Post-Edit Hook - Automatically syncs files after Claude edits them

INSPECTOR_ROOT="/home/jason/Desktop/sdq3/SideQuest.Banter.Unity/Injection/inspector"
CLAUDE_SYNC="${INSPECTOR_ROOT}/prompts/builder/extensions/code_linker/claude_sync.py"

# Check if a file path was provided
if [ $# -eq 0 ]; then
    echo "No file path provided to post-edit hook"
    exit 1
fi

FILE_PATH="$1"

# Check if the file is in the inventory directory
if [[ "$FILE_PATH" == *"/prompts/builder/extensions/code_linker/inventory/"* ]]; then
    echo "Post-edit hook: Syncing $FILE_PATH"
    python3 "$CLAUDE_SYNC" "$FILE_PATH"
else
    echo "Post-edit hook: File is not in inventory directory, skipping sync"
fi
