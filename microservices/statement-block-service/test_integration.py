#!/usr/bin/env python3
"""
Integration test script to verify both Claude and Gemini implementations.
Run this script to test the service with both model providers.
"""

import requests
import json
import os

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_TEXT = "Um, so like I was thinking about the new feature and you know it needs to be really user friendly. Also, uh, the colors should be accessible for everyone."
EXISTING_BLOCKS = ["The interface should be intuitive.", "Performance is a key concern."]

def test_health_check():
    """Test the health check endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health Check Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Service Status: {data['status']}")
        print(f"Model Provider: {data.get('model_provider', 'Not specified')}")
        print("✓ Health check passed\n")
        return True
    else:
        print("✗ Health check failed\n")
        return False

def test_process_text():
    """Test the process-text endpoint."""
    payload = {
        "text": TEST_TEXT,
        "existing_blocks": EXISTING_BLOCKS
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/process-text",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Process Text Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Processing Time: {data.get('processing_time_ms', 'N/A')}ms")
            print(f"Number of blocks: {len(data['blocks'])}")
            print("\nProcessed blocks:")
            for i, block in enumerate(data['blocks'], 1):
                print(f"  {i}. {block}")
            print("\n✓ Text processing successful\n")
            return True
        else:
            print(f"Error: {response.text}")
            print("✗ Text processing failed\n")
            return False
            
    except Exception as e:
        print(f"Exception: {str(e)}")
        print("✗ Text processing failed\n")
        return False

def main():
    """Run integration tests."""
    print("=" * 60)
    print("Statement Block Service Integration Test")
    print("=" * 60)
    
    # Check current model provider from environment
    model_provider = os.getenv('MODEL_PROVIDER', 'gemini')
    print(f"Testing with MODEL_PROVIDER: {model_provider}")
    print("=" * 60 + "\n")
    
    # Run tests
    tests_passed = 0
    total_tests = 2
    
    if test_health_check():
        tests_passed += 1
    
    if test_process_text():
        tests_passed += 1
    
    # Summary
    print("=" * 60)
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    print("=" * 60)
    
    if tests_passed == total_tests:
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed!")
        return 1

if __name__ == "__main__":
    exit(main())