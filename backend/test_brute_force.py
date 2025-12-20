"""
Brute Force Attack Test Script
Tests the backend API's ability to detect and respond to brute force attacks
by sending rapid requests (>5 per second) from the same IP
"""

import requests
import time
import json
from datetime import datetime

# Configuration
API_URL = "https://chameleon-defence-api.onrender.com/analyze"
# For local testing: API_URL = "http://localhost:8000/analyze"

def send_request(payload, request_num):
    """Send a single request to the API"""
    try:
        start = time.time()
        response = requests.post(
            API_URL,
            json={"payload": payload},
            timeout=30
        )
        elapsed = time.time() - start
        
        data = response.json()
        classification = data.get('analysis', {}).get('verdict', 'Unknown')
        confidence = data.get('analysis', {}).get('confidence', 0)
        status = data.get('status', response.status_code)
        message = data.get('message', 'No message')
        
        print(f"Request #{request_num}:")
        print(f"  ⏱️  Response Time: {elapsed:.2f}s")
        print(f"  🎯 Classification: {classification}")
        print(f"  📊 Confidence: {confidence:.2%}")
        print(f"  🔢 Status: {status}")
        print(f"  💬 Message: {message}")
        print()
        
        return {
            'request_num': request_num,
            'classification': classification,
            'confidence': confidence,
            'status': status,
            'elapsed': elapsed,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Request #{request_num} FAILED: {e}")
        return None

def test_brute_force():
    """Test brute force detection by sending rapid requests"""
    print("=" * 60)
    print("🧪 BRUTE FORCE DETECTION TEST")
    print("=" * 60)
    print(f"Target API: {API_URL}")
    print(f"Test: Sending 10 rapid requests (>5 per second)")
    print("=" * 60)
    print()
    
    # Test payload (benign login attempt)
    payload = "admin"
    
    results = []
    
    # Send requests as fast as possible
    print("🚀 Sending rapid requests...\n")
    start_time = time.time()
    
    for i in range(1, 11):
        result = send_request(payload, i)
        if result:
            results.append(result)
            
            # Check if brute force was detected
            if result['classification'] == 'Brute Force':
                print("✅ BRUTE FORCE DETECTED!")
                print(f"   Detection occurred at request #{i}")
                print()
    
    total_time = time.time() - start_time
    
    # Summary
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Requests: {len(results)}")
    print(f"Total Time: {total_time:.2f}s")
    print(f"Request Rate: {len(results)/total_time:.2f} req/sec")
    print()
    
    # Count classifications
    classifications = {}
    for r in results:
        cls = r['classification']
        classifications[cls] = classifications.get(cls, 0) + 1
    
    print("Classification Breakdown:")
    for cls, count in classifications.items():
        print(f"  • {cls}: {count}")
    print()
    
    # Check if test passed
    if 'Brute Force' in classifications:
        print("✅ TEST PASSED: Brute force attack was successfully detected!")
        print(f"   {classifications['Brute Force']} requests classified as Brute Force")
    else:
        print("❌ TEST FAILED: Brute force attack was NOT detected")
        print("   Possible reasons:")
        print("   - Requests not sent fast enough (need >5 req/sec)")
        print("   - Backend not deployed with updated code")
        print("   - Network latency spreading out requests")
    
    print("=" * 60)
    
    return results

def test_normal_rate():
    """Test normal request rate (should not trigger brute force)"""
    print("\n" + "=" * 60)
    print("🧪 NORMAL RATE TEST (Control)")
    print("=" * 60)
    print("Sending 5 requests with 0.5s delay (should NOT trigger brute force)")
    print("=" * 60)
    print()
    
    payload = "testuser"
    results = []
    
    for i in range(1, 6):
        result = send_request(payload, i)
        if result:
            results.append(result)
        time.sleep(0.5)  # Wait 0.5 seconds between requests
    
    print("=" * 60)
    print("📊 CONTROL TEST SUMMARY")
    print("=" * 60)
    
    classifications = {}
    for r in results:
        cls = r['classification']
        classifications[cls] = classifications.get(cls, 0) + 1
    
    print("Classification Breakdown:")
    for cls, count in classifications.items():
        print(f"  • {cls}: {count}")
    
    if 'Brute Force' not in classifications:
        print("\n✅ CONTROL PASSED: Normal rate requests NOT flagged as brute force")
    else:
        print("\n⚠️  CONTROL FAILED: Normal rate incorrectly flagged as brute force")
    
    print("=" * 60)

if __name__ == "__main__":
    print("\n🦎 ChamAIleon Brute Force Detection Test Suite\n")
    
    # Run brute force test
    brute_results = test_brute_force()
    
    # Wait a bit before control test
    print("\nWaiting 3 seconds before control test...")
    time.sleep(3)
    
    # Run control test
    test_normal_rate()
    
    print("\n✨ All tests complete!\n")
