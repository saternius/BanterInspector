#!/usr/bin/env python3
"""
Resonite export.json analyzer
Parses the large 135MB export file to understand structure
"""

import json
import sys
from collections import defaultdict, Counter
from typing import Dict, Any, List, Set

class ResoniteAnalyzer:
    def __init__(self, filepath):
        self.filepath = filepath
        self.stats = {
            'total_objects': 0,
            'types_used': Counter(),
            'component_types': Counter(),
            'slot_hierarchy_depth': 0,
            'total_slots': 0,
            'total_components': 0,
            'assets': defaultdict(list),
            'protoflux_nodes': 0,
            'dynamic_variables': 0
        }
        self.sample_components = {}
        self.slot_tree = {}
        
    def load_json(self):
        """Load and parse the JSON file"""
        print(f"Loading {self.filepath} (this may take a moment...)")
        with open(self.filepath, 'r') as f:
            self.data = json.load(f)
        print("File loaded successfully")
        
    def analyze_structure(self):
        """Analyze the top-level structure"""
        print("\n=== TOP LEVEL STRUCTURE ===")
        for key in self.data.keys():
            if isinstance(self.data[key], list):
                print(f"{key}: List with {len(self.data[key])} items")
            elif isinstance(self.data[key], dict):
                print(f"{key}: Dict with {len(self.data[key])} keys")
                if len(self.data[key]) < 20:  # Show keys if not too many
                    for subkey in list(self.data[key].keys())[:10]:
                        print(f"  - {subkey}")
            else:
                print(f"{key}: {type(self.data[key]).__name__} = {str(self.data[key])[:100]}")
    
    def analyze_types(self):
        """Analyze the Types array"""
        if 'Types' in self.data:
            types = self.data['Types']
            print(f"\n=== TYPES ANALYSIS ===")
            print(f"Total types: {len(types)}")
            
            # Group by namespace
            namespaces = defaultdict(list)
            for t in types:
                if ']' in t:
                    namespace = t.split(']')[0] + ']'
                    typename = t.split(']')[1] if len(t.split(']')) > 1 else ""
                    namespaces[namespace].append(typename)
            
            print("\nTypes by namespace:")
            for ns, types_list in sorted(namespaces.items()):
                print(f"{ns}: {len(types_list)} types")
                # Show a few examples
                for t in types_list[:5]:
                    print(f"  - {t}")
                if len(types_list) > 5:
                    print(f"  ... and {len(types_list)-5} more")
    
    def analyze_object(self, obj: Dict, depth=0, max_depth=3):
        """Recursively analyze an object structure"""
        if depth > max_depth:
            return
            
        if isinstance(obj, dict):
            self.stats['total_objects'] += 1
            
            # Check for type information
            if 'Type' in obj:
                self.stats['types_used'][obj['Type']] += 1
                
            # Check for component structure
            if 'Components' in obj and 'Data' in obj:
                comp_data = obj['Components']['Data']
                if isinstance(comp_data, dict):
                    for comp_id, comp in comp_data.items():
                        if isinstance(comp, dict) and 'Type' in comp:
                            comp_type = comp['Type']
                            self.stats['component_types'][comp_type] += 1
                            
                            # Store sample of each component type
                            if comp_type not in self.sample_components:
                                self.sample_components[comp_type] = comp
            
            # Check for Slots (hierarchy)
            if 'Slots' in obj:
                self.stats['total_slots'] += 1
                if 'Data' in obj['Slots']:
                    slots_data = obj['Slots']['Data']
                    if isinstance(slots_data, list):
                        for slot in slots_data:
                            self.analyze_object(slot, depth+1, max_depth)
            
            # Recurse through dict values
            for key, value in obj.items():
                if isinstance(value, (dict, list)):
                    if isinstance(value, list):
                        for item in value[:10]:  # Limit recursion
                            self.analyze_object(item, depth+1, max_depth)
                    else:
                        self.analyze_object(value, depth+1, max_depth)
                        
        elif isinstance(obj, list):
            for item in obj[:10]:  # Analyze first 10 items
                self.analyze_object(item, depth+1, max_depth)
    
    def analyze_root_slot(self):
        """Analyze the root slot structure"""
        if 'Object' in self.data:
            root = self.data['Object']
            print("\n=== ROOT OBJECT STRUCTURE ===")
            self.print_object_structure(root, max_depth=2)
            
            # Deep dive into slots
            if 'Slots' in root and 'Data' in root['Slots']:
                print("\n=== SLOT HIERARCHY ===")
                slots = root['Slots']['Data']
                if isinstance(slots, list):
                    print(f"Root has {len(slots)} direct child slots")
                    for i, slot in enumerate(slots[:5]):  # First 5 slots
                        self.analyze_slot(slot, f"Slot[{i}]", depth=0, max_depth=2)
    
    def analyze_slot(self, slot: Dict, name: str, depth: int, max_depth: int):
        """Analyze a slot and its children"""
        if depth > max_depth:
            return
            
        indent = "  " * depth
        slot_name = "Unknown"
        
        if isinstance(slot, dict):
            if 'Data' in slot and isinstance(slot['Data'], dict):
                data = slot['Data']
                if 'Name' in data and 'Data' in data['Name']:
                    slot_name = data['Name']['Data']
                    
                print(f"{indent}{name}: {slot_name}")
                
                # Check components
                if 'Components' in data and 'Data' in data['Components']:
                    comps = data['Components']['Data']
                    if isinstance(comps, dict):
                        comp_types = [c.get('Type', 'Unknown') for c in comps.values() if isinstance(c, dict)]
                        if comp_types:
                            print(f"{indent}  Components: {', '.join(comp_types[:5])}")
                
                # Recurse into children
                if 'Slots' in data and 'Data' in data['Slots']:
                    children = data['Slots']['Data']
                    if isinstance(children, list) and children:
                        print(f"{indent}  Children: {len(children)} slots")
                        for i, child in enumerate(children[:3]):  # First 3 children
                            self.analyze_slot(child, f"└─ Slot[{i}]", depth+1, max_depth)
    
    def print_object_structure(self, obj: Any, depth=0, max_depth=2, key_name=""):
        """Print object structure with indentation"""
        if depth > max_depth:
            return
            
        indent = "  " * depth
        
        if isinstance(obj, dict):
            if depth == 0 or key_name:
                print(f"{indent}{key_name}{{")
            
            for key in list(obj.keys())[:10]:  # Limit to first 10 keys
                value = obj[key]
                if isinstance(value, dict):
                    print(f"{indent}  {key}: {{{len(value)} keys}}")
                    if depth < max_depth:
                        self.print_object_structure(value, depth+1, max_depth, "")
                elif isinstance(value, list):
                    print(f"{indent}  {key}: [{len(value)} items]")
                    if value and depth < max_depth:
                        print(f"{indent}    [0]: ", end="")
                        self.print_object_structure(value[0], depth+2, max_depth, "")
                else:
                    val_str = str(value)[:50]
                    print(f"{indent}  {key}: {type(value).__name__} = {val_str}")
            
            if len(obj) > 10:
                print(f"{indent}  ... and {len(obj)-10} more keys")
                
            if depth == 0 or key_name:
                print(f"{indent}}}")
                
        elif isinstance(obj, list):
            print(f"[{len(obj)} items]")
        else:
            print(f"{type(obj).__name__}: {str(obj)[:100]}")
    
    def find_protoflux(self):
        """Search for ProtoFlux nodes"""
        print("\n=== SEARCHING FOR PROTOFLUX ===")
        
        def search_protoflux(obj, path=""):
            results = []
            if isinstance(obj, dict):
                # Check if this is a ProtoFlux node
                if 'Type' in obj:
                    type_str = str(obj['Type'])
                    if 'ProtoFlux' in type_str or 'FrooxEngine.ProtoFlux' in type_str:
                        results.append((path, obj))
                
                # Recurse
                for key, value in obj.items():
                    results.extend(search_protoflux(value, f"{path}/{key}"))
                    
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    results.extend(search_protoflux(item, f"{path}[{i}]"))
                    
            return results
        
        # Search with limited depth
        protoflux_nodes = search_protoflux(self.data.get('Object', {}))
        
        if protoflux_nodes:
            print(f"Found {len(protoflux_nodes)} ProtoFlux nodes")
            for path, node in protoflux_nodes[:5]:
                print(f"\nPath: {path}")
                print(f"Type: {node.get('Type', 'Unknown')}")
                if 'Data' in node:
                    print(f"Data keys: {list(node['Data'].keys())[:10]}")
        else:
            print("No ProtoFlux nodes found")
    
    def generate_summary(self):
        """Generate analysis summary"""
        print("\n=== ANALYSIS SUMMARY ===")
        print(f"Total objects analyzed: {self.stats['total_objects']}")
        print(f"Total slots: {self.stats['total_slots']}")
        print(f"Unique component types: {len(self.stats['component_types'])}")
        
        print("\nMost common component types:")
        for comp_type, count in self.stats['component_types'].most_common(10):
            print(f"  {comp_type}: {count} instances")
        
        print("\nSample component structures:")
        for comp_type in list(self.sample_components.keys())[:5]:
            print(f"\n{comp_type}:")
            comp = self.sample_components[comp_type]
            if 'Data' in comp and isinstance(comp['Data'], dict):
                for key in list(comp['Data'].keys())[:5]:
                    print(f"  - {key}")
    
    def run(self):
        """Run the complete analysis"""
        self.load_json()
        self.analyze_structure()
        self.analyze_types()
        self.analyze_root_slot()
        self.analyze_object(self.data.get('Object', {}), max_depth=5)
        self.find_protoflux()
        self.generate_summary()
        
        # Save results
        results = {
            'stats': dict(self.stats),
            'component_types': dict(self.stats['component_types'].most_common(50)),
            'sample_components': {k: v for k, v in list(self.sample_components.items())[:20]}
        }
        
        with open('resonite_analysis_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n=== Analysis complete ===")
        print("Detailed results saved to resonite_analysis_results.json")

if __name__ == "__main__":
    analyzer = ResoniteAnalyzer('/home/jason/Desktop/resExport/export.json')
    analyzer.run()