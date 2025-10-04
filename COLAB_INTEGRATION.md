# 🛰️ Upload Real NASA Satellite Data from Google Colab

This guide shows you how to upload **real NASA satellite data** (MODIS & SMAP) from Google Colab to your Terranaut game.

---

## 📋 Prerequisites

Before you start, make sure you have:

1. ✅ **Started a game** in Terranaut (the upload will automatically go to your active game)
2. ✅ **Google Colab** access (free account is fine)
3. ✅ **Your authentication token** from the Terranaut app

---

## 🔑 Step 1: Get Your Authentication Token

Your auth token lets Google Colab securely upload data to your game.

### How to get it:

1. **Open the Terranaut app** in your browser
2. **Press `F12`** to open Developer Tools
3. **Click the "Console" tab**
4. **Type this command** and press Enter:
   ```javascript
   localStorage.getItem('sb-promrhlttjogqgevangf-auth-token')
   ```
5. **Copy the token** (it's a long string in quotes - copy WITHOUT the quotes)

**Example output:**
```
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
Copy everything **between** the quotes.

---

## 🐍 Step 2: Prepare Your Google Colab Notebook

Open a new Google Colab notebook and add these cells:

### Cell 1: Install Dependencies

```python
!pip install requests pandas numpy -q
```

**👆 Run this cell first** (click the play button or press Shift+Enter)

---

### Cell 2: Set Your Authentication Token

```python
# 🔑 PASTE YOUR AUTH TOKEN HERE (between the quotes)
AUTH_TOKEN = "paste_your_token_here"

# 🌐 API Configuration (don't change these)
UPLOAD_URL = "https://promrhlttjogqgevangf.supabase.co/functions/v1/upload-satellite-data"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb21yaGx0dGpvZ3FnZXZhbmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTYzNzYsImV4cCI6MjA3NTEzMjM3Nn0.B9gN3_fAn_q6sgoaT2oToOjmnf6UnmWaESU4j7r05P4"

print("✅ Configuration loaded!")
```

**👆 Replace `paste_your_token_here` with your actual token from Step 1**

---

### Cell 3: Prepare Your Satellite Data

```python
import pandas as pd
from datetime import datetime, timedelta

# 📊 Example: Create sample satellite data
# Replace this with your real NASA data processing!

satellite_data = [
    {
        "date": "2025-01-01",
        "NDVI_obs": 0.72,          # Observed NDVI from MODIS
        "NDVI_syn": 0.72,          # Synthesized/interpolated NDVI
        "NDVI_is_synth": False,    # Is this value interpolated?
        "NDVI_age_days": 0,        # How old is the observation?
        
        "LST_obs": 22.5,           # Observed temperature (°C)
        "LST_syn": 22.5,
        "LST_is_synth": False,
        "LST_age_days": 0,
        
        "SM_obs": 0.45,            # Observed soil moisture (0-1 scale)
        "SM_syn": 0.45,
        "SM_is_synth": False,
        "SM_age_days": 0,
        
        # Optional weather data
        "Tmax_C": 28.0,
        "Tmin_C": 18.0,
        "RH_pct": 65.0,
        "Wind_ms": 3.5,
        "Rain_mm": 0.0,
        "SWrad_MJm2": 22.5
    },
    # Add more days here...
    {
        "date": "2025-01-02",
        "NDVI_obs": None,          # Missing observed value
        "NDVI_syn": 0.71,          # Interpolated value used
        "NDVI_is_synth": True,     # Marked as interpolated
        "NDVI_age_days": 3,        # 3 days old observation
        
        "LST_obs": 23.0,
        "LST_syn": 23.0,
        "LST_is_synth": False,
        "LST_age_days": 0,
        
        "SM_obs": 0.43,
        "SM_syn": 0.43,
        "SM_is_synth": False,
        "SM_age_days": 0,
    },
]

print(f"📊 Prepared {len(satellite_data)} days of satellite data")
```

**👆 This is where you add your NASA satellite data!**

Replace the example data with your actual MODIS/SMAP processing results.

---

### Cell 4: Upload Data to Terranaut

```python
import requests

# 📤 Upload the data
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "apikey": ANON_KEY
}

payload = {
    # No need to specify game_session_id!
    # It will automatically go to your active game
    "satellite_data": satellite_data
}

print("🚀 Uploading satellite data...")

response = requests.post(UPLOAD_URL, json=payload, headers=headers)

