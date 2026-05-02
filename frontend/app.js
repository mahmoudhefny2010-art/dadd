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

const AUTO_LOGIN_EMAILS = [
    'menna.dad@example.com',
    'manar.dad@example.com',
    'mariam.dad@example.com',
    'hoda.dad@example.com',
    'mahmoud.dad@example.com'
];

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
        const select = document.getElementById('patientSelect');
        
        select.innerHTML = '<option value="">-- Select a Patient --</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient._id;
            option.textContent = patient.name + (patient.age ? ` (${patient.age}y)` : '');
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading patients:', error);
    }
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
        const response = await fetch(`${API_BASE}/patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            closePatientModal();
            loadPatients();
        }
    } catch (error) {
        alert('Error saving patient: ' + error.message);
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
    } catch (error) {
        console.error('Error loading dashboard:', error);
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
        createdBy: currentUser.id
    };

    try {
        const response = await fetch(`${API_BASE}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(questionData)
        });

        if (response.ok) {
            document.getElementById('questionForm').reset();
            loadQuestions();
        }
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
                <div class="list-item-footer">
                    <span class="recorded-by">By: ${q.createdBy?.name || 'Unknown'}</span>
                    <span>${new Date(q.createdAt).toLocaleString()}</span>
                </div>
                ${q.answer ? `<div class="list-item-body"><strong>Answer:</strong> ${q.answer}</div>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// ========== OBSERVATIONS ==========
async function saveObservation(e) {
    e.preventDefault();

    const observationData = {
        patientId: currentPatientId,
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
        const response = await fetch(`${API_BASE}/observations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(observationData)
        });

        if (response.ok) {
            document.getElementById('observationForm').reset();
            loadObservations();
        }
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
                    <span class="recorded-by">By: ${obs.createdBy?.name || 'Unknown'}</span>
                    <span>${new Date(obs.timestamp).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading observations:', error);
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
        createdBy: currentUser.id
    };

    try {
        const response = await fetch(`${API_BASE}/medications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(medicationData)
        });

        if (response.ok) {
            document.getElementById('medicationForm').reset();
            loadMedications();
        }
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

        const container = document.getElementById('medicationsList');
        if (medications.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💊</div><p>No medications recorded</p></div>';
            selectedMedicationId = null;
            updateMedicationActionState();
            clearMedicationHistory();
            return;
        }

        container.innerHTML = medications.map(med => `
            <div class="list-item medication-item ${selectedMedicationId === med._id ? 'selected' : ''}" data-med-id="${med._id}">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${med.name}</div>
                        <div class="list-item-meta">
                            <span>Status: <span class="status-pill status-${med.status}">${med.status}</span></span>
                            <span>Type: ${med.type.toUpperCase()}</span>
                        </div>
                    </div>
                    <button class="btn-tertiary select-medication-btn" type="button">Select</button>
                </div>
                <div class="list-item-body">
                    <p><strong>Dosage:</strong> ${med.dosage?.amount || 'N/A'} ${med.dosage?.unit || ''}</p>
                    <p><strong>Frequency:</strong> ${med.frequency || 'Not set'}</p>
                    ${med.purpose ? `<p><strong>Purpose:</strong> ${med.purpose}</p>` : ''}
                    ${med.notes ? `<p><strong>Notes:</strong> ${med.notes}</p>` : ''}
                </div>
                <div class="list-item-footer">
                    <span class="recorded-by">By: ${med.createdBy?.name || 'Unknown'}</span>
                    <span>Updated: ${new Date(med.updatedAt || med.createdAt).toLocaleString()}</span>
                </div>
            </div>
        `).join('');

        if (!medications.some(med => med._id === selectedMedicationId)) {
            selectedMedicationId = null;
        }
        updateMedicationActionState();
        if (selectedMedicationId) {
            loadMedicationHistory(selectedMedicationId);
        } else {
            clearMedicationHistory();
        }
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

    const selected = getSelectedMedication();
    const hasSelection = Boolean(selected);

    [editBtn, stopBtn, replaceBtn, checklistBtn].forEach(button => {
        button.disabled = !hasSelection;
    });

    if (label) {
        label.textContent = hasSelection
            ? `${selected.name} (${selected.status}) selected. Use the shortcuts to edit, stop, replace, or log a dose.`
            : 'Select a medication to edit, stop, replace, or log a dose.';
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
    document.getElementById('editMedAmount').value = selected.dosage?.amount || '';
    document.getElementById('editMedUnit').value = selected.dosage?.unit || '';
    document.getElementById('editMedFrequency').value = selected.frequency || '';
    document.getElementById('editMedPurpose').value = selected.purpose || '';
    document.getElementById('editMedStatus').value = selected.status || 'active';
    document.getElementById('editMedNotes').value = selected.notes || '';
    openModal('medicationEditModal');
}

function openStopMedicationModal() {
    if (!getSelectedMedication()) return;
    document.getElementById('stopMedDate').value = getNowDatetimeLocal();
    openModal('medicationStopModal');
}

function openReplaceMedicationModal() {
    if (!getSelectedMedication()) return;
    document.getElementById('replaceMedDate').value = getNowDatetimeLocal();
    openModal('medicationReplaceModal');
}

function openChecklistMedicationModal() {
    if (!getSelectedMedication()) return;
    document.getElementById('checklistMedDate').value = getNowDatetimeLocal();
    openModal('medicationChecklistModal');
}

function getNowDatetimeLocal() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

async function saveMedicationEdits(e) {
    e.preventDefault();
    const selected = getSelectedMedication();
    if (!selected) return;

    const updateData = {
        name: document.getElementById('editMedName').value,
        type: document.getElementById('editMedType').value,
        dosage: {
            amount: parseFloat(document.getElementById('editMedAmount').value),
            unit: document.getElementById('editMedUnit').value
        },
        frequency: document.getElementById('editMedFrequency').value,
        purpose: document.getElementById('editMedPurpose').value,
        status: document.getElementById('editMedStatus').value,
        notes: document.getElementById('editMedNotes').value,
        changeReason: document.getElementById('editMedReason').value
    };

    try {
        const response = await fetch(`${API_BASE}/medications/${selected._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            closeModal('medicationEditModal');
            loadMedications();
        }
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
        const response = await fetch(`${API_BASE}/medications/${selected._id}/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                endDate: dateValue ? new Date(dateValue) : new Date(),
                reason
            })
        });

        if (response.ok) {
            closeModal('medicationStopModal');
            loadMedications();
        }
    } catch (error) {
        alert('Error stopping medication: ' + error.message);
    }
}

async function replaceMedication(e) {
    e.preventDefault();
    const selected = getSelectedMedication();
    if (!selected) return;

    const replacementDate = document.getElementById('replaceMedDate').value;
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
        notes: document.getElementById('replaceMedNotes').value
    };

    try {
        const response = await fetch(`${API_BASE}/medications/${selected._id}/replace`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                replacementDate: replacementDate ? new Date(replacementDate) : new Date(),
                newMedicationName,
                newMedicationData,
                reason: document.getElementById('replaceMedReason').value
            })
        });

        if (response.ok) {
            closeModal('medicationReplaceModal');
            loadMedications();
        }
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

    let date = new Date();
    let time = new Date().toLocaleTimeString();
    if (dateValue) {
        date = new Date(dateValue);
        time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    try {
        const response = await fetch(`${API_BASE}/medications/${selected._id}/checklist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                date,
                time,
                taken,
                notes
            })
        });

        if (response.ok) {
            closeModal('medicationChecklistModal');
            loadMedications();
        }
    } catch (error) {
        alert('Error adding checklist entry: ' + error.message);
    }
}

// ========== INTAKES ==========
async function saveIntake(e) {
    e.preventDefault();

    const intakeData = {
        patientId: currentPatientId,
        date: document.getElementById('intakeDate').value ? new Date(document.getElementById('intakeDate').value) : new Date(),
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
        const response = await fetch(`${API_BASE}/intakes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(intakeData)
        });

        if (response.ok) {
            document.getElementById('intakeForm').reset();
            loadIntakes();
        }
    } catch (error) {
        alert('Error saving intake: ' + error.message);
    }
}

async function loadIntakes() {
    if (!currentPatientId) return;

    try {
        const response = await fetch(`${API_BASE}/intakes?patientId=${currentPatientId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const intakes = await response.json();

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
                    <span class="recorded-by">By: ${intake.createdBy?.name || 'Unknown'}</span>
                    <span>${new Date(intake.date).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading intakes:', error);
    }
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
                    <span class="audit-time">${new Date(log.timestamp).toLocaleString()}</span>
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
