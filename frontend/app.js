// ========== API CONFIGURATION ==========
const API_BASE = getApiBase();

function getApiBase() {
    if (window.location.protocol === 'file:') {
        return 'http://localhost:6001/api';
    }
    return `${window.location.origin}/api`;
}

// ========== STATE MANAGEMENT ==========
let currentUser = null;
let currentPatientId = null;
let authToken = null;
let selectedMedicationId = null;
let medicationCache = [];
let questionsCache = [];
let observationsCache = [];
let intakesCache = [];
let shiftsCache = [];
let patientsCache = [];

let editingQuestionId = null;
let editingObservationId = null;
let editingIntakeId = null;
let editingShiftId = null;

const AUTO_LOGIN_EMAILS = [
    'menna.dad@example.com',
    'manar.dad@example.com',
    'mariam.dad@example.com',
    'hoda.dad@example.com',
    'mahmoud.dad@example.com'
];

const DEFAULT_PATIENT_NAME = 'Mohamed Hefny';
const OFFLINE_QUEUE_KEY = 'pendingActions';

let isSyncingPending = false;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        verifyToken();
    }

    loadSavedCredentials();
    autoLoginIfEligible();
    initializeMobileChrome();
    initializeOfflineMode();
    initializeDictation();
    initializeTimeSelects();
    initializeSchedulePickers();

    setupEventListeners();
});

// ========== EVENT LISTENERS SETUP ==========
function setupEventListeners() {
    // Login/Signup Tabs
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.addEventListener('click', switchLoginTab);
    });

    // Login Forms
    document.getElementById('signInForm').addEventListener('submit', handleSignIn);
    document.getElementById('signUpForm').addEventListener('submit', handleSignUp);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', switchTab);
    });

    // Patient Management
    document.getElementById('patientSelect').addEventListener('change', selectPatient);
    document.getElementById('addPatientBtn').addEventListener('click', openPatientModal);
    document.getElementById('patientForm').addEventListener('submit', savePatient);

    // Form Submissions
    document.getElementById('questionForm').addEventListener('submit', saveQuestion);
    document.getElementById('observationForm').addEventListener('submit', saveObservation);
    document.getElementById('medicationForm').addEventListener('submit', saveMedication);
    document.getElementById('intakeForm').addEventListener('submit', saveIntake);

    // Modal Close
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', handleModalCloseClick);
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', handleModalBackdropClick);
    });

    // Medication shortcuts
    const medicationsList = document.getElementById('medicationsList');
    if (medicationsList) {
        medicationsList.addEventListener('click', handleMedicationListClick);
    }
    document.getElementById('editMedicationBtn').addEventListener('click', openEditMedicationModal);
    document.getElementById('stopMedicationBtn').addEventListener('click', openStopMedicationModal);
    document.getElementById('replaceMedicationBtn').addEventListener('click', openReplaceMedicationModal);
    document.getElementById('checklistMedicationBtn').addEventListener('click', openChecklistMedicationModal);

    document.getElementById('medicationEditForm').addEventListener('submit', saveMedicationEdits);
    document.getElementById('medicationStopForm').addEventListener('submit', stopMedication);
    document.getElementById('medicationReplaceForm').addEventListener('submit', replaceMedication);
    document.getElementById('medicationChecklistForm').addEventListener('submit', addMedicationChecklistEntry);

    document.getElementById('shiftForm').addEventListener('submit', saveShift);
    document.getElementById('shiftEditForm').addEventListener('submit', saveShiftEdits);

    document.getElementById('questionEditForm').addEventListener('submit', saveQuestionEdits);
    document.getElementById('observationEditForm').addEventListener('submit', saveObservationEdits);
    document.getElementById('intakeEditForm').addEventListener('submit', saveIntakeEdits);

    document.getElementById('patientEditForm').addEventListener('submit', savePatientEdits);
    document.getElementById('editPatientBtn').addEventListener('click', openPatientEditModal);
    document.getElementById('deletePatientBtn').addEventListener('click', deleteSelectedPatient);

    const symptomsForm = document.getElementById('symptomsForm');
    if (symptomsForm) {
        symptomsForm.addEventListener('submit', saveSymptoms);
    }

    const remindersList = document.getElementById('medicationRemindersList');
    if (remindersList) {
        remindersList.addEventListener('click', handleReminderAction);
    }
    const dashboardRemindersList = document.getElementById('dashboardRemindersList');
    if (dashboardRemindersList) {
        dashboardRemindersList.addEventListener('click', handleReminderAction);
    }
    const nextMedicationPanel = document.getElementById('nextMedicationPanel');
    if (nextMedicationPanel) {
        nextMedicationPanel.addEventListener('click', handleReminderAction);
    }

    const syncNowBtn = document.getElementById('syncNowBtn');
    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', syncPendingActions);
    }

    const questionsList = document.getElementById('questionsList');
    if (questionsList) {
        questionsList.addEventListener('click', handleQuestionAction);
    }
    const observationsList = document.getElementById('observationsList');
    if (observationsList) {
        observationsList.addEventListener('click', handleObservationAction);
    }
    const intakesList = document.getElementById('intakesList');
    if (intakesList) {
        intakesList.addEventListener('click', handleIntakeAction);
    }
    const shiftsList = document.getElementById('shiftsList');
    if (shiftsList) {
        shiftsList.addEventListener('click', handleShiftAction);
    }

    document.getElementById('deleteMedicationBtn').addEventListener('click', deleteSelectedMedication);

    const mobileToggle = document.getElementById('mobileChromeToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileChrome);
    }
}

// ========== AUTHENTICATION ==========
async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Invalid email or password');
        }

        const data = await response.json();
        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        saveCredentials(email, password);

        showAppScreen();
        loadPatients();
    } catch (error) {
        showLoginError(error.message);
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const role = document.getElementById('signUpRole').value;
    const phone = document.getElementById('signUpPhone').value || null;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, phone })
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const data = await response.json();
        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        saveCredentials(email, password);

        showAppScreen();
        loadPatients();
    } catch (error) {
        showLoginError(error.message);
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showAppScreen();
            loadPatients();
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            showLoginScreen();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        showLoginScreen();
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    currentPatientId = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Reset forms
    document.getElementById('signInForm').reset();
    document.getElementById('signUpForm').reset();
    
    showLoginScreen();
}

function saveCredentials(email, password) {
    localStorage.setItem('savedEmail', email);
    localStorage.setItem('savedPassword', password);
}

function loadSavedCredentials() {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedEmail) {
        const signInEmail = document.getElementById('signInEmail');
        if (signInEmail) signInEmail.value = savedEmail;
        const signUpEmail = document.getElementById('signUpEmail');
        if (signUpEmail) signUpEmail.value = savedEmail;
    }
    if (savedPassword) {
        const signInPassword = document.getElementById('signInPassword');
        if (signInPassword) signInPassword.value = savedPassword;
    }
}

async function autoLoginIfEligible() {
    if (authToken) return;
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    if (!savedEmail || !savedPassword) return;
    if (!AUTO_LOGIN_EMAILS.includes(savedEmail)) return;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: savedEmail, password: savedPassword })
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));

        showAppScreen();
        loadPatients();
    } catch (error) {
        console.error('Auto-login failed:', error);
    }
}

function initializeMobileChrome() {
    const showChrome = localStorage.getItem('showMobileChrome') === 'true';
    if (showChrome) {
        document.body.classList.add('show-mobile-chrome');
    }
    updateMobileToggleState();
}

function toggleMobileChrome() {
    document.body.classList.toggle('show-mobile-chrome');
    const isShown = document.body.classList.contains('show-mobile-chrome');
    localStorage.setItem('showMobileChrome', String(isShown));
    updateMobileToggleState();
}

function updateMobileToggleState() {
    const toggle = document.getElementById('mobileChromeToggle');
    if (!toggle) return;
    const isShown = document.body.classList.contains('show-mobile-chrome');
    toggle.setAttribute('aria-expanded', String(isShown));
    toggle.textContent = isShown ? '✕ Close' : '☰ Menu';
}

// ========== UI STATE MANAGEMENT ==========
function showLoginScreen() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('appScreen').classList.remove('active');
}

function showAppScreen() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
    
    // Update user info
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserRole').textContent = currentUser.role.toUpperCase();
}

