import time
import os
import sys
print(sys.argv)
print("Inventory Link: " + os.getcwd())
outfile = open("output.txt", "a+")
outfile.write("howdsy " + str(time.time()) + "\n")
outfile.close()