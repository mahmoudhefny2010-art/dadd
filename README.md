# Dad's Medical Tracker

A comprehensive web-based medical tracking system designed for coordinated care across shifts. Track vital signs, medications, observations, and intake/output measurements in real-time with multi-device access.

## Features

### 📋 Ask (Doctor Questions)
- Add questions to ask the doctor during appointments
- Set priority levels (low, medium, high)
- Categorize questions by topic
- Mark questions as answered with the doctor's response
- Track follow-up questions

### 👁️ Observation
- Real-time vital signs recording:
  - Blood Sugar (mg/dL)
  - Blood Pressure (systolic/diastolic)
  - Oxygen Level (SpO2 %)
  - Heart Rate (bpm)
  - Temperature (°C)
- Add notes and observations
- Record who took the measurements
- View historical data with timestamps

### 💊 Vitamins (Medications & IV)
- Track all medications and IV fluids:
  - Oral medications
  - Injections
  - IV fluids
  - Topical applications
  - Inhalers
- Specify dosage and units
- Set medication schedules with exact times
- Track medication purposes
- Record start and end dates
- Add notes about interactions or side effects

### 🥗 Intakes & Outputs
- **Water Intake**: Track daily fluid consumption (mL)
- **Food Intake**: Record food descriptions and amounts
- **Stomach Output**: Track nasogastric output, vomit, etc.
- **Urine Output**: Track urine volume, color, and characteristics
- Full measurement units support
- Detailed notes for each category

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Responsive design with gradients
- **Vanilla JavaScript** - No dependencies, lightweight
- **Fetch API** - Backend communication

## Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or cloud):
  - Local installation: [MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud option: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## Installation

### 1. Clone or Download the Project

```bash
cd d:\dad
```

### 2. Setup Backend

```bash
cd backend
npm install
```

#### Configure Environment

Create a `.env` file in the `backend` directory:

```
MONGODB_URI=mongodb://localhost:27017/dad-medical-tracker
PORT=5000
NODE_ENV=development
```

**For MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dad-medical-tracker?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

### 3. Setup MongoDB

**If using local MongoDB:**

On Windows:
```powershell
# MongoDB should be running as a service
# Start MongoDB if it's not already running
mongod
```

**If using MongoDB Atlas:**
- Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster
- Get your connection string and add it to `.env`

## Running the Application

### Start Backend Server

From the `backend` directory:

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Open Frontend

1. Navigate to the `frontend` directory
2. Open `index.html` in a web browser

Or serve it with a simple HTTP server:

```bash
# From frontend directory
python -m http.server 8000
# Then go to http://localhost:8000
```

## Usage

### Getting Started

1. **Add a Patient**: Click "+ Add Patient" and fill in the patient information
2. **Select Patient**: Choose the patient from the dropdown menu
3. **Navigate Tabs**: Use the tab buttons to switch between different tracking areas

### Recording Data

Each tab has a form to enter data:
- Fill in the relevant fields
- Click "Save" button
- Data appears in the list below

### Managing Records

- **View**: All records display in the tab with latest first
- **Delete**: Click "Delete" button on any record to remove it
- **Mark Answered**: For questions, mark them as answered with the doctor's response

## Project Structure

```
d:\dad\
├── backend/
│   ├── models/
│   │   ├── Patient.js
│   │   ├── Observation.js
│   │   ├── Medication.js
│   │   ├── Question.js
│   │   └── Intake.js
│   ├── controllers/
│   │   ├── patientController.js
│   │   ├── observationController.js
│   │   ├── medicationController.js
│   │   ├── questionController.js
│   │   └── intakeController.js
│   ├── routes/
│   │   ├── patients.js
│   │   ├── observations.js
│   │   ├── medications.js
│   │   ├── questions.js
│   │   └── intakes.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── server.js
└── frontend/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── README.md
```

## API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Observations
- `GET /api/observations?patientId=<id>` - Get patient's observations
- `POST /api/observations` - Create new observation
- `PUT /api/observations/:id` - Update observation
- `DELETE /api/observations/:id` - Delete observation

### Medications
- `GET /api/medications?patientId=<id>` - Get patient's medications
- `POST /api/medications` - Add medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### Questions
- `GET /api/questions?patientId=<id>` - Get patient's questions
- `POST /api/questions` - Add question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Intakes
- `GET /api/intakes?patientId=<id>` - Get patient's intake records
- `POST /api/intakes` - Create intake record
- `PUT /api/intakes/:id` - Update intake record
- `DELETE /api/intakes/:id` - Delete intake record

## Features for Shift-Based Care

✅ **Multi-Device Access**: Access from different devices simultaneously
✅ **Real-Time Synchronization**: All entries sync across all devices
✅ **Shift Handover**: Easily view all updates with timestamps and who recorded them
✅ **Priority System**: Mark important questions as high priority
✅ **Record Tracking**: Know who entered each piece of data
✅ **Complete History**: Never lose track of past observations
✅ **Easy Data Entry**: Quick forms for fast recording during shifts

## Tips for Use

1. **Always Select Patient First**: Make sure a patient is selected before entering data
2. **Record Name**: Enter your name when recording data for accountability
3. **Schedule Reminders**: Use the schedule feature in medications to set reminder times
4. **Daily Review**: Start each shift by reviewing the previous shift's notes
5. **Question Priority**: Mark critical questions as high priority to ensure they're asked
6. **Backup Regularly**: Regularly backup your MongoDB data

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

### Frontend Won't Load Data
- Check if backend is running on port 5000
- Open browser console (F12) to see error messages
- Ensure CORS is properly configured

### Port Already in Use
```bash
# Change PORT in .env file to a different port (e.g., 5001)
# Or kill the process using port 5000

# On Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

## Future Enhancements

- [ ] User authentication and role-based access
- [ ] Email/SMS shift change notifications
- [ ] PDF reports and export functionality
- [ ] Mobile app native version
- [ ] Doctor portal for answering questions
- [ ] Appointment scheduling
- [ ] Lab results integration
- [ ] Emergency alert system

## Support

For issues or questions about using the application, please check the setup instructions or consult your technical administrator.

## License

MIT License - You're free to use, modify, and distribute this application.

---

**Last Updated**: May 2026
**Version**: 1.0.0