function switchLoginTab(e) {
    const tab = e.target.dataset.tab;
    
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
    
    e.target.classList.add('active');
    if (tab === 'signin') {
        document.getElementById('signInForm').classList.add('active');
    } else if (tab === 'signup') {
        document.getElementById('signUpForm').classList.add('active');
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// ========== TAB SWITCHING ==========
function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Load data for the tab
    if (currentPatientId) {
        if (tabName === 'questions') loadQuestions();
        if (tabName === 'observations') loadObservations();
        if (tabName === 'medications') loadMedications();
        if (tabName === 'intakes') loadIntakes();
        if (tabName === 'shifts') loadShifts();
        if (tabName === 'audit') loadAuditLog();
        if (tabName === 'dashboard') loadDashboard();
    }
}

// ========== PATIENT MANAGEMENT ==========
async function loadPatients() {
    try {
        const response = await fetch(`${API_BASE}/patients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const patients = await response.json();
        patientsCache = patients;
        const select = document.getElementById('patientSelect');
        
        select.innerHTML = '<option value="">-- Select a Patient --</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient._id;
            option.textContent = patient.name + (patient.age ? ` (${patient.age}y)` : '');
            select.appendChild(option);
        });

        if (!currentPatientId) {
            autoSelectDefaultPatient(patients, select);
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

function autoSelectDefaultPatient(patients, select) {
    if (!patients || patients.length === 0) return;
    const normalizedDefault = DEFAULT_PATIENT_NAME.trim().toLowerCase();
    const match = patients.find(patient => patient.name?.trim().toLowerCase() === normalizedDefault);
    if (!match) return;

    select.value = match._id;
    selectPatient({ target: select });
}

async function selectPatient(e) {
    currentPatientId = e.target.value;
    if (currentPatientId) {
        document.getElementById('patientNameBreadcrumb').textContent = e.target.selectedOptions[0].text;
        loadDashboard();
        loadQuestions();
        loadObservations();
        loadMedications();
        loadIntakes();
        loadShifts();
    } else {
        document.getElementById('patientNameBreadcrumb').textContent = 'Select Patient';
    }
}

function openPatientModal() {
    openModal('patientModal');
}

function closePatientModal() {
    closeModal('patientModal');
}

function handleModalCloseClick(e) {
    const modal = e.target.closest('.modal');
    if (modal) {
        closeModalByElement(modal);
    }
}

function handleModalBackdropClick(e) {
    if (e.target.classList.contains('modal')) {
        closeModalByElement(e.target);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        refreshDictationBindings();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        closeModalByElement(modal);
    }
}

function closeModalByElement(modal) {
    modal.classList.remove('open');
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

function openPatientEditModal() {
    if (!currentPatientId) return;
    const patient = patientsCache.find(item => item._id === currentPatientId);
    if (!patient) return;
    document.getElementById('editPatientName').value = patient.name || '';
    document.getElementById('editPatientAge').value = patient.age || '';
    document.getElementById('editPatientPhone').value = patient.phoneNumber || '';
    document.getElementById('editEmergencyContact').value = patient.emergencyContact || '';
    document.getElementById('editMedicalConditions').value = (patient.medicalConditions || []).join(', ');
    openModal('patientEditModal');
}

async function savePatient(e) {
    e.preventDefault();
    
    const patientData = {
        name: document.getElementById('patientName').value,
        age: parseInt(document.getElementById('patientAge').value) || null,
        phoneNumber: document.getElementById('patientPhone').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        medicalConditions: document.getElementById('medicalConditions').value
            .split(',')
            .map(c => c.trim())
            .filter(c => c),
        createdBy: currentUser.id
    };

    try {
        await sendRequest({
            url: `${API_BASE}/patients`,
            method: 'POST',
            body: patientData,
            onSuccess: () => {
                closePatientModal();
                loadPatients();
            }
        });
    } catch (error) {
        alert('Error saving patient: ' + error.message);
    }
}

async function savePatientEdits(e) {
    e.preventDefault();
    if (!currentPatientId) return;

    const updateData = {
        name: document.getElementById('editPatientName').value,
        age: parseInt(document.getElementById('editPatientAge').value) || null,
        phoneNumber: document.getElementById('editPatientPhone').value,
        emergencyContact: document.getElementById('editEmergencyContact').value,
        medicalConditions: document.getElementById('editMedicalConditions').value
            .split(',')
            .map(c => c.trim())
            .filter(c => c)
    };

    try {
        await sendRequest({
            url: `${API_BASE}/patients/${currentPatientId}`,
            method: 'PUT',
            body: updateData,
            onSuccess: () => {
                closeModal('patientEditModal');
                loadPatients();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error updating patient: ' + error.message);
    }
}

async function deleteSelectedPatient() {
    if (!currentPatientId) return;
    if (!confirm('Delete this patient and all related records?')) return;

    try {
        await sendRequest({
            url: `${API_BASE}/patients/${currentPatientId}`,
            method: 'DELETE',
            body: {},
            onSuccess: () => {
                currentPatientId = null;
                loadPatients();
                document.getElementById('patientNameBreadcrumb').textContent = 'Select Patient';
            }
        });
    } catch (error) {
        alert('Error deleting patient: ' + error.message);
    }
}

// ========== DASHBOARD ==========
async function loadDashboard() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/patients/${currentPatientId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const patient = await response.json();

        const patientInfoDiv = document.getElementById('patientInfo');
        patientInfoDiv.innerHTML = `
            <div class="patient-detail-item">
                <span class="patient-detail-label">Name:</span>
                <span class="patient-detail-value">${patient.name}</span>
            </div>
            <div class="patient-detail-item">
                <span class="patient-detail-label">Age:</span>
                <span class="patient-detail-value">${patient.age || 'N/A'} years</span>
            </div>
            <div class="patient-detail-item">
                <span class="patient-detail-label">Phone:</span>
                <span class="patient-detail-value">${patient.phoneNumber || 'N/A'}</span>
            </div>
            <div class="patient-detail-item">
                <span class="patient-detail-label">Emergency Contact:</span>
                <span class="patient-detail-value">${patient.emergencyContact || 'N/A'}</span>
            </div>
            <div class="patient-detail-item">
                <span class="patient-detail-label">Conditions:</span>
                <span class="patient-detail-value">${patient.medicalConditions.join(', ') || 'None'}</span>
            </div>
        `;

        // Load recent activity
        const auditResponse = await fetch(`${API_BASE}/audit/patient/${currentPatientId}?limit=5`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const auditData = await auditResponse.json();

        const activityDiv = document.getElementById('recentActivity');
        if (auditData.logs.length > 0) {
            activityDiv.innerHTML = auditData.logs.map(log => `
                <div class="activity-item">
                    <strong>${log.dataType}</strong> was ${log.action}ed by ${log.userName}
                    <br><small>${new Date(log.timestamp).toLocaleString()}</small>
                </div>
            `).join('');
        } else {
            activityDiv.innerHTML = '<p>No recent activity</p>';
        }

        loadDailySummary();
        loadDashboardReminders();
        loadDashboardShifts();
        loadNextMedication();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadDashboardReminders() {
    if (!currentPatientId) return;
    try {
        const meds = await fetchJsonWithCache(`summary-medications-${currentPatientId}`, `${API_BASE}/medications?patientId=${currentPatientId}`);
        renderMedicationReminders(meds, 'dashboardRemindersList');
    } catch (error) {
        console.error('Error loading reminders:', error);
    }
}

async function loadNextMedication() {
    if (!currentPatientId) return;
    const container = document.getElementById('nextMedicationPanel');
    if (!container) return;

    try {
        const meds = await fetchJsonWithCache(`summary-medications-${currentPatientId}`, `${API_BASE}/medications?patientId=${currentPatientId}`);
        renderNextMedication(meds);
    } catch (error) {
        container.innerHTML = '<div class="empty-state compact"><p>Unable to load next medication.</p></div>';
    }
}

async function loadDashboardShifts() {
    if (!currentPatientId) return;
    const container = document.getElementById('dashboardShiftsList');
    if (!container) return;
    try {
        const shifts = await fetchJsonWithCache(`summary-shifts-${currentPatientId}`, `${API_BASE}/shifts?patientId=${currentPatientId}`);
        const today = new Date();
        const todaysShifts = (shifts || []).filter(shift => shift.shiftStart && isSameDay(new Date(shift.shiftStart), today));
        if (todaysShifts.length === 0) {
            container.innerHTML = '<div class="empty-state compact"><p>No shifts today.</p></div>';
            return;
        }
        container.innerHTML = todaysShifts.map(shift => `
            <div class="history-item">
                <div class="history-title">${shift.staffName} (${shift.role})</div>
                <div class="history-meta">
                    <span>${formatDate(shift.shiftStart)}</span>
                    <span>${formatDate(shift.shiftEnd)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="empty-state compact"><p>Unable to load shifts.</p></div>';
    }
}

async function saveSymptoms(e) {
    e.preventDefault();
    if (!currentPatientId) return;

    const symptomsNotes = document.getElementById('symptomsNotes').value.trim();
    if (!symptomsNotes) return;

    const observationData = {
        patientId: currentPatientId,
        timestamp: getDateValueOrNow(document.getElementById('symptomsDate').value),
        vitals: {},
        notes: `Symptoms: ${symptomsNotes}`,
        createdBy: currentUser.id
    };

    try {
        await sendRequest({
            url: `${API_BASE}/observations`,
            method: 'POST',
            body: observationData,
            onSuccess: () => {
                document.getElementById('symptomsForm').reset();
                loadObservations();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error saving symptoms: ' + error.message);
    }
}

async function loadDailySummary() {
    if (!currentPatientId) return;
    const summaryDiv = document.getElementById('dailySummary');
    if (!summaryDiv) return;

    try {
        const [questions, observations, intakes, medications] = await Promise.all([
            fetchJsonWithCache(`summary-questions-${currentPatientId}`, `${API_BASE}/questions?patientId=${currentPatientId}`),
            fetchJsonWithCache(`summary-observations-${currentPatientId}`, `${API_BASE}/observations?patientId=${currentPatientId}`),
            fetchJsonWithCache(`summary-intakes-${currentPatientId}`, `${API_BASE}/intakes?patientId=${currentPatientId}`),
            fetchJsonWithCache(`summary-medications-${currentPatientId}`, `${API_BASE}/medications?patientId=${currentPatientId}`)
        ]);

        const today = new Date();
        const isToday = value => isSameDay(new Date(value), today);

        const questionsToday = (questions || []).filter(q => q.createdAt && isToday(q.createdAt));
        const observationsToday = (observations || []).filter(o => (o.timestamp || o.createdAt) && isToday(o.timestamp || o.createdAt));
        const intakesToday = (intakes || []).filter(i => i.date && isToday(i.date));

        const checklistEntries = (medications || []).flatMap(med => med.checklist || []);
        const checklistToday = checklistEntries.filter(entry => entry.date && isToday(entry.date));
        const takenCount = checklistToday.filter(entry => entry.taken).length;
        const missedCount = checklistToday.filter(entry => entry.taken === false).length;

        summaryDiv.innerHTML = `
            <div class="summary-row">
                <span>Questions added</span>
                <strong>${questionsToday.length}</strong>
            </div>
            <div class="summary-row">
                <span>Observations recorded</span>
                <strong>${observationsToday.length}</strong>
            </div>
            <div class="summary-row">
                <span>Intake records</span>
                <strong>${intakesToday.length}</strong>
            </div>
            <div class="summary-row">
                <span>Medication doses</span>
                <strong>${takenCount} taken / ${missedCount} missed</strong>
            </div>
        `;
    } catch (error) {
        summaryDiv.innerHTML = '<p>Unable to load today summary.</p>';
    }
}

// ========== QUESTIONS ==========
async function saveQuestion(e) {
    e.preventDefault();

    const questionData = {
        patientId: currentPatientId,
        question: document.getElementById('questionText').value,
        category: document.getElementById('questionCategory').value,
        priority: document.getElementById('questionPriority').value,
        status: 'pending',
        askedDate: getDateTimeFromInputs('questionDate', 'questionTime'),
        createdBy: currentUser.id
    };

    try {
        await sendRequest({
            url: `${API_BASE}/questions`,
            method: 'POST',
            body: questionData,
            onSuccess: () => {
                document.getElementById('questionForm').reset();
                loadQuestions();
            }
        });
    } catch (error) {
        alert('Error saving question: ' + error.message);
    }
}

async function loadQuestions() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/questions?patientId=${currentPatientId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const questions = await response.json();
        questionsCache = questions;

        const container = document.getElementById('questionsList');
        if (questions.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❓</div><p>No questions yet</p></div>';
            return;
        }

        container.innerHTML = questions.map(q => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${q.question}</div>
                    <span class="list-item-badge badge-${q.priority}">${q.priority.toUpperCase()}</span>
                </div>
                <div class="list-item-meta">
                    <span>Category: ${q.category || 'General'}</span>
                    <span>Status: ${q.status}</span>
                </div>
                ${q.answer ? `<div class="list-item-body"><strong>Answer:</strong> ${q.answer}</div>` : ''}
                <div class="list-item-footer">
                    <div class="item-meta-lines">
                        <span>Created by ${formatUserName(q.createdBy)} · ${formatDate(q.createdAt)}</span>
                        <span>Updated by ${formatUserName(q.updatedBy || q.createdBy)} · ${formatDate(q.updatedAt || q.createdAt)}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-tertiary" data-action="edit-question" data-id="${q._id}">Edit</button>
                        <button class="btn-tertiary" data-action="delete-question" data-id="${q._id}">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function handleQuestionAction(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.action === 'edit-question') {
        openQuestionEditModal(id);
    }
    if (action.dataset.action === 'delete-question') {
        deleteQuestion(id);
    }
}

function openQuestionEditModal(questionId) {
    const question = questionsCache.find(item => item._id === questionId);
    if (!question) return;
    editingQuestionId = questionId;
    setDateTimeInputs('editQuestionDate', 'editQuestionTime', question.askedDate || question.createdAt);
    document.getElementById('editQuestionText').value = question.question || '';
    document.getElementById('editQuestionCategory').value = question.category || '';
    document.getElementById('editQuestionPriority').value = question.priority || 'medium';
    document.getElementById('editQuestionStatus').value = question.status || 'pending';
    document.getElementById('editQuestionAnswer').value = question.answer || '';
    openModal('questionEditModal');
}

async function saveQuestionEdits(e) {
    e.preventDefault();
    if (!editingQuestionId) return;

    const updateData = {
        askedDate: getDateTimeFromInputs('editQuestionDate', 'editQuestionTime'),
        question: document.getElementById('editQuestionText').value,
        category: document.getElementById('editQuestionCategory').value,
        priority: document.getElementById('editQuestionPriority').value,
        status: document.getElementById('editQuestionStatus').value,
        answer: document.getElementById('editQuestionAnswer').value
    };

    try {
        await sendRequest({
            url: `${API_BASE}/questions/${editingQuestionId}`,
            method: 'PUT',
            body: updateData,
            onSuccess: () => {
                closeModal('questionEditModal');
                loadQuestions();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error updating question: ' + error.message);
    }
}

async function deleteQuestion(questionId) {
    if (!confirm('Delete this question?')) return;
    try {
        await sendRequest({
            url: `${API_BASE}/questions/${questionId}`,
            method: 'DELETE',
            body: {},
            onSuccess: () => {
                loadQuestions();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error deleting question: ' + error.message);
    }
}

// ========== OBSERVATIONS ==========
async function saveObservation(e) {
    e.preventDefault();

    const observationData = {
        patientId: currentPatientId,
        timestamp: getDateTimeFromInputs('observationDate', 'observationTime'),
        vitals: {
            bloodSugar: document.getElementById('bloodSugar').value ? { value: parseFloat(document.getElementById('bloodSugar').value) } : null,
            bloodPressure: (document.getElementById('bpSystolic').value || document.getElementById('bpDiastolic').value) ? {
                systolic: parseInt(document.getElementById('bpSystolic').value) || null,
                diastolic: parseInt(document.getElementById('bpDiastolic').value) || null
            } : null,
            oxygenLevel: document.getElementById('oxygen').value ? { value: parseFloat(document.getElementById('oxygen').value) } : null,
            heartRate: document.getElementById('heartRate').value ? { value: parseInt(document.getElementById('heartRate').value) } : null,
            temperature: document.getElementById('temperature').value ? { value: parseFloat(document.getElementById('temperature').value) } : null
        },
        notes: document.getElementById('observationNotes').value,
        createdBy: currentUser.id
    };

    try {
        await sendRequest({
            url: `${API_BASE}/observations`,
            method: 'POST',
            body: observationData,
            onSuccess: () => {
                document.getElementById('observationForm').reset();
                loadObservations();
            }
        });
    } catch (error) {
        alert('Error saving observation: ' + error.message);
    }
}

async function loadObservations() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/observations?patientId=${currentPatientId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const observations = await response.json();
        observationsCache = observations;

        const container = document.getElementById('observationsList');
        if (observations.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📈</div><p>No observations yet</p></div>';
            return;
        }

        container.innerHTML = observations.map(obs => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">Vital Signs Recorded</div>
                </div>
                <div class="list-item-body">
                    ${obs.vitals.bloodSugar?.value ? `<p>🩸 Blood Sugar: ${obs.vitals.bloodSugar.value} ${obs.vitals.bloodSugar.unit}</p>` : ''}
                    ${obs.vitals.bloodPressure?.systolic ? `<p>💓 BP: ${obs.vitals.bloodPressure.systolic}/${obs.vitals.bloodPressure.diastolic} mmHg</p>` : ''}
                    ${obs.vitals.oxygenLevel?.value ? `<p>🫁 O₂: ${obs.vitals.oxygenLevel.value}%</p>` : ''}
                    ${obs.vitals.heartRate?.value ? `<p>💗 Heart Rate: ${obs.vitals.heartRate.value} bpm</p>` : ''}
                    ${obs.vitals.temperature?.value ? `<p>🌡️ Temperature: ${obs.vitals.temperature.value}°C</p>` : ''}
                    ${obs.notes ? `<p><strong>Notes:</strong> ${obs.notes}</p>` : ''}
                </div>
                <div class="list-item-footer">
                    <div class="item-meta-lines">
                        <span>Created by ${formatUserName(obs.createdBy)} · ${formatDate(obs.createdAt || obs.timestamp)}</span>
                        <span>Updated by ${formatUserName(obs.updatedBy || obs.createdBy)} · ${formatDate(obs.updatedAt || obs.createdAt || obs.timestamp)}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-tertiary" data-action="edit-observation" data-id="${obs._id}">Edit</button>
                        <button class="btn-tertiary" data-action="delete-observation" data-id="${obs._id}">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading observations:', error);
    }
}

function handleObservationAction(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.action === 'edit-observation') {
        openObservationEditModal(id);
    }
    if (action.dataset.action === 'delete-observation') {
        deleteObservation(id);
    }
}

function openObservationEditModal(observationId) {
    const observation = observationsCache.find(item => item._id === observationId);
    if (!observation) return;
    editingObservationId = observationId;
    setDateTimeInputs('editObservationDate', 'editObservationTime', observation.timestamp || observation.createdAt);
    document.getElementById('editBloodSugar').value = observation.vitals?.bloodSugar?.value || '';
    document.getElementById('editBpSystolic').value = observation.vitals?.bloodPressure?.systolic || '';
    document.getElementById('editBpDiastolic').value = observation.vitals?.bloodPressure?.diastolic || '';
    document.getElementById('editOxygen').value = observation.vitals?.oxygenLevel?.value || '';
    document.getElementById('editHeartRate').value = observation.vitals?.heartRate?.value || '';
    document.getElementById('editTemperature').value = observation.vitals?.temperature?.value || '';
    document.getElementById('editObservationNotes').value = observation.notes || '';
    openModal('observationEditModal');
}

async function saveObservationEdits(e) {
    e.preventDefault();
    if (!editingObservationId) return;

    const updateData = {
        timestamp: getDateTimeFromInputs('editObservationDate', 'editObservationTime'),
        vitals: {
            bloodSugar: document.getElementById('editBloodSugar').value ? { value: parseFloat(document.getElementById('editBloodSugar').value) } : null,
            bloodPressure: (document.getElementById('editBpSystolic').value || document.getElementById('editBpDiastolic').value) ? {
                systolic: parseInt(document.getElementById('editBpSystolic').value) || null,
                diastolic: parseInt(document.getElementById('editBpDiastolic').value) || null
            } : null,
            oxygenLevel: document.getElementById('editOxygen').value ? { value: parseFloat(document.getElementById('editOxygen').value) } : null,
            heartRate: document.getElementById('editHeartRate').value ? { value: parseInt(document.getElementById('editHeartRate').value) } : null,
            temperature: document.getElementById('editTemperature').value ? { value: parseFloat(document.getElementById('editTemperature').value) } : null
        },
        notes: document.getElementById('editObservationNotes').value
    };

    try {
        await sendRequest({
            url: `${API_BASE}/observations/${editingObservationId}`,
            method: 'PUT',
            body: updateData,
            onSuccess: () => {
                closeModal('observationEditModal');
                loadObservations();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error updating observation: ' + error.message);
    }
}

async function deleteObservation(observationId) {
    if (!confirm('Delete this observation?')) return;
    try {
        await sendRequest({
            url: `${API_BASE}/observations/${observationId}`,
            method: 'DELETE',
            body: {},
            onSuccess: () => {
                loadObservations();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error deleting observation: ' + error.message);
    }
}

// ========== MEDICATIONS ==========
async function saveMedication(e) {
    e.preventDefault();

    const medicationData = {
        patientId: currentPatientId,
        name: document.getElementById('medName').value,
        type: document.getElementById('medType').value,
        dosage: {
            amount: parseFloat(document.getElementById('medAmount').value),
            unit: document.getElementById('medUnit').value
        },
        frequency: document.getElementById('medFrequency').value,
        purpose: document.getElementById('medPurpose').value,
        schedule: getScheduleFromPicker('medSchedule'),
        startDate: getDateTimeFromInputs('medStartDate', 'medStartTime'),
        createdBy: currentUser.id
    };

    try {
        await sendRequest({
            url: `${API_BASE}/medications`,
            method: 'POST',
            body: medicationData,
            onSuccess: () => {
                document.getElementById('medicationForm').reset();
                resetSchedulePicker('medSchedule');
                loadMedications();
            }
        });
    } catch (error) {
        alert('Error saving medication: ' + error.message);
    }
}

async function loadMedications() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/medications?patientId=${currentPatientId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const medications = await response.json();
        medicationCache = medications;
        const sortedMedications = [...medications].sort((first, second) => {
            const firstNext = getNextDoseDateForMedication(first);
            const secondNext = getNextDoseDateForMedication(second);
            if (!firstNext && !secondNext) return 0;
            if (!firstNext) return 1;
            if (!secondNext) return -1;
            return firstNext - secondNext;
        });

        const container = document.getElementById('medicationsList');
        if (sortedMedications.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💊</div><p>No medications recorded</p></div>';
            selectedMedicationId = null;
            updateMedicationActionState();
            clearMedicationHistory();
            return;
        }

        container.innerHTML = `
            <div class="medication-table">
                <div class="medication-header">
                    <span>Name</span>
                    <span>Status</span>
                    <span>Type</span>
                    <span>Dosage</span>
                    <span>Frequency</span>
                    <span>Schedule</span>
                    <span>Updated</span>
                    <span></span>
                </div>
                ${sortedMedications.map(med => `
                    <div class="medication-row medication-item ${selectedMedicationId === med._id ? 'selected' : ''}" data-med-id="${med._id}">
                        <span class="med-name" data-label="Name">${med.name}</span>
                        <span data-label="Status"><span class="status-pill status-${med.status}">${med.status}</span></span>
                        <span data-label="Type">${med.type.toUpperCase()}</span>
                        <span data-label="Dosage">${med.dosage?.amount || 'N/A'} ${med.dosage?.unit || ''}</span>
                        <span data-label="Frequency">${med.frequency || 'Not set'}</span>
                        <span data-label="Schedule">${formatScheduleTimes(med.schedule)}</span>
                        <span data-label="Updated">${formatDate(med.updatedAt || med.createdAt)}</span>
                        <span data-label="Action"><button class="btn-tertiary select-medication-btn" type="button">Select</button></span>
                        <div class="medication-meta">
                            <span>Created by ${formatUserName(med.createdBy)} · ${formatDate(med.createdAt)}</span>
                            <span>Updated by ${formatUserName(med.updatedBy || med.createdBy)} · ${formatDate(med.updatedAt || med.createdAt)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        if (!medications.some(med => med._id === selectedMedicationId)) {
            selectedMedicationId = null;
        }
        updateMedicationActionState();
        if (selectedMedicationId) {
            loadMedicationHistory(selectedMedicationId);
        } else {
            clearMedicationHistory();
        }

        renderMedicationReminders(medications);
    } catch (error) {
        console.error('Error loading medications:', error);
    }
}

function handleMedicationListClick(e) {
    const item = e.target.closest('.medication-item');
    if (!item) return;
    const medId = item.dataset.medId;
    if (medId) {
        setSelectedMedication(medId);
    }
}

function setSelectedMedication(medId) {
    selectedMedicationId = medId;
    document.querySelectorAll('.medication-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.medId === medId);
    });
    updateMedicationActionState();
    loadMedicationHistory(medId);
}

function getSelectedMedication() {
    return medicationCache.find(med => med._id === selectedMedicationId) || null;
}

function updateMedicationActionState() {
    const label = document.getElementById('selectedMedicationLabel');
    const editBtn = document.getElementById('editMedicationBtn');
    const stopBtn = document.getElementById('stopMedicationBtn');
    const replaceBtn = document.getElementById('replaceMedicationBtn');
    const checklistBtn = document.getElementById('checklistMedicationBtn');
    const deleteBtn = document.getElementById('deleteMedicationBtn');

    const selected = getSelectedMedication();
    const hasSelection = Boolean(selected);

    [editBtn, stopBtn, replaceBtn, checklistBtn, deleteBtn].forEach(button => {
        button.disabled = !hasSelection;
    });

    if (label) {
        label.textContent = hasSelection
            ? `${selected.name} (${selected.status}) selected. Use the shortcuts to edit, stop, replace, or log a dose.`
            : 'Select a medication to edit, stop, replace, or log a dose.';
    }
}

async function deleteSelectedMedication() {
    const selected = getSelectedMedication();
    if (!selected) return;
    if (!confirm('Delete this medication?')) return;

    try {
        await sendRequest({
            url: `${API_BASE}/medications/${selected._id}`,
            method: 'DELETE',
            body: {},
            onSuccess: () => {
                selectedMedicationId = null;
                loadMedications();
            }
        });
    } catch (error) {
        alert('Error deleting medication: ' + error.message);
    }
}

async function loadMedicationHistory(medicationId) {
    try {
        const response = await fetch(`${API_BASE}/medications/${medicationId}/history`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            throw new Error('Failed to load medication history');
        }
        const data = await response.json();
        renderMedicationHistory(data.changeHistory || []);
        renderMedicationChecklist(data.checklist || []);
    } catch (error) {
        console.error('Error loading medication history:', error);
    }
}

function clearMedicationHistory() {
    renderMedicationHistory([]);
    renderMedicationChecklist([]);
}

function renderMedicationHistory(history) {
    const container = document.getElementById('medicationHistoryList');
    if (!container) return;
    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state compact"><p>No changes recorded yet.</p></div>';
        return;
    }
    container.innerHTML = history.map(entry => `
        <div class="history-item">
            <div class="history-title">${entry.action.toUpperCase()}</div>
            <div class="history-meta">
                <span>By: ${entry.changedByName || entry.changedBy?.name || 'Unknown'}</span>
                <span>${new Date(entry.date).toLocaleString()}</span>
            </div>
            ${entry.reason ? `<div class="history-note">${entry.reason}</div>` : ''}
        </div>
    `).join('');
}

function renderMedicationChecklist(checklist) {
    const container = document.getElementById('medicationChecklistList');
    if (!container) return;
    if (checklist.length === 0) {
        container.innerHTML = '<div class="empty-state compact"><p>No checklist entries yet.</p></div>';
        return;
    }
    container.innerHTML = checklist.map(entry => `
        <div class="history-item">
            <div class="history-title">${entry.taken ? 'Taken' : 'Missed'} dose</div>
            <div class="history-meta">
                <span>By: ${entry.takenBy || 'Unknown'}</span>
                <span>${new Date(entry.date || entry.recordedAt).toLocaleString()}</span>
            </div>
            ${entry.notes ? `<div class="history-note">${entry.notes}</div>` : ''}
        </div>
    `).join('');
}

function openEditMedicationModal() {
    const selected = getSelectedMedication();
    if (!selected) return;
    document.getElementById('editMedName').value = selected.name || '';
    document.getElementById('editMedType').value = selected.type || '';
    setDateTimeInputs('editMedStartDate', 'editMedStartTime', selected.startDate || selected.createdAt);
    document.getElementById('editMedAmount').value = selected.dosage?.amount || '';
    document.getElementById('editMedUnit').value = selected.dosage?.unit || '';
    document.getElementById('editMedFrequency').value = selected.frequency || '';
    document.getElementById('editMedPurpose').value = selected.purpose || '';
    setSchedulePickerValues('editMedSchedule', selected.schedule || []);
    document.getElementById('editMedStatus').value = selected.status || 'active';
    document.getElementById('editMedNotes').value = selected.notes || '';
    openModal('medicationEditModal');
}

function openStopMedicationModal() {
    if (!getSelectedMedication()) return;
    setDateTimeInputs('stopMedDate', 'stopMedTime', new Date());
    openModal('medicationStopModal');
}

function openReplaceMedicationModal() {
    const selected = getSelectedMedication();
    if (!selected) return;
    setSchedulePickerValues('replaceMedSchedule', selected.schedule || []);
    setDateTimeInputs('replaceMedDate', 'replaceMedTime', new Date());
    openModal('medicationReplaceModal');
}

function openChecklistMedicationModal() {
    if (!getSelectedMedication()) return;
    setDateTimeInputs('checklistMedDate', 'checklistMedTime', new Date());
    openModal('medicationChecklistModal');
}

async function saveMedicationEdits(e) {
    e.preventDefault();
    const selected = getSelectedMedication();
    if (!selected) return;

    const updateData = {
        name: document.getElementById('editMedName').value,
        type: document.getElementById('editMedType').value,
        startDate: getDateTimeFromInputs('editMedStartDate', 'editMedStartTime'),
        dosage: {
            amount: parseFloat(document.getElementById('editMedAmount').value),
            unit: document.getElementById('editMedUnit').value
        },
        frequency: document.getElementById('editMedFrequency').value,
        purpose: document.getElementById('editMedPurpose').value,
        schedule: getScheduleFromPicker('editMedSchedule'),
        status: document.getElementById('editMedStatus').value,
        notes: document.getElementById('editMedNotes').value,
        changeReason: document.getElementById('editMedReason').value
    };

    try {
        await sendRequest({
            url: `${API_BASE}/medications/${selected._id}`,
            method: 'PUT',
            body: updateData,
            onSuccess: () => {
                closeModal('medicationEditModal');
                loadMedications();
            }
        });
    } catch (error) {
        alert('Error updating medication: ' + error.message);
    }
}

async function stopMedication(e) {
    e.preventDefault();
    const selected = getSelectedMedication();
    if (!selected) return;

    const dateValue = document.getElementById('stopMedDate').value;
    const reason = document.getElementById('stopMedReason').value;

    try {
        await sendRequest({
            url: `${API_BASE}/medications/${selected._id}/stop`,
            method: 'POST',
            body: {
                endDate: getDateTimeFromInputs('stopMedDate', 'stopMedTime'),
                reason
            },
            onSuccess: () => {
                closeModal('medicationStopModal');
                loadMedications();
            }
        });
    } catch (error) {
        alert('Error stopping medication: ' + error.message);
    }
}

async function replaceMedication(e) {
    e.preventDefault();
    const selected = getSelectedMedication();
    if (!selected) return;

    const replacementDate = getDateTimeFromInputs('replaceMedDate', 'replaceMedTime');
    const newMedicationName = document.getElementById('replaceMedName').value;

    const newMedicationData = {
        name: newMedicationName,
        type: document.getElementById('replaceMedType').value,
        dosage: {
            amount: parseFloat(document.getElementById('replaceMedAmount').value),
            unit: document.getElementById('replaceMedUnit').value
        },
        frequency: document.getElementById('replaceMedFrequency').value,
        purpose: document.getElementById('replaceMedPurpose').value,
        schedule: getScheduleFromPicker('replaceMedSchedule'),
        notes: document.getElementById('replaceMedNotes').value
    };

    try {
        await sendRequest({
            url: `${API_BASE}/medications/${selected._id}/replace`,
            method: 'POST',
            body: {
                replacementDate,
                newMedicationName,
                newMedicationData,
                reason: document.getElementById('replaceMedReason').value
            },
            onSuccess: () => {
                closeModal('medicationReplaceModal');
                loadMedications();
            }
        });
    } catch (error) {
        alert('Error replacing medication: ' + error.message);
    }
}

async function addMedicationChecklistEntry(e) {
    e.preventDefault();
    const selected = getSelectedMedication();
    if (!selected) return;

    const dateValue = document.getElementById('checklistMedDate').value;
    const taken = document.getElementById('checklistMedTaken').checked;
    const notes = document.getElementById('checklistMedNotes').value;

    const date = getDateTimeFromInputs('checklistMedDate', 'checklistMedTime');
    const time = formatTimeFromDate(date);

    try {
        await submitChecklistEntry(selected._id, { date, time, taken, notes }, () => {
            closeModal('medicationChecklistModal');
            loadMedications();
        });
    } catch (error) {
        alert('Error adding checklist entry: ' + error.message);
    }
}

function renderMedicationReminders(medications, containerId = 'medicationRemindersList') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const today = new Date();
    const reminders = [];

    (medications || []).forEach(med => {
        if (med.status !== 'active') return;
        const schedule = Array.isArray(med.schedule) ? med.schedule : [];
        schedule.forEach(time => {
            const entry = (med.checklist || []).find(check => {
                return check.date && isSameDay(new Date(check.date), today) && check.time === time;
            });
            reminders.push({
                id: med._id,
                name: med.name,
                time,
                status: entry ? (entry.taken ? 'taken' : 'missed') : 'pending'
            });
        });
    });

    if (reminders.length === 0) {
        container.innerHTML = '<div class="empty-state compact"><p>No reminders set for today.</p></div>';
        return;
    }

    reminders.sort((a, b) => a.time.localeCompare(b.time));
    container.innerHTML = reminders.map(reminder => `
        <div class="list-item reminder-item">
            <div class="list-item-header">
                <div>
                    <div class="list-item-title">${reminder.name}</div>
                    <div class="list-item-meta">
                        <span>Date: ${formatDateOnly(new Date())}</span>
                        <span>Time: ${formatTimeFromString(reminder.time)}</span>
                        <span class="status-pill status-${reminder.status}">${reminder.status === 'pending' ? 'not yet' : reminder.status}</span>
                    </div>
                </div>
                <div class="reminder-actions">
                    <button class="btn-tertiary reminder-action" data-med-id="${reminder.id}" data-time="${reminder.time}" data-date="${buildDateFromTime(reminder.time).toISOString()}" data-taken="true" ${reminder.status !== 'pending' ? 'disabled' : ''}>Taken</button>
                    <button class="btn-tertiary reminder-action" data-med-id="${reminder.id}" data-time="${reminder.time}" data-date="${buildDateFromTime(reminder.time).toISOString()}" data-taken="false" ${reminder.status !== 'pending' ? 'disabled' : ''}>Missed</button>
                </div>
            </div>
        </div>
    `).join('');
}

function handleReminderAction(e) {
    const button = e.target.closest('.reminder-action');
    if (!button) return;
    const medId = button.dataset.medId;
    const time = button.dataset.time;
    const taken = button.dataset.taken === 'true';
    const date = button.dataset.date ? new Date(button.dataset.date) : buildDateFromTime(time);

    submitChecklistEntry(medId, { date, time, taken, notes: '' }, () => {
        loadMedications();
        loadDashboard();
    });
}

function renderNextMedication(medications) {
    const container = document.getElementById('nextMedicationPanel');
    if (!container) return;

    const nextDose = findNextMedicationDose(medications || []);
    if (!nextDose) {
        container.innerHTML = '<div class="empty-state compact"><p>No upcoming medication scheduled.</p></div>';
        return;
    }

    const statusLabel = nextDose.status === 'pending' ? 'not yet' : nextDose.status;
    container.innerHTML = `
        <div class="list-item reminder-item">
            <div class="list-item-header">
                <div>
                    <div class="list-item-title">${nextDose.name}</div>
                    <div class="list-item-meta">
                        <span>Date: ${formatDateOnly(nextDose.date)}</span>
                        <span>Time: ${formatTimeFromString(nextDose.time)}</span>
                        <span class="status-pill status-${nextDose.status}">${statusLabel}</span>
                    </div>
                </div>
                <div class="reminder-actions">
                    <button class="btn-tertiary reminder-action" data-med-id="${nextDose.id}" data-time="${nextDose.time}" data-date="${nextDose.date.toISOString()}" data-taken="true" ${nextDose.status !== 'pending' ? 'disabled' : ''}>Taken</button>
                    <button class="btn-tertiary reminder-action" data-med-id="${nextDose.id}" data-time="${nextDose.time}" data-date="${nextDose.date.toISOString()}" data-taken="false" ${nextDose.status !== 'pending' ? 'disabled' : ''}>Missed</button>
                </div>
            </div>
        </div>
    `;
}

function findNextMedicationDose(medications) {
    const now = new Date();
    const candidates = [];

    medications.forEach(med => {
        if (med.status !== 'active') return;
        const schedule = Array.isArray(med.schedule) ? med.schedule : [];
        schedule.forEach(time => {
            const doseDate = buildDateFromTime(time);
            let nextDate = doseDate;
            if (doseDate < now) {
                nextDate = new Date(doseDate);
                nextDate.setDate(nextDate.getDate() + 1);
            }

            const entry = (med.checklist || []).find(check => {
                return check.date && isSameDay(new Date(check.date), nextDate) && check.time === time;
            });

            candidates.push({
                id: med._id,
                name: med.name,
                time,
                date: nextDate,
                status: entry ? (entry.taken ? 'taken' : 'missed') : 'pending'
            });
        });
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.date - b.date);
    return candidates[0];
}

function buildDateFromTime(time) {
    const [hours, minutes] = (time || '').split(':');
    const date = new Date();
    if (!Number.isNaN(parseInt(hours, 10))) {
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes || '0', 10));
        date.setSeconds(0, 0);
    }
    return date;
}

async function submitChecklistEntry(medId, payload, onSuccess) {
    await sendRequest({
        url: `${API_BASE}/medications/${medId}/checklist`,
        method: 'POST',
        body: payload,
        onSuccess
    });
}

// ========== INTAKES ==========
async function saveIntake(e) {
    e.preventDefault();

    const intakeData = {
        patientId: currentPatientId,
        date: getDateTimeFromInputs('intakeDate', 'intakeTime'),
        water: {
            amount: parseInt(document.getElementById('waterAmount').value) || null
        },
        food: {
            description: document.getElementById('foodDesc').value
        },
        urineOutput: {
            amount: { value: parseInt(document.getElementById('urineOutput').value) || null },
            color: document.getElementById('urineColor').value
        },
        notes: document.getElementById('intakeNotes').value,
        createdBy: currentUser.id
    };

    try {
        await sendRequest({
            url: `${API_BASE}/intakes`,
            method: 'POST',
            body: intakeData,
            onSuccess: () => {
                document.getElementById('intakeForm').reset();
                loadIntakes();
            }
        });
    } catch (error) {
        alert('Error saving intake: ' + error.message);
    }
}

function parseScheduleInput(value) {
    if (!value) return [];
    return value
        .split(',')
        .map(item => item.trim())
        .filter(item => /^\d{1,2}:\d{2}$/.test(item))
        .map(item => item.padStart(5, '0'));
}

function isSameDay(first, second) {
    return first.getFullYear() === second.getFullYear()
        && first.getMonth() === second.getMonth()
        && first.getDate() === second.getDate();
}

async function sendRequest({ url, method, body, onSuccess }) {
    if (!navigator.onLine) {
        enqueueAction({ url, method, body });
        if (onSuccess) {
            onSuccess(null);
        }
        return;
    }

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error('Request failed');
    }

    const data = await response.json().catch(() => null);
    if (onSuccess) {
        onSuccess(data);
    }
    return data;
}

function initializeOfflineMode() {
    window.addEventListener('online', syncPendingActions);
    window.addEventListener('offline', updateOfflineBanner);
    updateOfflineBanner();
}

function getPendingActions() {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function enqueueAction(action) {
    const queue = getPendingActions();
    queue.push({ ...action, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    updateOfflineBanner();
}

async function syncPendingActions() {
    if (isSyncingPending) return;
    if (!navigator.onLine) {
        updateOfflineBanner();
        return;
    }

    isSyncingPending = true;
    const queue = getPendingActions();
    const remaining = [];

    for (const action of queue) {
        try {
            const response = await fetch(action.url, {
                method: action.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(action.body)
            });

            if (!response.ok) {
                remaining.push(action);
            }
        } catch {
            remaining.push(action);
        }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    isSyncingPending = false;
    updateOfflineBanner();

    if (remaining.length === 0) {
        loadDashboard();
        loadQuestions();
        loadObservations();
        loadMedications();
        loadIntakes();
    }
}

function updateOfflineBanner() {
    const banner = document.getElementById('offlineBanner');
    const text = document.getElementById('offlineBannerText');
    if (!banner || !text) return;
    const pendingCount = getPendingActions().length;
    const isOffline = !navigator.onLine;

    if (isOffline || pendingCount > 0) {
        banner.classList.add('show');
        if (isOffline) {
            text.textContent = 'You are offline. Changes will sync when online.';
        } else {
            text.textContent = `Syncing ${pendingCount} pending update${pendingCount === 1 ? '' : 's'} when online.`;
        }
    } else {
        banner.classList.remove('show');
    }
}

// (removed duplicate helper definitions)

function initializeDictation() {
    document.querySelectorAll('.dictation-btn').forEach(button => {
        button.addEventListener('click', () => startDictation(button.dataset.target));
    });
}

// Rebind dictation buttons added after initial load
function refreshDictationBindings() {
    document.querySelectorAll('.dictation-btn').forEach(button => {
        if (button.dataset.bound === 'true') return;
        button.dataset.bound = 'true';
        button.addEventListener('click', () => startDictation(button.dataset.target));
    });
}

function startDictation(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Dictation is not supported on this device.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        target.value = target.value ? `${target.value} ${transcript}` : transcript;
    };

    recognition.onerror = () => {
        alert('Dictation failed. Please try again.');
    };

    recognition.start();
}

async function fetchJsonWithCache(cacheKey, url) {
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Request failed');
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    } catch (error) {
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : [];
    }
}

async function loadIntakes() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/intakes?patientId=${currentPatientId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const intakes = await response.json();
        intakesCache = intakes;

        const container = document.getElementById('intakesList');
        if (intakes.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🥗</div><p>No intake records yet</p></div>';
            return;
        }

        container.innerHTML = intakes.map(intake => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">Intake & Output Record</div>
                </div>
                <div class="list-item-body">
                    ${intake.water?.amount ? `<p>💧 Water: ${intake.water.amount} mL</p>` : ''}
                    ${intake.food?.description ? `<p>🍽️ Food: ${intake.food.description}</p>` : ''}
                    ${intake.urineOutput?.amount?.value ? `<p>💛 Urine: ${intake.urineOutput.amount.value} mL${intake.urineOutput.color ? ` (${intake.urineOutput.color})` : ''}</p>` : ''}
                    ${intake.notes ? `<p><strong>Notes:</strong> ${intake.notes}</p>` : ''}
                </div>
                <div class="list-item-footer">
                    <div class="item-meta-lines">
                        <span>Created by ${formatUserName(intake.createdBy)} · ${formatDate(intake.createdAt || intake.date)}</span>
                        <span>Updated by ${formatUserName(intake.updatedBy || intake.createdBy)} · ${formatDate(intake.updatedAt || intake.createdAt || intake.date)}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-tertiary" data-action="edit-intake" data-id="${intake._id}">Edit</button>
                        <button class="btn-tertiary" data-action="delete-intake" data-id="${intake._id}">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading intakes:', error);
    }
}

function handleIntakeAction(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.action === 'edit-intake') {
        openIntakeEditModal(id);
    }
    if (action.dataset.action === 'delete-intake') {
        deleteIntake(id);
    }
}

function openIntakeEditModal(intakeId) {
    const intake = intakesCache.find(item => item._id === intakeId);
    if (!intake) return;
    editingIntakeId = intakeId;
    setDateTimeInputs('editIntakeDate', 'editIntakeTime', intake.date);
    document.getElementById('editWaterAmount').value = intake.water?.amount || '';
    document.getElementById('editFoodDesc').value = intake.food?.description || '';
    document.getElementById('editUrineOutput').value = intake.urineOutput?.amount?.value || '';
    document.getElementById('editUrineColor').value = intake.urineOutput?.color || '';
    document.getElementById('editIntakeNotes').value = intake.notes || '';
    openModal('intakeEditModal');
}

async function saveIntakeEdits(e) {
    e.preventDefault();
    if (!editingIntakeId) return;

    const updateData = {
        date: getDateTimeFromInputs('editIntakeDate', 'editIntakeTime'),
        water: {
            amount: parseInt(document.getElementById('editWaterAmount').value) || null
        },
        food: {
            description: document.getElementById('editFoodDesc').value
        },
        urineOutput: {
            amount: { value: parseInt(document.getElementById('editUrineOutput').value) || null },
            color: document.getElementById('editUrineColor').value
        },
        notes: document.getElementById('editIntakeNotes').value
    };

    try {
        await sendRequest({
            url: `${API_BASE}/intakes/${editingIntakeId}`,
            method: 'PUT',
            body: updateData,
            onSuccess: () => {
                closeModal('intakeEditModal');
                loadIntakes();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error updating intake: ' + error.message);
    }
}

async function deleteIntake(intakeId) {
    if (!confirm('Delete this intake record?')) return;
    try {
        await sendRequest({
            url: `${API_BASE}/intakes/${intakeId}`,
            method: 'DELETE',
            body: {},
            onSuccess: () => {
                loadIntakes();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error deleting intake: ' + error.message);
    }
}

// ========== SHIFTS ==========
async function saveShift(e) {
    e.preventDefault();
    if (!currentPatientId) return;

    const shiftData = {
        patientId: currentPatientId,
        staffName: document.getElementById('shiftStaffName').value,
        role: document.getElementById('shiftRole').value,
        shiftStart: getDateTimeFromInputs('shiftStartDate', 'shiftStartTime'),
        shiftEnd: getDateTimeFromInputs('shiftEndDate', 'shiftEndTime'),
        notes: document.getElementById('shiftNotes').value,
        createdBy: currentUser.id
    };

    try {
        await sendRequest({
            url: `${API_BASE}/shifts`,
            method: 'POST',
            body: shiftData,
            onSuccess: () => {
                document.getElementById('shiftForm').reset();
                loadShifts();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error saving shift: ' + error.message);
    }
}

async function loadShifts() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/shifts?patientId=${currentPatientId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const shifts = await response.json();
        shiftsCache = shifts;

        const container = document.getElementById('shiftsList');
        if (!container) return;
        if (shifts.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🧑‍⚕️</div><p>No shifts added</p></div>';
            return;
        }

        container.innerHTML = shifts.map(shift => `
            <div class="list-item">
                <div class="list-item-header">
                    <div class="list-item-title">${shift.staffName}</div>
                    <span class="list-item-badge badge-${shift.role === 'doctor' ? 'high' : 'medium'}">${shift.role.toUpperCase()}</span>
                </div>
                <div class="list-item-body">
                    <p><strong>From:</strong> ${formatDate(shift.shiftStart)}</p>
                    <p><strong>To:</strong> ${formatDate(shift.shiftEnd)}</p>
                    ${shift.notes ? `<p><strong>Notes:</strong> ${shift.notes}</p>` : ''}
                </div>
                <div class="list-item-footer">
                    <div class="item-meta-lines">
                        <span>Created by ${formatUserName(shift.createdBy)} · ${formatDate(shift.createdAt)}</span>
                        <span>Updated by ${formatUserName(shift.updatedBy || shift.createdBy)} · ${formatDate(shift.updatedAt || shift.createdAt)}</span>
                    </div>
                    <div class="item-actions">
                        <button class="btn-tertiary" data-action="edit-shift" data-id="${shift._id}">Edit</button>
                        <button class="btn-tertiary" data-action="delete-shift" data-id="${shift._id}">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading shifts:', error);
    }
}

function handleShiftAction(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const shiftId = action.dataset.id;
    if (action.dataset.action === 'edit-shift') {
        openShiftEditModal(shiftId);
    }
    if (action.dataset.action === 'delete-shift') {
        deleteShift(shiftId);
    }
}

function openShiftEditModal(shiftId) {
    const shift = shiftsCache.find(item => item._id === shiftId);
    if (!shift) return;
    editingShiftId = shiftId;
    document.getElementById('editShiftStaffName').value = shift.staffName || '';
    document.getElementById('editShiftRole').value = shift.role || 'doctor';
    setDateTimeInputs('editShiftStartDate', 'editShiftStartTime', shift.shiftStart);
    setDateTimeInputs('editShiftEndDate', 'editShiftEndTime', shift.shiftEnd);
    document.getElementById('editShiftNotes').value = shift.notes || '';
    openModal('shiftEditModal');
}

async function saveShiftEdits(e) {
    e.preventDefault();
    if (!editingShiftId) return;

    const updateData = {
        staffName: document.getElementById('editShiftStaffName').value,
        role: document.getElementById('editShiftRole').value,
        shiftStart: getDateTimeFromInputs('editShiftStartDate', 'editShiftStartTime'),
        shiftEnd: getDateTimeFromInputs('editShiftEndDate', 'editShiftEndTime'),
        notes: document.getElementById('editShiftNotes').value
    };

    try {
        await sendRequest({
            url: `${API_BASE}/shifts/${editingShiftId}`,
            method: 'PUT',
            body: updateData,
            onSuccess: () => {
                closeModal('shiftEditModal');
                loadShifts();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error updating shift: ' + error.message);
    }
}

async function deleteShift(shiftId) {
    if (!confirm('Delete this shift?')) return;

    try {
        await sendRequest({
            url: `${API_BASE}/shifts/${shiftId}`,
            method: 'DELETE',
            body: {},
            onSuccess: () => {
                loadShifts();
                loadDashboard();
            }
        });
    } catch (error) {
        alert('Error deleting shift: ' + error.message);
    }
}

// ======== Shared actions metadata ========
function formatUserName(user) {
    if (!user) return 'Unknown';
    if (typeof user === 'string') return user;
    return user.name || user.email || 'Unknown';
}

function formatDate(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatDateOnly(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

function formatTimeFromString(value) {
    if (!value) return 'N/A';
    const [hours, minutes] = value.split(':');
    const date = new Date();
    date.setHours(parseInt(hours || '0', 10));
    date.setMinutes(parseInt(minutes || '0', 10));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDateTimeFromInputs(dateId, timeId) {
    const dateValue = document.getElementById(dateId)?.value;
    const timeValue = document.getElementById(timeId)?.value;
    const now = new Date();

    const date = dateValue ? new Date(dateValue) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [hours, minutes] = (timeValue || '').split(':');
    const finalDate = new Date(date);

    if (timeValue) {
        finalDate.setHours(parseInt(hours || '0', 10));
        finalDate.setMinutes(parseInt(minutes || '0', 10));
    } else {
        finalDate.setHours(now.getHours());
        finalDate.setMinutes(now.getMinutes());
    }
    finalDate.setSeconds(0, 0);
    return finalDate;
}

function setDateTimeInputs(dateId, timeId, value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return;
    const dateInput = document.getElementById(dateId);
    const timeInput = document.getElementById(timeId);
    if (dateInput) {
        const pad = number => String(number).padStart(2, '0');
        dateInput.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
    if (timeInput) {
        timeInput.value = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
}

function initializeTimeSelects() {
    const selects = document.querySelectorAll('.time-select');
    selects.forEach(select => {
        if (select.dataset.bound === 'true') return;
        select.dataset.bound = 'true';
        select.innerHTML = '<option value="">Select time</option>';
        for (let hour = 0; hour < 24; hour += 1) {
            for (let minute = 0; minute < 60; minute += 15) {
                const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const label = formatTimeFromString(value);
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                select.appendChild(option);
            }
        }
    });
}

function initializeSchedulePickers() {
    const pickers = document.querySelectorAll('.schedule-picker');
    pickers.forEach(picker => {
        if (picker.dataset.bound === 'true') return;
        picker.dataset.bound = 'true';
        const isCollapsed = picker.dataset.collapsed !== 'false';
        picker.innerHTML = `
            <button type="button" class="schedule-toggle" aria-expanded="${!isCollapsed}" aria-controls="schedule-panels">${isCollapsed ? 'Show schedule times' : 'Hide schedule times'}</button>
            <div class="schedule-panels" ${isCollapsed ? 'hidden' : ''}>
                <div class="schedule-tabs">
                    <button type="button" class="schedule-tab active" data-target="am">AM</button>
                    <button type="button" class="schedule-tab" data-target="pm">PM</button>
                </div>
                <div class="schedule-panel" data-panel="am"></div>
                <div class="schedule-panel" data-panel="pm" hidden></div>
            </div>
        `;

        const panelAm = picker.querySelector('[data-panel="am"]');
        const panelPm = picker.querySelector('[data-panel="pm"]');

        for (let hour = 0; hour < 24; hour += 1) {
            for (let minute = 0; minute < 60; minute += 15) {
                const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const label = document.createElement('label');
                label.className = 'schedule-option';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = value;

                const text = document.createElement('span');
                text.textContent = formatTimeFromString(value);

                label.appendChild(checkbox);
                label.appendChild(text);

                if (hour < 12) {
                    panelAm.appendChild(label);
                } else {
                    panelPm.appendChild(label);
                }
            }
        }

        const toggle = picker.querySelector('.schedule-toggle');
        const panels = picker.querySelector('.schedule-panels');
        toggle.addEventListener('click', () => {
            const shouldOpen = panels.hasAttribute('hidden');
            if (shouldOpen) {
                panels.removeAttribute('hidden');
            } else {
                panels.setAttribute('hidden', '');
            }
            toggle.setAttribute('aria-expanded', String(shouldOpen));
            toggle.textContent = shouldOpen ? 'Hide schedule times' : 'Show schedule times';
        });

        picker.querySelectorAll('.schedule-tab').forEach(button => {
            button.addEventListener('click', () => {
                picker.querySelectorAll('.schedule-tab').forEach(tab => {
                    tab.classList.toggle('active', tab === button);
                });
                const target = button.dataset.target;
                picker.querySelectorAll('.schedule-panel').forEach(panel => {
                    panel.hidden = panel.dataset.panel !== target;
                });
            });
        });
    });
}

function getScheduleFromPicker(inputId) {
    const picker = document.querySelector(`.schedule-picker[data-input="${inputId}"]`);
    const input = document.getElementById(inputId);
    if (!picker) {
        return parseScheduleInput(input?.value || '');
    }
    const values = Array.from(picker.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    if (input) {
        input.value = values.join(', ');
    }
    return values;
}

function normalizeScheduleValues(values) {
    if (!Array.isArray(values)) return [];
    return values
        .map(value => parseScheduleInput(String(value)).shift())
        .filter(Boolean);
}

function setSchedulePickerValues(inputId, values) {
    const picker = document.querySelector(`.schedule-picker[data-input="${inputId}"]`);
    if (!picker) return;
    const selected = new Set(normalizeScheduleValues(values));
    picker.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = selected.has(checkbox.value);
    });
    const input = document.getElementById(inputId);
    if (input) {
        input.value = Array.from(selected).join(', ');
    }
}

function resetSchedulePicker(inputId) {
    setSchedulePickerValues(inputId, []);
}

function formatScheduleTimes(schedule) {
    const times = normalizeScheduleValues(schedule);
    if (times.length === 0) return '—';
    return times.map(formatTimeFromString).join(', ');
}

function getNextDoseDateForMedication(medication) {
    if (!medication || medication.status !== 'active') return null;
    const schedule = Array.isArray(medication.schedule) ? medication.schedule : [];
    if (schedule.length === 0) return null;

    const now = new Date();
    let next = null;

    schedule.forEach(time => {
        const doseDate = buildDateFromTime(time);
        let candidate = doseDate;
        if (candidate < now) {
            candidate = new Date(doseDate);
            candidate.setDate(candidate.getDate() + 1);
        }
        if (!next || candidate < next) {
            next = candidate;
        }
    });

    return next;
}

function formatTimeFromDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDateValueOrNow(value) {
    if (value) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
}

// ========== AUDIT LOG ==========
async function loadAuditLog() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/audit/patient/${currentPatientId}?limit=50`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const auditData = await response.json();

        const container = document.getElementById('auditList');
        if (auditData.logs.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No activity recorded</p></div>';
            return;
        }

        container.innerHTML = auditData.logs.map(log => `
            <div class="audit-entry ${log.action}">
                <div class="audit-header">
                    <span class="audit-action">${log.action.toUpperCase()} - ${log.dataType}</span>
                    <span class="audit-time">${formatDate(log.timestamp)}</span>
                </div>
                <div class="audit-user">
                    <span class="audit-user-badge">${log.userName} (${log.userRole})</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading audit log:', error);
    }
}
