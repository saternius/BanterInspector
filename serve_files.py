#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os, sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def send_response(self, code, message=None):
        print(f"[DEBUG] send_response({code}) for {self.path}")
        super().send_response(code, message)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')

    def do_OPTIONS(self):
        print(f"[DEBUG] OPTIONS preflight for {self.path}")
        self.send_response(200)
        self.end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9931
    directory = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
    os.chdir(directory)
    print(f"Serving {directory!r} on http://0.0.0.0:{port} with CORS enabled")
    HTTPServer(('0.0.0.0', port), CORSRequestHandler).serve_forever()
