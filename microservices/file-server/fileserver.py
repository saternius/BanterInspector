#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os, sys
import urllib.request
import json
import hashlib
import time
import random
try:
    import firebase_admin
    from firebase_admin import credentials, db
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("[WARNING] Firebase Admin SDK not installed. Run: pip install firebase-admin")

# Initialize Firebase Admin SDK if available
if FIREBASE_AVAILABLE:
    try:
        # Try to load service account from file
        service_account_path = os.path.join(os.path.dirname(__file__), '..', 'auth-server', 'firebase-service.json')
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://inspector-6bad1-default-rtdb.firebaseio.com'
            })
            print("[INFO] Firebase Admin SDK initialized with service account")
        else:
            # Initialize without credentials for public access
            firebase_admin.initialize_app(options={
                'databaseURL': 'https://inspector-6bad1-default-rtdb.firebaseio.com'
            })
            print("[INFO] Firebase initialized with public access (no service account found)")
    except Exception as e:
        print(f"[WARNING] Failed to initialize Firebase: {e}")
        FIREBASE_AVAILABLE = False

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
        if self.path.startswith('/api/store_glb'):
            try:
                content_length = int(self.headers['Content-Length'])
                content_type = self.headers.get('Content-Type', '')
                
                # Parse query parameters from URL
                from urllib.parse import urlparse, parse_qs
                parsed_url = urlparse(self.path)
                query_params = parse_qs(parsed_url.query)
                
                username = ''
                secret = ''
                mesh_name = ''
                glb_data = None
                
                # Handle different content types
                if 'multipart/form-data' in content_type:
                    # Handle multipart form data
                    import cgi
                    import io
                    
                    # Create proper environment for FieldStorage
                    environ = {
                        'REQUEST_METHOD': 'POST',
                        'CONTENT_TYPE': self.headers['Content-Type'],
                        'CONTENT_LENGTH': str(content_length)
                    }
                    
                    # Parse multipart data
                    form_data = cgi.FieldStorage(
                        fp=self.rfile,
                        headers=self.headers,
                        environ=environ
                    )
                    
                    # Extract fields
                    username = form_data.getvalue('username', '')
                    secret = form_data.getvalue('secret', '')
                    mesh_name = form_data.getvalue('mesh_name', '')
                    
                    # Get GLB file data
                    if 'file' in form_data:
                        glb_field = form_data['file']
                        if glb_field.filename:
                            glb_data = glb_field.file.read()
                        else:
                            glb_data = glb_field.value
                            
                elif 'application/json' in content_type:
                    # Handle JSON with base64 encoded GLB
                    body = self.rfile.read(content_length)
                    data = json.loads(body)
                    
                    username = data.get('username', '')
                    secret = data.get('secret', '')
                    mesh_name = data.get('mesh_name', '')
                    
                    # Decode base64 GLB data if provided
                    import base64
                    glb_base64 = data.get('glb_data', '')
                    if glb_base64:
                        glb_data = base64.b64decode(glb_base64)
                        
                else:
                    # Handle raw binary with query parameters
                    username = query_params.get('username', [''])[0]
                    secret = query_params.get('secret', [''])[0]
                    mesh_name = query_params.get('mesh_name', [''])[0]
                    
                    # Read raw GLB data
                    glb_data = self.rfile.read(content_length)
                
                # Check if GLB data was provided
                if not glb_data:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    error_response = json.dumps({'error': 'No GLB data provided'})
                    self.wfile.write(error_response.encode())
                    return
                
                # Check file size (40MB limit)
                if len(glb_data) > 40 * 1024 * 1024:
                    self.send_response(413)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    error_response = json.dumps({'error': 'File size exceeds 40MB limit'})
                    self.wfile.write(error_response.encode())
                    return
                
                # Generate hash for the file
                file_hash = hashlib.sha256(glb_data).hexdigest()
                
                # Create assets/glbs directory if it doesn't exist
                assets_dir = os.path.join(os.getcwd(), 'assets', 'glbs')
                os.makedirs(assets_dir, exist_ok=True)
                
                # Save the GLB file
                file_path = os.path.join(assets_dir, f'{file_hash}.glb')
                with open(file_path, 'wb') as f:
                    f.write(glb_data)
                
                # Generate default mesh name if not provided
                if not mesh_name:
                    mesh_name = f'mesh_{random.randint(0, 9999)}'

                print(f"[DEBUG] Stored GLB file: {file_hash}.glb ({len(glb_data)} bytes)")
                print(f"[DEBUG] Username: {username if username else 'None'}, Secret: {'***' if secret else 'None'}, Mesh: {mesh_name}")
                
                # Store reference in Firebase if credentials provided
                firebase_path = None
                if username and secret and FIREBASE_AVAILABLE:
                    try:
                        # Sanitize username and secret for Firebase path
                        def sanitize_firebase_key(s):
                            return s.replace('.', '_').replace('$', '_').replace('#', '_').replace('[', '_').replace(']', '_').replace('/', '_')
                        
                        sanitized_username = sanitize_firebase_key(username)
                        sanitized_secret = sanitize_firebase_key(secret)
                        
                        # Create Firebase reference path
                        firebase_path = f'glb_loader/{sanitized_username}_{sanitized_secret}'
                        
                        # Store the hash with metadata in Firebase
                        ref = db.reference(firebase_path)
                        ref.set({
                            'hash': file_hash,
                            'username': username,
                            'mesh_name': mesh_name,
                            'timestamp': int(time.time() * 1000),
                            'size': len(glb_data),
                            'url': f'/api/fetch_glb?file={file_hash}'
                        })
                        
                        print(f"[DEBUG] Stored reference in Firebase at: {firebase_path}")
                        
                    except Exception as fb_error:
                        print(f"[WARNING] Failed to store in Firebase: {fb_error}")
                        # Continue even if Firebase fails - file is still saved locally
                
                # Return the hash and metadata
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = json.dumps({
                    'hash': file_hash,
                    'message': 'GLB stored successfully',
                    'mesh_name': mesh_name,
                    'size': len(glb_data),
                    'firebase_path': firebase_path
                })
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
    print(f"GLB Storage: POST /api/store_glb?username=<user>&secret=<secret>&mesh_name=<name> (max 40MB) → returns hash")
    print(f"  - Accepts: raw binary, JSON with base64, or multipart/form-data")
    print(f"  - Stores reference in Firebase at: glb_loader/<username>_<secret>")
    print(f"  - mesh_name defaults to 'mesh_<random>' if not provided")
    print(f"GLB Retrieval: GET /api/fetch_glb?file=<hash>")
    print(f"Proxying /api/process-text to http://localhost:5000/process-text")
    print(f"Proxying /docs/* to http://localhost:4004/docs/*")
    print(f"Proxying /setclaims to http://localhost:3303/setclaims")
    HTTPServer(('0.0.0.0', port), CORSRequestHandler).serve_forever()
