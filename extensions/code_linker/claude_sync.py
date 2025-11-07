#!/usr/bin/env python3
"""
Claude Sync Script - Automatically syncs inventory files to the game
This script is called by Claude after editing files to trigger the update_on_save mechanism
"""

import sys
import os
import subprocess
import time
from pathlib import Path

# Port for the linker service
LINKER_PORT = 5005

# Base paths
INSPECTOR_ROOT = Path("/home/jason/Desktop/sdq3/SideQuest.Banter.Unity/Injection/inspector")
CODE_LINKER_PATH = INSPECTOR_ROOT / "extensions" / "code_linker"
INVENTORY_PATH = CODE_LINKER_PATH / "inventory"
UPDATE_SCRIPT = CODE_LINKER_PATH / "update_on_save.py"

def sync_file(file_path):
    """
    Sync a single file to the game using the existing update_on_save.py script

    Args:
        file_path: Path to the file to sync

    Returns:
        bool: True if successful, False otherwise
    """
    file_path = Path(file_path).resolve()

    # Check if file is in the inventory directory
    try:
        file_path.relative_to(INVENTORY_PATH)
    except ValueError:
        print(f"Warning: {file_path} is not in the inventory directory")
        return False

    # Check if file exists
    if not file_path.exists():
        print(f"Error: File {file_path} does not exist")
        return False

    # Call the update_on_save.py script
    try:
        print(f"Syncing: {file_path.name}")
        result = subprocess.run(
            [sys.executable, str(UPDATE_SCRIPT), str(file_path)],
            capture_output=True,
            text=True,
            cwd=str(INSPECTOR_ROOT)
        )

        if result.returncode == 0:
            print(f"✓ Successfully synced {file_path.name}")
            return True
        else:
            print(f"✗ Failed to sync {file_path.name}")
            if result.stderr:
                print(f"  Error: {result.stderr}")
            return False

    except Exception as e:
        print(f"✗ Error syncing {file_path.name}: {e}")
        return False

def sync_all_recent(minutes=5):
    """
    Sync all files modified in the last N minutes

    Args:
        minutes: Number of minutes to look back (default: 5)

    Returns:
        int: Number of files synced
    """
    print(f"Looking for files modified in the last {minutes} minutes...")

    current_time = time.time()
    cutoff_time = current_time - (minutes * 60)
    synced_count = 0

    # Find all .js and .json files in inventory
    for ext in ['*.js', '*.json']:
        for file_path in INVENTORY_PATH.rglob(ext):
            if file_path.stat().st_mtime >= cutoff_time:
                if sync_file(file_path):
                    synced_count += 1
                    time.sleep(0.1)  # Small delay between syncs

    return synced_count

def main():
    """Main entry point for the sync script"""

    if len(sys.argv) < 2:
        print("Claude Sync Tool")
        print("================")
        print("Usage:")
        print("  claude_sync.py <file_path>         - Sync a specific file")
        print("  claude_sync.py <file1> <file2> ... - Sync multiple files")
        print("  claude_sync.py --recent [minutes]  - Sync recently modified files")
        print("  claude_sync.py --all               - Sync all inventory files (use with caution)")
        sys.exit(1)

    # Handle special commands
    if sys.argv[1] == "--recent":
        minutes = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        count = sync_all_recent(minutes)
        print(f"\nSynced {count} file(s)")

    elif sys.argv[1] == "--all":
        response = input("This will sync ALL inventory files. Are you sure? (y/N): ")
        if response.lower() == 'y':
            count = 0
            for ext in ['*.js', '*.json']:
                for file_path in INVENTORY_PATH.rglob(ext):
                    if sync_file(file_path):
                        count += 1
                        time.sleep(0.1)
            print(f"\nSynced {count} file(s)")
        else:
            print("Cancelled")

    else:
        # Sync specific files
        success_count = 0
        fail_count = 0

        for file_arg in sys.argv[1:]:
            file_path = Path(file_arg).resolve()
            if sync_file(file_path):
                success_count += 1
            else:
                fail_count += 1

            # Small delay between files to avoid overwhelming the server
            if len(sys.argv) > 2:
                time.sleep(0.1)

        print(f"\nSummary: {success_count} succeeded, {fail_count} failed")
        sys.exit(0 if fail_count == 0 else 1)

if __name__ == "__main__":
    main()