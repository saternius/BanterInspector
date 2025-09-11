#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os, sys
import urllib.request
import json
import hashlib

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
        print(f"[DEBUG] GET request for {self.path}")
        if self.path.startswith('/api/fetch_glb'):
            try:
                # Parse query parameters
                from urllib.parse import urlparse, parse_qs
                parsed_url = urlparse(self.path)
                query_params = parse_qs(parsed_url.query)
                
                # Get the file hash
                file_hash = query_params.get('file', [''])[0]
                
                if not file_hash:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    error_response = json.dumps({'error': 'Missing file parameter'})
                    self.wfile.write(error_response.encode())
                    return
                
                # Build file path
                assets_dir = os.path.join(os.getcwd(), 'assets', 'glbs')
                file_path = os.path.join(assets_dir, f'{file_hash}.glb')
                
                # Check if file exists
                if not os.path.exists(file_path):
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    error_response = json.dumps({'error': 'File not found'})
                    self.wfile.write(error_response.encode())
                    return
                
                # Read and serve the GLB file
                with open(file_path, 'rb') as f:
                    glb_data = f.read()
                
                print(f"[DEBUG] Serving GLB file: {file_hash}.glb ({len(glb_data)} bytes)")
                
                self.send_response(200)
                self.send_header('Content-Type', 'model/gltf-binary')
                self.send_header('Content-Length', str(len(glb_data)))
                self.end_headers()
                self.wfile.write(glb_data)
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({'error': str(e)})
                self.wfile.write(error_response.encode())
        elif self.path == '/something-for-the-time':
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
        print(f"[DEBUG] POST request for {self.path}")
        if self.path == '/api/store_glb':
            try:
                content_length = int(self.headers['Content-Length'])
                
                # Check file size (20MB limit)
                if content_length > 20 * 1024 * 1024:
                    self.send_response(413)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    error_response = json.dumps({'error': 'File size exceeds 20MB limit'})
                    self.wfile.write(error_response.encode())
                    return
                
                # Read the GLB data
                glb_data = self.rfile.read(content_length)
                
                # Generate hash for the file
                file_hash = hashlib.sha256(glb_data).hexdigest()
                
                # Create assets/glbs directory if it doesn't exist
                assets_dir = os.path.join(os.getcwd(), 'assets', 'glbs')
                os.makedirs(assets_dir, exist_ok=True)
                
                # Save the GLB file
                file_path = os.path.join(assets_dir, f'{file_hash}.glb')
                with open(file_path, 'wb') as f:
                    f.write(glb_data)
                
                print(f"[DEBUG] Stored GLB file: {file_hash}.glb ({content_length} bytes)")
                
                # Return the hash
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = json.dumps({'hash': file_hash})
                self.wfile.write(response.encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({'error': str(e)})
                self.wfile.write(error_response.encode())
        elif self.path == '/api/process-text':
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
        elif self.path == '/setclaims':
            # Proxy /setclaims requests to auth server on port 3303
            print(f"[DEBUG] Proxying {self.path} to http://localhost:3303")
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                req = urllib.request.Request(
                    'http://localhost:3303/setclaims',
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
                
            except urllib.error.HTTPError as e:
                # Pass through the status code and response from auth server
                proxy_response = e.read()
                self.send_response(e.code)
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
    # Check if running in Docker (frontend mounted at /app/frontend)
    if os.path.exists('/app/frontend'):
        directory = '/app/frontend'
    else:
        # Local development path
        directory = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'frontend')
    os.chdir(directory)
    print(f"Serving {directory!r} on http://0.0.0.0:{port} with CORS enabled")
    print(f"GLB Storage: POST /api/store_glb (max 20MB) → returns hash")
    print(f"GLB Retrieval: GET /api/fetch_glb?file=<hash>")
    print(f"Proxying /api/process-text to http://localhost:5000/process-text")
    print(f"Proxying /docs/* to http://localhost:4004/docs/*")
    print(f"Proxying /setclaims to http://localhost:3303/setclaims")
    HTTPServer(('0.0.0.0', port), CORSRequestHandler).serve_forever()
