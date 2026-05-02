# ⚡ Troubleshooting Guide - Dad's Medical Tracker

## 🚨 Emergency Fixes

### Application Won't Start

#### Backend Shows "Cannot find module"
```bash
cd backend
npm install
```

#### Backend Port Already in Use
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Or change port in .env
PORT=5001
```

#### MongoDB Not Connecting
1. **Check if MongoDB is running:**
   - Windows: Open Services.msc, look for "MongoDB" or "mongod"
   - Mac/Linux: `ps aux | grep mongod`

2. **Start MongoDB if stopped:**
   - Windows: `net start MongoDB` (as Administrator)
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

3. **Verify connection string in .env**

---

## 🔍 Frontend Issues

### "Cannot GET /health" or Blank Page

**Solution:**
1. Open browser console (F12)
2. Check for red errors
3. Verify backend is running on port 5000
4. If using different IP, update API_BASE in frontend/app.js

### Data Not Showing Up

**Checklist:**
- [ ] Patient is selected (dropdown has value)
- [ ] Backend is running
- [ ] No red errors in browser console
- [ ] MongoDB is connected

**Debug Steps:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Type: `fetch('http://localhost:5000/health').then(r => r.json()).then(console.log)`
4. Should show: `{status: "Server is running"}`

### Saving Data Doesn't Work

**Try this:**
```javascript
// In browser console
const API_BASE = 'http://localhost:5000/api';
fetch(API_BASE + '/patients')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If you see CORS error:
- Ensure backend is running
- Check Express CORS is enabled in server.js

---

## 🗄️ Database Issues

### "Connection refused" Error

**For Local MongoDB:**
```bash
# Start MongoDB service
mongod

# Or Windows:
net start MongoDB

# Or Mac:
brew services start mongod
```

**For MongoDB Atlas:**
1. Check internet connection
2. Go to MongoDB Atlas console
3. Verify cluster status (should be green)
4. Check IP whitelist setting (should include your IP or 0.0.0.0)

### "Authentication failed"

**MongoDB Atlas:**
1. Go to Database Access
2. Verify username and password
3. Check password in .env matches (no special char escaping needed in URL)
4. Try resetting password in Atlas UI

### "Database quota exceeded"

For MongoDB Atlas free tier:
- Maximum 512 MB storage
- If exceeded, need to upgrade or delete old records

---

## 🔗 Multi-Device Access Issues

### Can't Access from Another Device

**Verify:**
1. Both devices on same network
2. Windows Firewall allows port 5000
3. Backend running on correct machine

**Windows Firewall:**
```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

**Or use MongoDB Atlas instead** (recommended for multi-device):
- Eliminates network issues
- Works from anywhere
- Free tier includes 512 MB

### Slow Performance

**Possible causes:**
- Internet connection too slow
- MongoDB overloaded
- Too many records

**Solutions:**
1. Limit data displayed (show last 50 records)
2. Upgrade MongoDB tier
3. Add database indexes
4. Clear old test data

---

## 💾 Data Backup & Recovery

### Backup MongoDB Locally

```bash
# Backup
mongodump --db dad-medical-tracker --out ./backup

# Restore
mongorestore --db dad-medical-tracker ./backup/dad-medical-tracker

# Windows might need full path to mongodump
"C:\Program Files\MongoDB\Server\5.0\bin\mongodump.exe" --db dad-medical-tracker --out ./backup
```

### Backup from MongoDB Atlas

1. Go to Atlas console
2. Cluster → Backup
3. Download snapshot (if available)
4. Or use mongodump with Atlas connection string

### Data Lost - Recovery Steps

**If using Atlas:**
- Check backups section
- Can restore from automatic backups

**If using local MongoDB:**
- Check if backup directory exists
- Restore from latest backup

---

## 🖥️ System Requirements Check

### Verify Installation

```bash
# Check Node.js
node --version
# Should show v14.0.0 or higher

# Check npm
npm --version
# Should show 6.0.0 or higher

# Check MongoDB (if installed locally)
mongod --version
# Should show version 4.0 or higher
```

### If MongoDB Missing

**Windows:**
```powershell
choco install mongodb-community
# Or download from mongodb.com
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

---

## 🐛 Common Error Messages

### "ENOENT: no such file or directory"
```
Solution: File doesn't exist
Check if .env file exists in backend/
Copy .env.example to .env
```

### "Unexpected token in JSON"
```
Solution: Malformed JSON in .env
Make sure strings are quoted
MONGODB_URI="mongodb://..."
```

### "Cannot read property 'value' of undefined"
```
Solution: Form field is empty
Make sure all required fields filled before submit
```

### "POST http://localhost:5000/api/patients 404"
```
Solution: Backend not running
Start backend: npm start
OR backend running on different port
```

---

## 🔧 Advanced Debugging

### Enable Verbose Logging

**Backend:**
```javascript
// Add to server.js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

**Frontend (DevTools Console):**
```javascript
// Set debug mode
window.DEBUG = true;

// Check all API calls
// They appear in Network tab → F12
```

### Test API Directly

```bash
# Use curl or Postman
curl -X GET http://localhost:5000/api/patients
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"Dad","age":65}'
```

---

## 📞 When to Seek Help

If you see these and steps above don't work:
- Persistent MongoDB connection errors
- Node.js installation issues
- Network/firewall problems
- CORS errors after checking configuration

**Provide when asking for help:**
1. Full error message (copy-paste)
2. What you did before error
3. Output of `npm --version`
4. Output of `node --version`
5. Your operating system

---

## 🛡️ Emergency Data Protection

### Before Long Application Sessions

**Backup database:**
```bash
mongodump --db dad-medical-tracker --out "./backup-$(date +%Y%m%d-%H%M%S)"
```

**Or schedule automatic backups** (on MongoDB Atlas)

### Keep Application Running

For long shifts:
1. Use screen/tmux to keep terminal session alive
2. Or deploy to cloud (Heroku, AWS, etc.)
3. Monitor logs for errors

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `npm --version` returns version number
- [ ] `node --version` returns version number
- [ ] MongoDB running (check with `mongod --version`)
- [ ] Backend starts (`npm start` shows "Server running")
- [ ] Frontend loads in browser
- [ ] Can add patient
- [ ] Can select patient
- [ ] Can record observation
- [ ] Can record medication
- [ ] Can ask question
- [ ] Can record intake

If all checked: **You're ready to use!**

---

**Last Updated:** May 2026  
**For more help:** See README.md or DEPLOYMENT.md
