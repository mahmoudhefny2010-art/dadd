# Deployment Guide - Dad's Medical Tracker

## Local Deployment (Single Device)

### Prerequisites
- Node.js v14+
- MongoDB Community Server OR MongoDB Atlas account

### Steps

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Database Connection**
   - Edit `backend/.env`
   - For local MongoDB:
     ```
     MONGODB_URI=mongodb://localhost:27017/dad-medical-tracker
     ```
   - For MongoDB Atlas:
     ```
     MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dad-medical-tracker
     ```

3. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Should show: `Server running on port 5000`

4. **Open Frontend**
   - Navigate to `frontend/index.html` in your browser
   - Or use a local server:
     ```bash
     cd frontend
     python -m http.server 8000
     # Visit http://localhost:8000
     ```

---

## Multi-Device Deployment (Using MongoDB Atlas)

### For Hospital/Medical Center

#### Setup MongoDB Atlas (Cloud Database)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account
   - Create organization

2. **Create Cluster**
   - Choose "Build a Cluster"
   - Select Shared (free tier)
   - Choose region closest to your location
   - Create cluster

3. **Setup Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: medical_user
   - Password: [Create strong password]
   - Role: "Read and write to any database"
   - Add User

4. **Get Connection String**
   - Go to "Clusters" → "Connect"
   - Choose "Connect Your Application"
   - Copy connection string
   - Replace `<password>` with your password

#### Deploy Backend (Choose One)

**Option A: Local Server (Simple)**
1. Update `backend/.env` with MongoDB Atlas connection string
2. Start backend: `npm start`
3. Keep terminal running

**Option B: Cloud Hosting (Recommended)**

Deploy to Heroku:
1. Create Heroku account
2. Install Heroku CLI
3. From backend directory:
   ```bash
   heroku create your-app-name
   heroku config:set MONGODB_URI=your_mongodb_uri
   git push heroku main
   ```

#### Access Frontend from Multiple Devices

**Option 1: One Computer Running Backend**
1. Get computer IP address (Windows):
   ```
   ipconfig
   Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```
2. In `frontend/app.js`, change:
   ```javascript
   const API_BASE = 'http://192.168.1.100:5000/api';
   ```
3. Share `frontend/index.html` with other devices
4. Other devices access: `http://192.168.1.100/frontend/index.html`

**Option 2: Hosted Frontend (Better)**
1. Deploy frontend to Netlify/GitHub Pages
2. Update API_BASE to your backend URL
3. Access from anywhere

---

## Docker Deployment (Professional Setup)

### Requirements
- Docker Desktop installed
- Docker Compose

### Steps

1. **Update Passwords**
   - Edit `docker-compose.yml`
   - Change MongoDB password
   - Update environment variables

2. **Build and Run**
   ```bash
   docker-compose up -d
   ```

3. **Access Application**
   - Frontend: http://localhost
   - Backend: http://localhost:5000
   - MongoDB: localhost:27017

4. **View Logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop**
   ```bash
   docker-compose down
   ```

---

## Backup Strategy

### Backup MongoDB Data

**Local MongoDB:**
```bash
mongodump --db dad-medical-tracker --out ./backup
```

**MongoDB Atlas:**
1. Use Atlas backup feature (automatic daily backups included)
2. Manual export: Use MongoDB Compass or Atlas UI

**Automated Backup Script:**
```bash
# Windows - schedule with Task Scheduler
@echo off
set BACKUP_DIR=C:\backups\dad-medical-tracker
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
mongodump --db dad-medical-tracker --out %BACKUP_DIR%\%TIMESTAMP%
```

---

## Monitoring & Maintenance

### Check System Status
```bash
# Test backend
curl http://localhost:5000/health

# Test MongoDB connection
mongosh "mongodb://localhost:27017"
```

### Common Issues

**MongoDB Won't Connect**
- Check MongoDB service is running
- Verify connection string
- Check firewall settings

**Frontend Can't Reach Backend**
- Ensure backend is running on port 5000
- Check API_BASE URL in app.js
- Verify CORS is enabled

**Slow Performance**
- Check MongoDB indexes were created
- Monitor server resources
- Consider scaling MongoDB tier on Atlas

---

## Security Checklist

- [ ] Change default MongoDB passwords
- [ ] Use HTTPS in production
- [ ] Add authentication to frontend
- [ ] Keep backups offline
- [ ] Use VPN for remote access
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Set NODE_ENV=production
- [ ] Use strong .env passwords

---

## Performance Optimization

1. **Database Indexing**
   - MongoDB automatically indexes common fields
   - Consider adding custom indexes for frequently queried fields

2. **Frontend Caching**
   - Browser caches static files
   - Reduce page refresh for better performance

3. **Query Optimization**
   - Limit data fetched (pagination recommended)
   - Use indexed fields in queries

---

## Troubleshooting

### "EACCES: permission denied"
```bash
# Linux/Mac: Fix permissions
sudo chown -R $USER:$USER backend/
```

### "Address already in use"
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### "MongoDB connection timeout"
- Check internet connection (if using Atlas)
- Verify IP whitelist in MongoDB Atlas
- Check firewall rules

---

## Scaling for Large Patient Volume

- MongoDB Atlas provides auto-scaling
- Consider read replicas for multiple simultaneous users
- Implement caching layer (Redis)
- Use CDN for frontend assets
- Add load balancer for backend

---

For additional support or deployment questions, consult the main README.md
