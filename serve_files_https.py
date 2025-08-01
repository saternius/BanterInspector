#!/usr/bin/env python3
import ssl
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
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9909
    directory = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
    os.chdir(directory)
    
    server = HTTPServer(('0.0.0.0', port), CORSRequestHandler)
    
    # Create SSL context with self-signed certificate
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    
    # Generate self-signed cert if it doesn't exist
    cert_file = 'server.pem'
    if not os.path.exists(cert_file):
        print("Generating self-signed certificate...")
        os.system(f'openssl req -new -x509 -keyout {cert_file} -out {cert_file} -days 365 -nodes -subj "/CN=localhost"')
    
    context.load_cert_chain(cert_file)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    
    print(f"Serving {directory!r} on https://0.0.0.0:{port} with CORS enabled")
    print(f"Note: You'll need to accept the self-signed certificate in your browser")
    server.serve_forever()