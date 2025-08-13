#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os, sys
import urllib.request
import json

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def send_response(self, code, message=None):
        print(f"[DEBUG] send_response({code}) for {self.path}")
        super().send_response(code, message)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')

    def do_OPTIONS(self):
        print(f"[DEBUG] OPTIONS preflight for {self.path}")
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/something-for-the-time':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'10a5233475ee42a7a87f5e15ce23b688')
        elif self.path.startswith('/docs'):
            # Proxy /docs requests to localhost:4004
            try:
                # Ensure trailing slash for /docs root
                proxy_path = self.path if self.path != '/docs' else '/docs/'
                print(f"[DEBUG] Proxying {self.path} to http://localhost:4004{proxy_path}")
                req = urllib.request.Request(f'http://localhost:4004{proxy_path}')
                with urllib.request.urlopen(req) as response:
                    content = response.read()
                    content_type = response.headers.get('Content-Type', 'text/html')
                    
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_response(502)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(f'Proxy error: {str(e)}'.encode())
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/process-text':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                req = urllib.request.Request(
                    'http://localhost:5000/process-text',
                    data=post_data,
                    headers={
                        'Content-Type': self.headers.get('Content-Type', 'application/json')
                    }
                )
                
                with urllib.request.urlopen(req) as response:
                    proxy_response = response.read()
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(proxy_response)
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({'error': str(e)})
                self.wfile.write(error_response.encode())
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9909
    directory = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'frontend')
    os.chdir(directory)
    print(f"Serving {directory!r} on http://0.0.0.0:{port} with CORS enabled")
    print(f"Proxying /api/process-text to http://localhost:5000/process-text")
    print(f"Proxying /docs/* to http://localhost:4004/docs/*")
    HTTPServer(('0.0.0.0', port), CORSRequestHandler).serve_forever()
