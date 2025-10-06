#!/usr/bin/env python3
"""
Convert .mat files to JSON format for easier loading in browser

Usage:
    python convert_mat_to_json.py Truth_scene01.mat
    python convert_mat_to_json.py mask.mat
"""

import sys
import json
import numpy as np
import scipy.io as scio
from pathlib import Path


def numpy_to_list(obj):
    """Recursively convert numpy arrays to lists for JSON serialization"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: numpy_to_list(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [numpy_to_list(item) for item in obj]
    elif isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    else:
        return obj


def convert_mat_to_json(mat_file_path):
    """Convert a .mat file to JSON format"""
    mat_path = Path(mat_file_path)
    
    if not mat_path.exists():
        print(f"Error: File '{mat_file_path}' not found")
        return False
    
    print(f"Loading {mat_path.name}...")
    
    try:
        # Load mat file
        mat_data = scio.loadmat(str(mat_path))
        
        # Filter out MATLAB metadata
        data_fields = {
            k: v for k, v in mat_data.items() 
            if not k.startswith('__')
        }
        
        print(f"Found fields: {list(data_fields.keys())}")
        
        # Convert to JSON-serializable format
        json_data = numpy_to_list(data_fields)
        
        # Determine output file name
        json_path = mat_path.with_suffix('.json')
        
        # Save as JSON
        print(f"Saving to {json_path.name}...")
        with open(json_path, 'w') as f:
            json.dump(json_data, f)
        
        # Also save compressed version
        import gzip
        gz_path = mat_path.with_suffix('.json.gz')
        print(f"Saving compressed version to {gz_path.name}...")
        with gzip.open(gz_path, 'wt', encoding='utf-8') as f:
            json.dump(json_data, f)
        
        # Print statistics
        mat_size = mat_path.stat().st_size
        json_size = json_path.stat().st_size
        gz_size = gz_path.stat().st_size
        
        print(f"\nConversion complete!")
        print(f"  Original .mat: {mat_size / 1024 / 1024:.2f} MB")
        print(f"  JSON:          {json_size / 1024 / 1024:.2f} MB ({json_size / mat_size * 100:.1f}%)")
        print(f"  JSON.gz:       {gz_size / 1024 / 1024:.2f} MB ({gz_size / mat_size * 100:.1f}%)")
        
        # Print data shape info
        for key, value in data_fields.items():
            if isinstance(value, np.ndarray):
                print(f"\n  Field '{key}': shape {value.shape}, dtype {value.dtype}")
        
        return True
        
    except Exception as e:
        print(f"Error converting file: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nAvailable .mat files in current directory:")
        for mat_file in Path('.').glob('*.mat'):
            print(f"  {mat_file.name}")
        return 1
    
    mat_file = sys.argv[1]
    success = convert_mat_to_json(mat_file)
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())

