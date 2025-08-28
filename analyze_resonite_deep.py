#!/usr/bin/env python3
"""
Deep Resonite export.json analyzer
Focuses on Slots hierarchy and component extraction
"""

import json
import sys
from collections import defaultdict, Counter
from typing import Dict, Any, List, Set, Optional

class ResoniteDeepAnalyzer:
    def __init__(self, filepath):
        self.filepath = filepath
        self.component_samples = {}
        self.slot_tree = []
        self.protoflux_nodes = []
        self.assets_map = {}
        
    def load_json(self):
        """Load and parse the JSON file"""
        print(f"Loading {self.filepath}...")
        with open(self.filepath, 'r') as f:
            self.data = json.load(f)
        print("File loaded successfully")
    
    def extract_slot_data(self, slot_data: Dict, depth=0, parent_name="") -> Dict:
        """Extract relevant data from a slot"""
        if not isinstance(slot_data, dict):
            return None
            
        slot_info = {
            'name': 'Unknown',
            'parent': parent_name,
            'depth': depth,
            'position': None,
            'rotation': None,
            'scale': None,
            'active': True,
            'components': [],
            'children': []
        }
        
        # Get slot name
        if 'Name' in slot_data and isinstance(slot_data['Name'], dict):
            if 'Data' in slot_data['Name']:
                slot_info['name'] = slot_data['Name']['Data']
        
        # Get transform data
        if 'Position' in slot_data and isinstance(slot_data['Position'], dict):
            if 'Data' in slot_data['Position']:
                pos = slot_data['Position']['Data']
                if isinstance(pos, list) and len(pos) == 3:
                    slot_info['position'] = {'x': pos[0], 'y': pos[1], 'z': pos[2]}
        
        if 'Rotation' in slot_data and isinstance(slot_data['Rotation'], dict):
            if 'Data' in slot_data['Rotation']:
                rot = slot_data['Rotation']['Data']
                if isinstance(rot, list) and len(rot) == 4:
                    slot_info['rotation'] = {'x': rot[0], 'y': rot[1], 'z': rot[2], 'w': rot[3]}
        
        if 'Scale' in slot_data and isinstance(slot_data['Scale'], dict):
            if 'Data' in slot_data['Scale']:
                scale = slot_data['Scale']['Data']
                if isinstance(scale, list) and len(scale) == 3:
                    slot_info['scale'] = {'x': scale[0], 'y': scale[1], 'z': scale[2]}
        
        # Get active state
        if 'Active' in slot_data and isinstance(slot_data['Active'], dict):
            if 'Data' in slot_data['Active']:
                slot_info['active'] = slot_data['Active']['Data']
        
        # Extract components
        if 'Components' in slot_data and isinstance(slot_data['Components'], dict):
            if 'Data' in slot_data['Components']:
                comp_data = slot_data['Components']['Data']
                if isinstance(comp_data, dict):
                    for comp_id, comp in comp_data.items():
                        if isinstance(comp, dict) and 'Type' in comp:
                            comp_info = {
                                'id': comp_id,
                                'type': comp['Type'],
                                'data': {}
                            }
                            
                            # Extract component data
                            if 'Data' in comp and isinstance(comp['Data'], dict):
                                for key, value in comp['Data'].items():
                                    if isinstance(value, dict) and 'Data' in value:
                                        comp_info['data'][key] = value['Data']
                                    else:
                                        comp_info['data'][key] = value
                            
                            slot_info['components'].append(comp_info)
                            
                            # Store sample
                            comp_type = comp['Type']
                            if comp_type not in self.component_samples:
                                self.component_samples[comp_type] = comp_info
        
        # Process children slots
        if 'Slots' in slot_data and isinstance(slot_data['Slots'], dict):
            if 'Data' in slot_data['Slots']:
                children_data = slot_data['Slots']['Data']
                if isinstance(children_data, list):
                    for child in children_data:
                        if isinstance(child, dict) and 'Data' in child:
                            child_info = self.extract_slot_data(child['Data'], depth+1, slot_info['name'])
                            if child_info:
                                slot_info['children'].append(child_info)
        
        return slot_info
    
    def analyze_slots_structure(self):
        """Analyze the Slots structure in detail"""
        print("\n=== ANALYZING SLOTS STRUCTURE ===")
        
        if 'Slots' not in self.data:
            print("No 'Slots' found in top level")
            return
            
        slots_obj = self.data['Slots']
        
        # The Slots object should have a Data field
        if isinstance(slots_obj, dict) and 'Data' in slots_obj:
            root_data = slots_obj['Data']
            print(f"Root slots type: {type(root_data)}")
            
            # Extract the complete slot tree
            root_slot = self.extract_slot_data(root_data, 0, "ROOT")
            if root_slot:
                self.slot_tree = root_slot
                self.print_slot_tree(root_slot, max_depth=3)
    
    def print_slot_tree(self, slot: Dict, depth=0, max_depth=3):
        """Print slot hierarchy tree"""
        if depth > max_depth:
            return
            
        indent = "  " * depth
        prefix = "└─ " if depth > 0 else ""
        
        # Print slot info
        name = slot['name']
        comp_count = len(slot.get('components', []))
        child_count = len(slot.get('children', []))
        
        print(f"{indent}{prefix}{name}")
        
        if comp_count > 0:
            print(f"{indent}  📦 {comp_count} components: ", end="")
            comp_types = [c['type'].split('.')[-1] for c in slot['components'][:3]]
            print(', '.join(comp_types), end="")
            if comp_count > 3:
                print(f" +{comp_count-3} more", end="")
            print()
        
        if slot.get('position'):
            pos = slot['position']
            print(f"{indent}  📍 Position: ({pos['x']:.2f}, {pos['y']:.2f}, {pos['z']:.2f})")
        
        # Print children
        if child_count > 0 and depth < max_depth:
            print(f"{indent}  👶 {child_count} children:")
            for child in slot['children'][:5]:  # Limit to first 5
                self.print_slot_tree(child, depth+1, max_depth)
            if child_count > 5:
                print(f"{indent}    ... and {child_count-5} more")
    
    def analyze_protoflux_nodes(self):
        """Find and analyze ProtoFlux nodes in the data"""
        print("\n=== ANALYZING PROTOFLUX NODES ===")
        
        def find_protoflux_in_slot(slot: Dict, path=""):
            """Recursively find ProtoFlux components in slots"""
            protoflux = []
            
            # Check components
            for comp in slot.get('components', []):
                if 'ProtoFlux' in comp['type'] or 'Proxy' in comp['type']:
                    protoflux.append({
                        'path': f"{path}/{slot['name']}",
                        'type': comp['type'],
                        'data': comp.get('data', {})
                    })
            
            # Recurse into children
            for child in slot.get('children', []):
                protoflux.extend(find_protoflux_in_slot(child, f"{path}/{slot['name']}"))
            
            return protoflux
        
        if self.slot_tree:
            self.protoflux_nodes = find_protoflux_in_slot(self.slot_tree)
            
            if self.protoflux_nodes:
                print(f"Found {len(self.protoflux_nodes)} ProtoFlux nodes")
                
                # Group by type
                protoflux_types = Counter(node['type'] for node in self.protoflux_nodes)
                print("\nProtoFlux node types:")
                for node_type, count in protoflux_types.most_common(10):
                    short_type = node_type.split('.')[-1]
                    print(f"  {short_type}: {count}")
                
                # Show sample nodes
                print("\nSample ProtoFlux nodes:")
                for node in self.protoflux_nodes[:3]:
                    print(f"\n  Path: {node['path']}")
                    print(f"  Type: {node['type']}")
                    if node['data']:
                        print(f"  Data fields: {list(node['data'].keys())[:5]}")
            else:
                print("No ProtoFlux nodes found in slots")
    
    def analyze_assets(self):
        """Analyze asset references"""
        print("\n=== ANALYZING ASSETS ===")
        
        if 'Assets' in self.data:
            assets = self.data['Assets']
            print(f"Total assets: {len(assets)}")
            
            # Group assets by type
            asset_types = Counter()
            for asset in assets[:100]:  # Sample first 100
                if isinstance(asset, dict):
                    if 'Type' in asset:
                        asset_type_val = asset['Type']
                        if isinstance(asset_type_val, str):
                            asset_type = asset_type_val.split('.')[-1]
                        else:
                            asset_type = str(asset_type_val)
                        asset_types[asset_type] += 1
                        
                    # Store asset data
                    if 'Data' in asset and isinstance(asset['Data'], dict):
                        if 'ID' in asset['Data']:
                            asset_id = asset['Data']['ID']
                            self.assets_map[asset_id] = asset
            
            print("\nAsset types found:")
            for atype, count in asset_types.most_common(10):
                print(f"  {atype}: {count}")
    
    def generate_component_mapping(self):
        """Generate mapping from Resonite components to Banter equivalents"""
        print("\n=== COMPONENT MAPPING ===")
        
        # Define mapping rules
        component_map = {
            'MeshRenderer': 'BanterGeometry',
            'BoxMesh': 'BanterBox',
            'SphereMesh': 'BanterSphere',
            'CylinderMesh': 'BanterCylinder',
            'QuadMesh': 'BanterPlane',
            'PBS_Metallic': 'BanterMaterial',
            'UnlitMaterial': 'BanterMaterial',
            'BoxCollider': 'BoxCollider',
            'SphereCollider': 'SphereCollider',
            'MeshCollider': 'MeshCollider',
            'RigidBody': 'BanterRigidbody',
            'Grabbable': 'BanterGrabHandle',
            'AudioSource': 'BanterAudioSource',
            'VideoPlayer': 'BanterVideoPlayer',
            'Text': 'BanterText',
            'Button': 'BanterColliderEvents',
            'UIX': 'BanterBrowser',  # UI elements might map to browser
            'DynamicVariableSpace': 'MonoBehavior',  # Will need custom scripts
            'ProtoFlux': 'MonoBehavior',  # ProtoFlux logic to JS
        }
        
        print("Component type mappings:")
        mapped_count = 0
        unmapped = []
        
        for comp_type in self.component_samples.keys():
            short_type = comp_type.split('.')[-1]
            mapped = False
            
            for resonite_key, banter_comp in component_map.items():
                if resonite_key in short_type:
                    print(f"  {short_type} → {banter_comp}")
                    mapped_count += 1
                    mapped = True
                    break
            
            if not mapped:
                unmapped.append(short_type)
        
        if unmapped:
            print(f"\nUnmapped component types ({len(unmapped)}):")
            for comp in unmapped[:10]:
                print(f"  ❓ {comp}")
    
    def save_analysis(self):
        """Save analysis results to file"""
        results = {
            'summary': {
                'total_assets': len(self.data.get('Assets', [])),
                'total_types': len(self.data.get('Types', [])),
                'protoflux_nodes': len(self.protoflux_nodes),
                'component_types': len(self.component_samples)
            },
            'slot_tree': self.slot_tree,
            'component_samples': self.component_samples,
            'protoflux_samples': self.protoflux_nodes[:10] if self.protoflux_nodes else []
        }
        
        with open('resonite_deep_analysis.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n=== Deep analysis saved to resonite_deep_analysis.json ===")
    
    def run(self):
        """Run the complete analysis"""
        self.load_json()
        self.analyze_slots_structure()
        self.analyze_protoflux_nodes()
        self.analyze_assets()
        self.generate_component_mapping()
        self.save_analysis()

if __name__ == "__main__":
    analyzer = ResoniteDeepAnalyzer('/home/jason/Desktop/resExport/export.json')
    analyzer.run()