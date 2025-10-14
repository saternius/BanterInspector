import requests
import json
import hashlib
from typing import Optional, Callable
from .. import config

class BanterUploader:
    
    @staticmethod
    def upload_glb(glb_data, server_url=None, username=None, secret=None, mesh_name=None, progress_callback=None):
        """
        Upload GLB data to Banter microservice.

        Args:
            glb_data: Bytes data of GLB file
            server_url: Optional server URL override
            username: Username for authentication
            secret: Secret key for authentication
            mesh_name: Name of the mesh/object being uploaded
            progress_callback: Optional callback for progress updates

        Returns:
            dict: Response from server containing hash and other metadata
        """
        if server_url is None:
            server_url = config.DEFAULT_SERVER_URL

        # Construct upload URL
        upload_url = f"{server_url}/api/store_glb"

        # Calculate hash for reference
        local_hash = hashlib.sha256(glb_data).hexdigest()

        try:
            # Prepare multipart form data
            files = {'file': ('model.glb', glb_data, 'model/gltf-binary')}

            # Add authentication and metadata if provided
            data = {}
            if username:
                data['username'] = username
            if secret:
                data['secret'] = secret
            if mesh_name:
                data['mesh_name'] = mesh_name
            
            # Make the upload request
            if progress_callback:
                progress_callback(0, "Starting upload...")
            
            response = requests.post(
                upload_url,
                files=files,
                data=data,  # Add form data with username and secret
                timeout=60  # 60 second timeout for large files
            )
            
            if progress_callback:
                progress_callback(100, "Upload complete!")
            
            # Check response status
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            # Add local hash for verification
            result['local_hash'] = local_hash
            
            return result
            
        except requests.exceptions.ConnectionError:
            raise ConnectionError(f"Cannot connect to server at {server_url}")
        except requests.exceptions.Timeout:
            raise TimeoutError("Upload timed out - file may be too large")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 413:
                raise ValueError(f"File too large - maximum size is {config.MAX_FILE_SIZE_MB}MB")
            else:
                raise ValueError(f"Server error: {e.response.status_code} - {e.response.text}")
        except json.JSONDecodeError:
            raise ValueError("Invalid response from server")
        except Exception as e:
            raise Exception(f"Upload failed: {str(e)}")
    
    @staticmethod
    def check_server_status(server_url=None):
        """
        Check if the server is available.
        
        Args:
            server_url: Optional server URL override
            
        Returns:
            bool: True if server is available
        """
        if server_url is None:
            server_url = config.DEFAULT_SERVER_URL
        
        try:
            # Try to connect to the server root
            response = requests.get(server_url, timeout=5)
            return response.status_code < 500
        except:
            return False
    
    @staticmethod
    def upload_with_retry(glb_data, server_url=None, username=None, secret=None, mesh_name=None, max_retries=3, progress_callback=None):
        """
        Upload with automatic retry on failure.

        Args:
            glb_data: Bytes data of GLB file
            server_url: Optional server URL override
            username: Username for authentication
            secret: Secret key for authentication
            mesh_name: Name of the mesh/object being uploaded
            max_retries: Maximum number of retry attempts
            progress_callback: Optional callback for progress updates

        Returns:
            dict: Response from server
        """
        last_error = None

        for attempt in range(max_retries):
            try:
                if attempt > 0 and progress_callback:
                    progress_callback(0, f"Retry attempt {attempt + 1}...")

                return BanterUploader.upload_glb(
                    glb_data,
                    server_url,
                    username,
                    secret,
                    mesh_name,
                    progress_callback
                )
                
            except (ConnectionError, TimeoutError) as e:
                last_error = e
                if attempt < max_retries - 1:
                    # Wait before retry (exponential backoff)
                    import time
                    time.sleep(2 ** attempt)
                continue
            except Exception as e:
                # Don't retry on other errors
                raise e
        
        # All retries failed
        raise last_error or Exception("Upload failed after all retries")