# 📊 Show results
if response.status_code == 200:
    result = response.json()
    print("\n✅ SUCCESS! Satellite data uploaded!")
    print(f"   📦 Records uploaded: {result.get('records_uploaded', 'N/A')}")
    print(f"   📅 Date range: {result.get('data_summary', {}).get('date_range', {}).get('start', 'N/A')} to {result.get('data_summary', {}).get('date_range', {}).get('end', 'N/A')}")
    print(f"   🟢 Observed data: {result.get('data_summary', {}).get('observed_count', 0)} days")
    print(f"   🟡 Interpolated data: {result.get('data_summary', {}).get('interpolated_count', 0)} days")
    print("\n🎮 Go back to your game - data will appear automatically!")
else:
    print(f"\n❌ Upload failed!")
    print(f"   Status code: {response.status_code}")
    print(f"   Error: {response.text}")
```

**👆 Run this cell to upload your data**

---

## 🎮 Step 3: Check Your Game

After running Cell 4:

1. **Return to the Terranaut game** in your browser
2. **Wait 10 seconds** (the game checks for new data every 10 seconds)
3. **Look for the 🟢 Real badge** - this confirms real NASA data is loaded
4. **Continue playing** - your game now uses real satellite data!

---

## 📊 Data Format Reference

Your satellite data must follow this format:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | ✅ Yes | Date in `YYYY-MM-DD` format |
| `NDVI_obs` | number | ❌ No | Observed NDVI (0.0-1.0) |
| `NDVI_syn` | number | ✅ Yes | Synthesized NDVI (0.0-1.0) |
| `NDVI_is_synth` | boolean | ✅ Yes | Is NDVI interpolated? |
| `NDVI_age_days` | number | ✅ Yes | Age of NDVI observation (days) |
| `LST_obs` | number | ❌ No | Observed temperature (°C) |
| `LST_syn` | number | ✅ Yes | Synthesized temperature (°C) |
| `LST_is_synth` | boolean | ✅ Yes | Is temperature interpolated? |
| `LST_age_days` | number | ✅ Yes | Age of temperature observation |
| `SM_obs` | number | ❌ No | Observed soil moisture (0.0-1.0) |
| `SM_syn` | number | ✅ Yes | Synthesized soil moisture (0.0-1.0) |
| `SM_is_synth` | boolean | ✅ Yes | Is soil moisture interpolated? |
| `SM_age_days` | number | ✅ Yes | Age of soil moisture observation |
| `Tmax_C` | number | ❌ No | Max temperature (°C) |
| `Tmin_C` | number | ❌ No | Min temperature (°C) |
| `RH_pct` | number | ❌ No | Relative humidity (%) |
| `Wind_ms` | number | ❌ No | Wind speed (m/s) |
| `Rain_mm` | number | ❌ No | Rainfall (mm) |
| `SWrad_MJm2` | number | ❌ No | Solar radiation (MJ/m²) |

**Notes:**
- `*_obs` fields are optional (use `None` if missing)
- `*_syn` fields are required (interpolated values)
- Dates should cover your game period (check game start date)

---

## ❓ Troubleshooting

### Upload fails with 401 Unauthorized
- ❌ **Problem:** Invalid or expired authentication token
- ✅ **Solution:** Get a fresh token from Step 1

### Upload succeeds but game shows no data
- ❌ **Problem:** Game hasn't polled yet
- ✅ **Solution:** Wait 10 seconds (game checks every 10 seconds)

### "No active game session found" error
- ❌ **Problem:** No active game running
- ✅ **Solution:** Start a new game in Terranaut first

### Data format errors
- ❌ **Problem:** Invalid data format
- ✅ **Solution:** Check all required fields are present (see Data Format Reference above)

### Wrong dates showing
- ❌ **Problem:** Date mismatch with game period
- ✅ **Solution:** Ensure satellite data dates match your game's timeframe

---

## 💡 Tips

- 🔄 **Multiple uploads:** You can upload data multiple times - new data replaces old data
- 📅 **Date alignment:** Make sure your satellite dates match your game's growing season
- 🎯 **Active game only:** Uploads go to your most recent active (not completed) game
- 🔍 **Check quality flags:** Use `*_is_synth` and `*_age_days` to track data quality

---

## 🆘 Need Help?

If you encounter issues:
1. Check the error message in Cell 4 output
2. Verify your auth token is correct and not expired
3. Ensure you have an active game running
4. Check your data format matches the reference table

---

**Happy farming with real NASA data! 🌱🛰️**
