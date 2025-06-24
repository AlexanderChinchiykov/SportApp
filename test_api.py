import requests
import json

# Test user data
test_user = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "role": "guest",
    "is_club_owner": True
}

print(f"Sending request with data: {json.dumps(test_user, indent=2)}")

# Make the request
try:
    response = requests.post(
        "http://localhost:8001/api/v1/auth/register",
        headers={"Content-Type": "application/json"},
        data=json.dumps(test_user)
    )
    
    print(f"Status code: {response.status_code}")
    
    try:
        resp_json = response.json()
        print(f"Response JSON: {json.dumps(resp_json, indent=2)}")
    except Exception as e:
        print(f"Response (not JSON): {response.text}")
    
    if response.status_code >= 400:
        print("Error details:")
        try:
            error_detail = response.json()
            print(json.dumps(error_detail, indent=2))
        except Exception as parse_err:
            print(f"Could not parse error response as JSON: {str(parse_err)}")
            
except Exception as e:
    print(f"Request failed: {e}") 