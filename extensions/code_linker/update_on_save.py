import time
import os
import sys
import requests

linker_port = 5005


print(sys.argv)
print("Inventory Link: " + os.getcwd())
cur_path = f"{os.getcwd()}/extensions/code_linker"
target_path = sys.argv[1]
if(target_path.startswith(cur_path)):
    target_path = target_path[len(cur_path)+1:]
    print("TargetPath: " + target_path)
else:
    print("TargetPath: " + target_path + " is not in the current path: " + cur_path)
    exit()

requests.get(f"http://localhost:{linker_port}/save?file={target_path}")