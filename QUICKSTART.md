# Quick Start Guide - Dad's Medical Tracker

## 🚀 Quick Setup (5-10 minutes)

### Option 1: Using Local MongoDB (Simplest)

#### Step 1: Install Node.js
Download and install from https://nodejs.org/ (LTS version recommended)

#### Step 2: Install MongoDB (Local)
1. Download from https://www.mongodb.com/try/download/community
2. Install using default settings
3. MongoDB will start automatically as a Windows Service

#### Step 3: Open Terminal in Backend Folder
```bash
cd d:\dad\backend
npm install
```

#### Step 4: Start Backend
```bash
npm start
```
You should see: `Server running on port 5000`

#### Step 5: Open Frontend
1. Go to `d:\dad\frontend`
2. Right-click on `index.html`
3. Select "Open with" → Your browser
4. The app should load!

---

### Option 2: Using MongoDB Atlas (Cloud - Recommended for Multi-Device)

#### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with email/password
4. Create a free cluster

#### Step 2: Get Connection String
1. Click "Connect"
2. Choose "Connect to your application"
3. Copy the connection string
4. Replace `<password>` with your database password

#### Step 3: Update Backend Configuration
1. Open `d:\dad\backend\.env`
2. Replace MONGODB_URI with your connection string:
```
MONGODB_URI=mongodb+srv://yourUsername:yourPassword@cluster.mongodb.net/dad-medical-tracker?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

#### Step 4: Start Backend & Frontend
Same as Option 1, Steps 3-5

---

## 📱 Using the App

### First Time Setup
1. Click **"+ Add Patient"**
2. Fill in your dad's information
3. Click **"Save Patient"**

### Recording Observations
1. Select patient from dropdown
2. Click **"👁️ Observation"** tab
3. Fill in vital signs
4. Click **"Save Observation"**

### Recording Medications
1. Select patient from dropdown
2. Click **"💊 Vitamins"** tab
3. Enter medication details
4. Click **"Save Medication"**

### Recording Questions
1. Select patient from dropdown
2. Click **"❓ Ask"** tab
3. Type your question
4. Click **"Add Question"**

### Tracking Intake/Output
1. Select patient from dropdown
2. Click **"🥗 Intakes"** tab
3. Expand sections (Water, Food, Stomach, Urine)
4. Fill in amounts
5. Click **"Save Record"**

---

## 🔗 Multi-Device Access

The app works on multiple devices when using MongoDB Atlas:

1. **On Device 1**: Open `d:\dad\frontend\index.html` in browser
2. **On Device 2**: Open the same file in another browser
3. **Add Data**: Enter data on Device 1
4. **See Updates**: Automatically appears on Device 2 (may need refresh)

**Tip**: Works on phones too! Just navigate to the frontend folder when transferred via email/cloud.

---

## ⚠️ Common Issues & Solutions

### "MongoDB is not running"
**Windows PowerShell:**
```powershell
# Start MongoDB
Start-Service MongoDB

# Check if running
Get-Service MongoDB
```

### "Connection refused on port 5000"
1. Make sure backend terminal shows `Server running on port 5000`
2. Wait 5 seconds after starting before opening frontend

### "No data appears"
1. Check you've selected a patient
2. Open browser Developer Tools (F12)
3. Check Console tab for errors

### Can't access from another device
- Make sure you're using MongoDB Atlas (not local MongoDB)
- Check firewall settings
- Verify MONGODB_URI in `.env` file

---

## 📞 Need Help?

1. **Check MongoDB Service** (Windows):
   - Press `Win + R`
   - Type `services.msc`
   - Look for "MongoDB" or "mongod"
   - Should show "Running"

2. **Check Backend is Running**:
   - Terminal should show `Server running on port 5000`
   - Visit http://localhost:5000/health
   - Should show `{"status":"Server is running"}`

3. **Frontend Not Loading Data**:
   - Open Browser Console (F12)
   - Check for red error messages
   - Look for CORS or 404 errors

---

## 🎯 Using in Shifts

1. **Start of Shift**: Select patient, review yesterday's notes on each tab
2. **During Shift**: Record observations, medications, intake/output
3. **End of Shift**: Review what you entered
4. **Handover**: Next caregiver sees all data on their device

---

## 📊 Data Organization

The app saves everything to MongoDB with:
- **Patient**: Basic info, emergency contact
- **Observations**: All vital signs with timestamps
- **Medications**: Dosages, schedules, purposes
- **Questions**: Doctor questions with answers
- **Intakes**: All intake/output measurements

Everything is labeled with WHO entered it and WHEN, so you always know the source of data.

---

**Ready? Start with Option 1 or 2 above! Questions? Check the full README.md**
