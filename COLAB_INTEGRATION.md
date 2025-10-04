# Google Colab Integration Guide

This guide explains how to upload real NASA satellite data to your Terranaut game session using Google Colab.

## Overview

The game supports both synthetic (simulated) and real NASA satellite data. To use real satellite data from NASA POWER and MODIS, you can upload it via a Google Colab notebook.

## Prerequisites

- A running game session (you'll get a `game_session_id` when you start playing)
- Access to Google Colab
- Internet connection

## Step 1: Get Your Game Session ID

When you start a game, you'll see a card at the top with your unique `game_session_id`. It looks like:

```
64f3f068-6aa6-4203-bd2c-c1f30d1178e1
```

Click the copy button to copy this ID to your clipboard.

## Step 2: Upload Endpoint

The game provides an edge function to receive satellite data uploads:

**Endpoint URL:**
```
https://promrhlttjogqgevangf.supabase.co/functions/v1/upload-satellite-data
```

**Authentication:**
You'll need to authenticate using your Lovable Cloud credentials (handled automatically if you're logged in).

## Step 3: Python Code for Colab

Use this Python code snippet in your Google Colab notebook:

```python
import requests
import pandas as pd
from datetime import datetime, timedelta

# Your game session ID (paste it here)
GAME_SESSION_ID = "64f3f068-6aa6-4203-bd2c-c1f30d1178e1"

# API endpoint
UPLOAD_URL = "https://promrhlttjogqgevangf.supabase.co/functions/v1/upload-satellite-data"

# Your authentication token (get from browser localStorage)
AUTH_TOKEN = "your-auth-token-here"

# Prepare your satellite data as a list of records
satellite_data = [
    {
        "date": "2025-07-06",
        "ndvi": 0.72,
        "lst_kelvin": 295.5,
        "lst_celsius": 22.35,
        "soil_moisture": 0.45,
        "data_source": "MODIS_REAL",
        "quality_flags": {"cloud_cover": 5, "data_quality": "good"}
    },
    # Add more records here...
]

# Upload the data
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb21yaGx0dGpvZ3FnZXZhbmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTYzNzYsImV4cCI6MjA3NTEzMjM3Nn0.B9gN3_fAn_q6sgoaT2oToOjmnf6UnmWaESU4j7r05P4"
}

payload = {
    "game_session_id": GAME_SESSION_ID,
    "satellite_data": satellite_data
}

response = requests.post(UPLOAD_URL, json=payload, headers=headers)

if response.status_code == 200:
    print("✅ Satellite data uploaded successfully!")
    print(response.json())
else:
    print(f"❌ Upload failed: {response.status_code}")
    print(response.text)
```

## Step 4: Data Format

Each satellite data record must include:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | Yes | Date in YYYY-MM-DD format |
| `ndvi` | number | Yes | Normalized Difference Vegetation Index (0.0-1.0) |
| `lst_kelvin` | number | Yes | Land Surface Temperature in Kelvin |
| `lst_celsius` | number | Yes | Land Surface Temperature in Celsius |
| `soil_moisture` | number | Yes | Soil moisture (0.0-1.0, represents 0-100%) |
| `data_source` | string | Yes | Set to "MODIS_REAL" for real data |
| `quality_flags` | object | No | Additional metadata about data quality |

## Step 5: Getting Your Auth Token

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Type: `localStorage.getItem('supabase.auth.token')`
4. Copy the token value (without quotes)
5. Paste it in the `AUTH_TOKEN` variable in your Colab notebook

## Step 6: Verify Upload

After uploading:
1. Return to your game
2. The game polls for new data every 10 seconds
3. When real data is detected, you'll see a "🟢 Real" badge
4. The game will automatically load the uploaded data

## Fallback to Synthetic Data

If no real data is uploaded within 30 seconds:
- The game will offer a "Generate Synthetic Data" button
- This creates simulated satellite data so you can continue playing
- You can still upload real data later, and it will replace the synthetic data

## Troubleshooting

**Upload fails with 401 error:**
- Check that your AUTH_TOKEN is correct and not expired
- Try refreshing your browser and getting a new token

**Upload succeeds but game doesn't show data:**
- Wait 10 seconds for the polling to detect new data
- Check that the `game_session_id` matches exactly
- Verify that `data_source` is set to "MODIS_REAL"

**Data format errors:**
- Ensure all dates are in YYYY-MM-DD format
- NDVI and soil_moisture should be between 0.0 and 1.0
- Temperature should be in Kelvin (typically 273-323 range)

## Support

For issues or questions, refer to the game documentation or contact support.
