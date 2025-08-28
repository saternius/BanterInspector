#!/usr/bin/env python3
"""
Final Resonite export.json analyzer with correct structure understanding
"""

import json
from collections import defaultdict, Counter
from typing import Dict, Any, List, Optional, Tuple

class ResoniteFinalAnalyzer:
    def __init__(self, filepath):
        self.filepath = filepath
        self.data = None
        self.types_lookup = {}  # Map type index to type string
        self.slots_tree = None
        self.components_by_type = defaultdict(list)
        self.protoflux_components = []
        self.assets_by_type = defaultdict(list)
        
    def load_json(self):
        """Load and parse the JSON file"""
        print(f"Loading {self.filepath} (135MB)...")
        with open(self.filepath, 'r') as f:
            self.data = json.load(f)
        print("File loaded successfully")
        
        # Build types lookup
        if 'Types' in self.data:
            for idx, type_str in enumerate(self.data['Types']):
                self.types_lookup[idx] = type_str
            print(f"Loaded {len(self.types_lookup)} type definitions")
    
    def resolve_type(self, type_ref) -> str:
        """Resolve a type reference (either int index or string)"""
        if isinstance(type_ref, int):
            return self.types_lookup.get(type_ref, f"Unknown[{type_ref}]")
        return type_ref
    
    def parse_value(self, value_obj: Any) -> Any:
        """Parse a value object that might have ID/Data structure"""
        if isinstance(value_obj, dict):
            if 'Data' in value_obj:
                return value_obj['Data']
            elif 'ID' in value_obj and len(value_obj) == 1:
                return value_obj['ID']
        return value_obj
    
    def parse_slot(self, slot_obj: Dict, depth=0, parent_path="") -> Dict:
        """Parse a slot object into structured data"""
        slot_info = {
            'name': 'Unknown',
            'path': parent_path,
            'depth': depth,
            'transform': {},
            'components': [],
            'children': [],
            'active': True,
            'persistent_id': None
        }
        
        # Parse basic properties
        if 'Name' in slot_obj:
            name_val = self.parse_value(slot_obj['Name'])
            if name_val:
                slot_info['name'] = name_val
                slot_info['path'] = f"{parent_path}/{name_val}" if parent_path else name_val
        
        if 'Active' in slot_obj:
            slot_info['active'] = self.parse_value(slot_obj['Active'])
        
        if 'Persistent-ID' in slot_obj:
            slot_info['persistent_id'] = self.parse_value(slot_obj['Persistent-ID'])
        
        # Parse transform
        if 'Position' in slot_obj:
            pos = self.parse_value(slot_obj['Position'])
            if isinstance(pos, list) and len(pos) == 3:
                slot_info['transform']['position'] = {'x': pos[0], 'y': pos[1], 'z': pos[2]}
        
        if 'Rotation' in slot_obj:
            rot = self.parse_value(slot_obj['Rotation'])
            if isinstance(rot, list) and len(rot) == 4:
                slot_info['transform']['rotation'] = {'x': rot[0], 'y': rot[1], 'z': rot[2], 'w': rot[3]}
        
        if 'Scale' in slot_obj:
            scale = self.parse_value(slot_obj['Scale'])
            if isinstance(scale, list) and len(scale) == 3:
                slot_info['transform']['scale'] = {'x': scale[0], 'y': scale[1], 'z': scale[2]}
        
        # Parse components
        if 'Components' in slot_obj:
            comp_obj = slot_obj['Components']
            if isinstance(comp_obj, dict):
                comp_list = []
                
                # Components can be in 'Data' or directly in dict
                if 'Data' in comp_obj:
                    comp_data = comp_obj['Data']
                else:
                    comp_data = comp_obj
                
                if isinstance(comp_data, dict):
                    for comp_id, comp in comp_data.items():
                        if isinstance(comp, dict) and 'Type' in comp:
                            comp_type = self.resolve_type(comp['Type'])
                            comp_info = {
                                'id': comp_id,
                                'type': comp_type,
                                'type_short': comp_type.split('.')[-1] if '.' in comp_type else comp_type,
                                'data': {}
                            }
                            
                            # Parse component data
                            if 'Data' in comp:
                                comp_data_inner = comp['Data']
                                if isinstance(comp_data_inner, dict):
                                    for key, value in comp_data_inner.items():
                                        comp_info['data'][key] = self.parse_value(value)
                            
                            comp_list.append(comp_info)
                            
                            # Track component types
                            self.components_by_type[comp_info['type_short']].append({
                                'path': slot_info['path'],
                                'component': comp_info
                            })
                            
                            # Track ProtoFlux
                            if 'ProtoFlux' in comp_type or 'Proxy' in comp_type:
                                self.protoflux_components.append({
                                    'path': slot_info['path'],
                                    'type': comp_type,
                                    'data': comp_info['data']
                                })
                
                slot_info['components'] = comp_list
        
        # Parse children
        if 'Children' in slot_obj:
            children_obj = slot_obj['Children']
            if isinstance(children_obj, list):
                for child in children_obj:
                    if isinstance(child, dict):
                        child_slot = self.parse_slot(child, depth+1, slot_info['path'])
                        slot_info['children'].append(child_slot)
            elif isinstance(children_obj, dict) and 'Data' in children_obj:
                children_data = children_obj['Data']
                if isinstance(children_data, list):
                    for child in children_data:
                        if isinstance(child, dict):
                            child_slot = self.parse_slot(child, depth+1, slot_info['path'])
                            slot_info['children'].append(child_slot)
        
        return slot_info
    
    def analyze_hierarchy(self):
        """Analyze the slot hierarchy"""
        print("\n=== ANALYZING SLOT HIERARCHY ===")
        
        if 'Slots' not in self.data:
            print("No Slots found!")
            return
        
        root_slot = self.data['Slots']
        self.slots_tree = self.parse_slot(root_slot, 0, "")
        
        # Print hierarchy summary
        def count_slots(slot):
            count = 1
            for child in slot['children']:
                count += count_slots(child)
            return count
        
        total_slots = count_slots(self.slots_tree)
        print(f"Total slots in hierarchy: {total_slots}")
        
        # Print tree preview
        self.print_slot_tree(self.slots_tree, max_depth=3)
    
    def print_slot_tree(self, slot: Dict, depth=0, max_depth=3):
        """Print slot hierarchy tree"""
        if depth > max_depth:
            return
        
        indent = "  " * depth
        prefix = "└─ " if depth > 0 else "🌲 "
        
        name = slot['name']
        comp_count = len(slot['components'])
        child_count = len(slot['children'])
        
        # Main slot line
        print(f"{indent}{prefix}{name}")
        
        # Components line
        if comp_count > 0:
            comp_types = [c['type_short'] for c in slot['components'][:3]]
            print(f"{indent}  📦 Components: {', '.join(comp_types)}", end="")
            if comp_count > 3:
                print(f" +{comp_count-3} more")
            else:
                print()
        
        # Transform line
        if slot['transform']:
            if 'position' in slot['transform']:
                pos = slot['transform']['position']
                print(f"{indent}  📍 Pos: ({pos['x']:.1f}, {pos['y']:.1f}, {pos['z']:.1f})")
        
        # Children
        if child_count > 0:
            if depth < max_depth:
                for i, child in enumerate(slot['children'][:5]):
                    self.print_slot_tree(child, depth+1, max_depth)
                if child_count > 5:
                    print(f"{indent}    ... +{child_count-5} more children")
            else:
                print(f"{indent}  👶 {child_count} children")
    
    def analyze_assets(self):
        """Analyze assets with type resolution"""
        print("\n=== ANALYZING ASSETS ===")
        
        if 'Assets' not in self.data:
            print("No assets found!")
            return
        
        assets = self.data['Assets']
        print(f"Total assets: {len(assets)}")
        
        # Process assets
        for asset in assets:
            if isinstance(asset, dict) and 'Type' in asset:
                type_str = self.resolve_type(asset['Type'])
                type_short = type_str.split('.')[-1] if '.' in type_str else type_str
                self.assets_by_type[type_short].append(asset)
        
        # Show asset type distribution
        print("\nAsset types:")
        sorted_assets = sorted(self.assets_by_type.items(), key=lambda x: len(x[1]), reverse=True)
        for asset_type, assets_list in sorted_assets[:15]:
            print(f"  {asset_type}: {len(assets_list)}")
    
    def analyze_components(self):
        """Analyze components and create mapping"""
        print("\n=== COMPONENT ANALYSIS ===")
        print(f"Total unique component types: {len(self.components_by_type)}")
        
        # Show most common components
        sorted_comps = sorted(self.components_by_type.items(), key=lambda x: len(x[1]), reverse=True)
        print("\nMost common components:")
        for comp_type, instances in sorted_comps[:20]:
            print(f"  {comp_type}: {len(instances)} instances")
    
    def analyze_protoflux(self):
        """Analyze ProtoFlux nodes"""
        print("\n=== PROTOFLUX ANALYSIS ===")
        print(f"Total ProtoFlux components: {len(self.protoflux_components)}")
        
        if self.protoflux_components:
            # Group by type
            protoflux_types = Counter(p['type'] for p in self.protoflux_components)
            print("\nProtoFlux component types:")
            for pf_type, count in protoflux_types.most_common(15):
                short_type = pf_type.split('.')[-1] if '.' in pf_type else pf_type
                print(f"  {short_type}: {count}")
            
            # Show sample
            print("\nSample ProtoFlux component:")
            sample = self.protoflux_components[0]
            print(f"  Path: {sample['path']}")
            print(f"  Type: {sample['type']}")
            if sample['data']:
                print(f"  Data fields: {list(sample['data'].keys())[:10]}")
    
    def create_banter_mapping(self):
        """Create mapping from Resonite to Banter components"""
        print("\n=== RESONITE → BANTER COMPONENT MAPPING ===")
        
        mapping = {
            # Geometry/Meshes
            'BoxMesh': 'BanterBox',
            'SphereMesh': 'BanterSphere', 
            'CylinderMesh': 'BanterCylinder',
            'QuadMesh': 'BanterPlane',
            'ConeMesh': 'BanterCone',
            'TorusMesh': 'BanterTorus',
            'IcoSphereMesh': 'BanterSphere',
            'GridMesh': 'BanterPlane',
            
            # Materials
            'PBS_Metallic': 'BanterMaterial',
            'PBS_Specular': 'BanterMaterial',
            'UnlitMaterial': 'BanterMaterial',
            'FresnelMaterial': 'BanterMaterial',
            'UI_UnlitMaterial': 'BanterMaterial',
            
            # Colliders
            'BoxCollider': 'BoxCollider',
            'SphereCollider': 'SphereCollider',
            'CapsuleCollider': 'CapsuleCollider',
            'MeshCollider': 'MeshCollider',
            
            # Physics
            'RigidBody': 'BanterRigidbody',
            'PhysicalButton': 'BanterColliderEvents',
            
            # Interaction
            'Grabbable': 'BanterGrabHandle',
            'TouchButton': 'BanterColliderEvents',
            'Button': 'BanterColliderEvents',
            
            # Media
            'AudioSource': 'BanterAudioSource',
            'VideoPlayer': 'BanterVideoPlayer',
            'VideoTextureProvider': 'BanterVideoPlayer',
            
            # Text
            'TextRenderer': 'BanterText',
            'Text': 'BanterText',
            
            # Lights
            'Light': '(Unity Light - needs special handling)',
            'PointLight': '(Unity Point Light)',
            'DirectionalLight': '(Unity Directional Light)',
            
            # Special
            'MirrorPortal': 'BanterMirror',
            'Portal': 'BanterPortal',
            'WebBrowser': 'BanterBrowser',
            'Camera': '(Unity Camera)',
            
            # ProtoFlux/Logic
            'ProtoFlux': 'MonoBehavior + custom JS',
            'DynamicVariableSpace': 'MonoBehavior variables',
            'DynamicImpulseReceiver': 'MonoBehavior event handler',
            
            # UI (complex mapping needed)
            'UIX': 'BanterBrowser or custom UI',
            'Canvas': '(UI Canvas - special handling)',
            'RectTransform': '(UI positioning)',
        }
        
        # Check which components we have
        mapped = []
        unmapped = []
        
        for comp_type in self.components_by_type.keys():
            found_mapping = False
            for resonite_pattern, banter_comp in mapping.items():
                if resonite_pattern in comp_type:
                    mapped.append((comp_type, banter_comp))
                    found_mapping = True
                    break
            
            if not found_mapping:
                unmapped.append(comp_type)
        
        print("\nMapped components:")
        for resonite, banter in sorted(set(mapped))[:20]:
            print(f"  ✅ {resonite} → {banter}")
        
        if unmapped:
            print(f"\nUnmapped components ({len(unmapped)}):")
            for comp in sorted(unmapped)[:15]:
                print(f"  ❓ {comp}")
    
    def save_results(self):
        """Save analysis results"""
        results = {
            'summary': {
                'version': self.data.get('VersionNumber', 'Unknown'),
                'total_types': len(self.types_lookup),
                'total_assets': len(self.data.get('Assets', [])),
                'total_components': sum(len(v) for v in self.components_by_type.values()),
                'unique_component_types': len(self.components_by_type),
                'protoflux_components': len(self.protoflux_components)
            },
            'slot_tree_sample': self.extract_tree_sample(self.slots_tree) if self.slots_tree else None,
            'component_distribution': {k: len(v) for k, v in list(self.components_by_type.items())[:50]},
            'asset_distribution': {k: len(v) for k, v in list(self.assets_by_type.items())[:30]},
            'protoflux_types': Counter(p['type'].split('.')[-1] for p in self.protoflux_components).most_common(20)
        }
        
        with open('resonite_final_analysis.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n=== Results saved to resonite_final_analysis.json ===")
    
    def extract_tree_sample(self, slot, max_depth=3, current_depth=0):
        """Extract a sample of the tree for saving"""
        if current_depth >= max_depth:
            return {'name': slot['name'], 'children_count': len(slot['children'])}
        
        return {
            'name': slot['name'],
            'components': [c['type_short'] for c in slot['components'][:5]],
            'transform': slot['transform'],
            'children': [self.extract_tree_sample(c, max_depth, current_depth+1) 
                        for c in slot['children'][:3]]
        }
    
    def run(self):
        """Run complete analysis"""
        self.load_json()
        self.analyze_hierarchy()
        self.analyze_assets()
        self.analyze_components()
        self.analyze_protoflux()
        self.create_banter_mapping()
        self.save_results()

if __name__ == "__main__":
    analyzer = ResoniteFinalAnalyzer('/home/jason/Desktop/resExport/export.json')
    analyzer.run()