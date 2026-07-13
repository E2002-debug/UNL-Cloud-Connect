import requests

url = "http://localhost:8000/api/auth/login"
payload = {
    "username": "isabel.morocho@unl.edu.ec",
    "password": "password"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print(e)
