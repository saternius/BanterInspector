"""
Firebase client for uploading GLB files and managing entities in Firebase.
Replaces the previous server-based TippyUploader.
"""

import hashlib
import json
import secrets
import time
from typing import Dict, Optional, Tuple, Any
import requests
from pathlib import Path


class FirebaseClient:
    """
    Client for interacting with Firebase Storage and Realtime Database.

    This client handles:
    - Uploading GLB files to Firebase Storage
    - Creating component definitions in Realtime Database
    - Creating entity entries in Realtime Database
    """

    def __init__(self, config: Dict[str, str], space_id: str):
        """
        Initialize Firebase client with configuration.

        Args:
            config: Firebase configuration dictionary containing:
                - apiKey: Firebase API Key
                - authDomain: Firebase Auth Domain
                - projectId: Firebase Project ID
                - storageBucket: Firebase Storage Bucket
                - messagingSenderId: Firebase Messaging Sender ID
                - appId: Firebase App ID
                - databaseURL: Firebase Realtime Database URL
            space_id: The space identifier for database operations
        """
        self.config = config
        self.space_id = space_id
        self.api_key = config.get('apiKey', '')
        self.storage_bucket = config.get('storageBucket', '')
        self.database_url = config.get('databaseURL', '')
        self.project_id = config.get('projectId', '')

        # Remove trailing slash from database URL if present
        if self.database_url and self.database_url.endswith('/'):
            self.database_url = self.database_url[:-1]

    def test_connection(self) -> Tuple[bool, str]:
        """
        Test Firebase connection by checking database accessibility.

        Returns:
            Tuple of (success: bool, message: str)
        """
        if not self.database_url or not self.api_key:
            return False, "Firebase configuration incomplete"

        try:
            # Test database connection with a simple read
            test_url = f"{self.database_url}/.json?auth={self.api_key}&shallow=true&timeout=5s"
            response = requests.get(test_url, timeout=5)

            if response.status_code == 200:
                return True, "Firebase connection successful"
            elif response.status_code == 401:
                return False, "Firebase authentication failed - check API key"
            else:
                return False, f"Firebase connection failed: HTTP {response.status_code}"

        except requests.exceptions.Timeout:
            return False, "Firebase connection timeout"
        except requests.exceptions.ConnectionError:
            return False, "Cannot connect to Firebase - check database URL"
        except Exception as e:
            return False, f"Firebase connection error: {str(e)}"

    def upload_to_storage(self, glb_data: bytes, filename: str) -> Tuple[bool, str, str]:
        """
        Upload GLB file to Firebase Storage using REST API.

        Args:
            glb_data: Binary GLB file data
            filename: Name for the file (without path)

        Returns:
            Tuple of (success: bool, url_or_error: str, storage_path: str)
        """
        if not self.storage_bucket:
            return False, "Storage bucket not configured", ""

        try:
            # Generate file hash for unique naming
            file_hash = hashlib.sha256(glb_data).hexdigest()
            storage_path = f"glbs/{file_hash}.glb"

            # Firebase Storage upload URL
            upload_url = (
                f"https://firebasestorage.googleapis.com/v0/b/{self.storage_bucket}"
                f"/o/{storage_path.replace('/', '%2F')}?uploadType=media"
            )

            # Upload file
            headers = {
                'Content-Type': 'model/gltf-binary',
                'Content-Length': str(len(glb_data))
            }

            response = requests.post(
                upload_url,
                data=glb_data,
                headers=headers,
                params={'key': self.api_key} if self.api_key else None,
                timeout=60
            )

            if response.status_code == 200:
                # Get download URL
                download_url = (
                    f"https://firebasestorage.googleapis.com/v0/b/{self.storage_bucket}"
                    f"/o/{storage_path.replace('/', '%2F')}?alt=media"
                )
                return True, download_url, storage_path
            else:
                error_msg = f"Storage upload failed: HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        error_msg = f"Storage upload failed: {error_data['error'].get('message', error_msg)}"
                except:
                    pass
                return False, error_msg, ""

        except requests.exceptions.Timeout:
            return False, "Storage upload timeout", ""
        except requests.exceptions.ConnectionError:
            return False, "Cannot connect to Firebase Storage", ""
        except Exception as e:
            return False, f"Storage upload error: {str(e)}", ""

    def create_component(self, component_id: str, storage_url: str) -> Tuple[bool, str]:
        """
        Create component definition in Firebase Realtime Database.

        Args:
            component_id: Unique component identifier (e.g., "GLTF_123456")
            storage_url: URL where the GLB file is stored

        Returns:
            Tuple of (success: bool, message: str)
        """
        if not self.database_url or not self.space_id:
            return False, "Database URL or space ID not configured"

        try:
            # Component path in database
            component_path = f"space/{self.space_id}/components/{component_id}"
            url = f"{self.database_url}/{component_path}.json"

            # Component data
            component_data = {
                "id": component_id,
                "url": storage_url
            }

            # Write to database
            response = requests.put(
                url,
                json=component_data,
                params={'auth': self.api_key} if self.api_key else None,
                timeout=10
            )

            if response.status_code == 200:
                return True, f"Component {component_id} created successfully"
            else:
                error_msg = f"Failed to create component: HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        error_msg = f"Failed to create component: {error_data['error']}"
                except:
                    pass
                return False, error_msg

        except Exception as e:
            return False, f"Component creation error: {str(e)}"

    def create_entity(self, mesh_name: str, component_id: str,
                     transform: Optional[Dict[str, Any]] = None) -> Tuple[bool, str]:
        """
        Create entity in Firebase Realtime Database.

        Args:
            mesh_name: Name of the mesh/entity
            component_id: Component ID to attach to the entity
            transform: Optional transform data with position, rotation, scale

        Returns:
            Tuple of (success: bool, message: str)
        """
        if not self.database_url or not self.space_id:
            return False, "Database URL or space ID not configured"

        # Default transform if not provided
        if transform is None:
            transform = {
                'position': {'x': 0, 'y': 0, 'z': 0},
                'rotation': {'x': 0, 'y': 0, 'z': 0, 'w': 1},
                'scale': {'x': 1, 'y': 1, 'z': 1}
            }

        try:
            # Entity path in database
            entity_path = f"space/{self.space_id}/Scene/{mesh_name}"
            url = f"{self.database_url}/{entity_path}.json"

            # Generate UUID
            uuid = secrets.randbelow(10000000000)

            # Entity data structure
            entity_data = {
                "__meta": {
                    "active": True,
                    "components": {
                        component_id: True
                    },
                    "layer": 0,
                    "localPosition": transform.get('position', {'x': 0, 'y': 0, 'z': 0}),
                    "localRotation": transform.get('rotation', {'x': 0, 'y': 0, 'z': 0, 'w': 1}),
                    "localScale": transform.get('scale', {'x': 1, 'y': 1, 'z': 1}),
                    "position": transform.get('position', {'x': 0, 'y': 0, 'z': 0}),
                    "rotation": transform.get('rotation', {'x': 0, 'y': 0, 'z': 0, 'w': 1}),
                    "uuid": uuid
                }
            }

            # Write to database
            response = requests.put(
                url,
                json=entity_data,
                params={'auth': self.api_key} if self.api_key else None,
                timeout=10
            )

            if response.status_code == 200:
                return True, f"Entity '{mesh_name}' created successfully"
            else:
                error_msg = f"Failed to create entity: HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        error_msg = f"Failed to create entity: {error_data['error']}"
                except:
                    pass
                return False, error_msg

        except Exception as e:
            return False, f"Entity creation error: {str(e)}"

    def upload_with_retry(self, glb_data: bytes, mesh_name: str,
                         transform: Optional[Dict[str, Any]] = None,
                         max_retries: int = 3) -> Dict[str, Any]:
        """
        Complete upload workflow with retry logic.

        This method:
        1. Uploads GLB to Firebase Storage
        2. Creates component in Realtime Database
        3. Creates entity in Realtime Database

        Args:
            glb_data: Binary GLB file data
            mesh_name: Name of the mesh/entity
            transform: Optional transform data
            max_retries: Maximum number of retry attempts

        Returns:
            Dictionary with:
                - success: bool
                - storage_url: str (if successful)
                - component_id: str (if successful)
                - error: str (if failed)
        """
        for attempt in range(max_retries):
            try:
                # Generate component ID
                component_id = f"GLTF_{secrets.randbelow(1000000000)}"

                # Step 1: Upload to Storage
                success, url_or_error, storage_path = self.upload_to_storage(
                    glb_data, f"{mesh_name}.glb"
                )

                if not success:
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    return {'success': False, 'error': url_or_error}

                storage_url = url_or_error

                # Step 2: Create component
                success, message = self.create_component(component_id, storage_url)
                if not success:
                    return {'success': False, 'error': message}

                # Step 3: Create entity
                success, message = self.create_entity(mesh_name, component_id, transform)
                if not success:
                    return {'success': False, 'error': message}

                # Success!
                return {
                    'success': True,
                    'storage_url': storage_url,
                    'component_id': component_id,
                    'mesh_name': mesh_name
                }

            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return {'success': False, 'error': f"Upload failed: {str(e)}"}

        return {'success': False, 'error': "Maximum retries exceeded"}


def generate_component_id() -> str:
    """
    Generate a unique GLTF component identifier.

    Returns:
        Component ID in format "GLTF_<random_number>"
    """
    return f"GLTF_{secrets.randbelow(1000000000)}"


def get_transform_data(obj) -> Dict[str, Dict[str, float]]:
    """
    Extract transform data from a Blender object.

    Args:
        obj: Blender object

    Returns:
        Dictionary with position, rotation, and scale data
    """
    try:
        matrix = obj.matrix_world
        location = matrix.to_translation()
        rotation = matrix.to_quaternion()
        scale = matrix.to_scale()

        return {
            'position': {'x': location.x, 'y': location.y, 'z': location.z},
            'rotation': {'x': rotation.x, 'y': rotation.y, 'z': rotation.z, 'w': rotation.w},
            'scale': {'x': scale.x, 'y': scale.y, 'z': scale.z}
        }
    except Exception:
        # Return default transform if extraction fails
        return {
            'position': {'x': 0, 'y': 0, 'z': 0},
            'rotation': {'x': 0, 'y': 0, 'z': 0, 'w': 1},
            'scale': {'x': 1, 'y': 1, 'z': 1}
        }