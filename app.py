from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import requests
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Supabase Config
SUPABASE_URL = "https://kgmvyhtjvjhjnihzbpsv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbXZ5aHRqdmpoam5paHpicHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNzA4NDgsImV4cCI6MjA1ODg0Njg0OH0.V0XjsNCPC9fTuQjyQxo_pO8vzEhl7rds0E5blUqJrRo"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Google AI API Config
GOOGLE_AI_API_KEY = "AIzaSyCVPaOjrxoFJWKAhvurEXgTz7HSCcs5rJ4"
GOOGLE_AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# Check if user exists
def is_registered(email):
    response = supabase.table("users").select("email").eq("email", email).execute()
    return len(response.data) > 0 if response.data else False

# Register a new user
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")  # Ideally, hash passwords

    if is_registered(email):
        return jsonify({"message": "User already registered"}), 400

    response = supabase.table("users").insert({"name": name, "email": email, "password": password}).execute()
    return jsonify({"message": "Registration successful", "data": response.data}), 200

# Chatbot API endpoint
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    email = data.get("email")
    prompt = data.get("prompt")

    if not is_registered(email):
        return jsonify({"error": "User not registered"}), 403

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]  # Correct format for Google AI API
    }
    headers = {"Authorization": f"Bearer {GOOGLE_AI_API_KEY}", "Content-Type": "application/json"}

    response = requests.post(GOOGLE_AI_API_URL, json=payload, headers=headers)
    
    if response.status_code == 200:
        return jsonify({"response": response.json()}), 200
    else:
        return jsonify({"error": "Failed to get a response", "details": response.text}), response.status_code

if __name__ == '__main__':
    app.run(debug=True)
