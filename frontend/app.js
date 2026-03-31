/**
 * AMEP - Main Application JavaScript
 * Handles authentication, routing, and all dashboard functionality
 */

// ============================================
// Configuration
// ============================================

const API_BASE = 'http://localhost:8000';

// ============================================
// State Management
// ============================================

const state = {
    user: null,
    currentPage: 'dashboard',
    students: [],
    analytics: null,
    charts: {}
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    loginPage: document.getElementById('login-page'),
    mainApp: document.getElementById('main-app'),
    loginForm: document.getElementById('login-form'),
    contentContainer: document.getElementById('content-container'),
    pageTitle: document.getElementById('page-title'),
    navMenu: document.getElementById('nav-menu'),
    userName: document.getElementById('user-name'),
    userRoleDisplay: document.getElementById('user-role-display'),
    themeToggle: document.getElementById('theme-toggle'),
    menuToggle: document.getElementById('menu-toggle'),
    sidebar: document.getElementById('sidebar'),
    logoutBtn: document.getElementById('logout-btn')
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
    setupEventListeners();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function checkAuth() {
    const savedUser = localStorage.getItem('amep_user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        showMainApp();
    }
}

function setupEventListeners() {
    // Login form
    elements.loginForm.addEventListener('submit', handleLogin);

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Menu toggle (mobile)
    elements.menuToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });

    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Modal close handlers
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('add-modal-close').addEventListener('click', closeAddModal);
    document.querySelector('#student-modal .modal-overlay').addEventListener('click', closeModal);
    document.querySelector('#add-student-modal .modal-overlay').addEventListener('click', closeAddModal);
}

// ============================================
// Authentication
// ============================================

async function handleLogin(e) {
    e.preventDefault();

    const name = document.getElementById('login-name').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role })
        });

        const data = await response.json();

        if (data.success) {
            state.user = data.user;
            localStorage.setItem('amep_user', JSON.stringify(data.user));
            showMainApp();
        }
    } catch (error) {
        console.error('Login error:', error);
        state.user = { name, role, token: `${role}_${name}` };
        localStorage.setItem('amep_user', JSON.stringify(state.user));
        showMainApp();
    }
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('amep_user');
    elements.mainApp.classList.remove('active');
    elements.loginPage.classList.add('active');
    elements.loginForm.reset();
}

// ============================================
// Navigation & Routing
// ============================================

function showMainApp() {
    elements.loginPage.classList.remove('active');
    elements.mainApp.classList.add('active');

    // Update user info
    elements.userName.textContent = state.user.name;
    elements.userRoleDisplay.textContent = state.user.role === 'teacher' ? 'Teacher' : 'Student';

    // Build navigation menu
    buildNavMenu();

    // Load default page
    navigateTo('dashboard');
}

function buildNavMenu() {
    const isTeacher = state.user.role === 'teacher';

    const menuItems = isTeacher ? [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'students', icon: '👥', label: 'Students' },
        { id: 'analytics', icon: '📈', label: 'Analytics' }
    ] : [
        { id: 'dashboard', icon: '🏠', label: 'My Dashboard' },
        { id: 'progress', icon: '📈', label: 'My Progress' }
    ];

    elements.navMenu.innerHTML = menuItems.map(item => `
        <li>
            <a href="#" data-page="${item.id}" class="${item.id === 'dashboard' ? 'active' : ''}">
                <span class="nav-icon">${item.icon}</span>
                <span>${item.label}</span>
            </a>
        </li>
    `).join('');

    // Add click listeners
    elements.navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateTo(page);

            // Update active state
            elements.navMenu.querySelectorAll('a').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Close mobile menu
            elements.sidebar.classList.remove('open');
        });
    });
}

function navigateTo(page) {
    state.currentPage = page;

    const titles = {
        dashboard: state.user.role === 'teacher' ? 'Class Dashboard' : 'My Dashboard',
        students: 'Student Management',
        analytics: 'Class Analytics',
        progress: 'My Progress'
    };

    elements.pageTitle.textContent = titles[page] || 'Dashboard';

    if (state.user.role === 'teacher') {
        loadTeacherPage(page);
    } else {
        loadStudentPage(page);
    }
}

// ============================================
// Student Dashboard
// ============================================

function loadStudentPage(page) {
    const template = document.getElementById('student-dashboard-template');
    elements.contentContainer.innerHTML = template.innerHTML;

    setupStudentDashboard();
}

function setupStudentDashboard() {
    const form = document.getElementById('prediction-form');
    form.addEventListener('submit', handleStudentPredict);
}

async function handleStudentPredict(e) {
    e.preventDefault();

    const btn = document.getElementById('analyze-btn');
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.loader');

    // Get form data
    const formData = {
        studytime: parseInt(document.getElementById('studytime').value),
        failures: parseInt(document.getElementById('failures').value),
        absences: parseInt(document.getElementById('absences').value),
        G1: parseInt(document.getElementById('G1').value),
        G2: parseInt(document.getElementById('G2').value)
    };

    // Validate
    if (!validateStudentInput(formData)) return;

    // Show loading
    btn.disabled = true;
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            displayStudentResults(data);
        } else {
            showError(data.error || 'Prediction failed');
        }
    } catch (error) {
        console.error('Prediction error:', error);
        showError('Unable to connect to server');
    } finally {
        btn.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

function validateStudentInput(data) {
    const errors = [];

    if (data.studytime < 1 || data.studytime > 4) errors.push('Study time: 1-4');
    if (data.failures < 0 || data.failures > 4) errors.push('Failures: 0-4');
    if (data.absences < 0 || data.absences > 93) errors.push('Absences: 0-93');
    if (data.G1 < 0 || data.G1 > 20) errors.push('G1: 0-20');
    if (data.G2 < 0 || data.G2 > 20) errors.push('G2: 0-20');

    if (errors.length > 0) {
        showError('Invalid values: ' + errors.join(', '));
        return false;
    }
    return true;
}

function displayStudentResults(data) {
    const resultsSection = document.getElementById('student-results');
    resultsSection.classList.remove('hidden');

    // Stats Row
    document.getElementById('stats-row').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">${data.mastery === 1 ? '✅' : '⏳'}</div>
            <div class="stat-content">
                <span class="stat-label">Mastery Status</span>
                <span class="stat-value" style="color: ${data.mastery === 1 ? 'var(--success)' : 'var(--warning)'}">${data.mastery_status}</span>
            </div>
        </div>
        <div class="stat-card highlight">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
                <span class="stat-label">Predicted Score</span>
                <span class="stat-value">${data.predicted_score.toFixed(1)}/20</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">${getRiskIcon(data.risk_level.level)}</div>
            <div class="stat-content">
                <span class="stat-label">Risk Level</span>
                <span class="stat-value" style="color: ${data.risk_level.color}">${data.risk_level.label}</span>
            </div>
        </div>
    `;

    // Risk Alert
    const riskAlert = document.getElementById('risk-alert');
    if (data.risk_level.level === 'high' || data.risk_level.level === 'medium') {
        riskAlert.classList.remove('hidden');
        riskAlert.className = `alert ${data.risk_level.level === 'high' ? 'danger' : 'warning'}`;
        riskAlert.innerHTML = `<span>🚨</span> ${data.risk_level.message}`;
    } else {
        riskAlert.classList.add('hidden');
    }

    // Profile Card
    document.getElementById('profile-card').innerHTML = `
        <div class="card-header">
            <h3>👤 Your Profile</h3>
            <span class="badge ${data.profile.performance_tag}">${data.profile.performance_label}</span>
        </div>
        <div class="card-body">
            <div class="profile-summary">${data.profile.summary}</div>
            <div class="profile-lists">
                <div class="profile-section">
                    <h4>💪 Strengths</h4>
                    <ul>${data.profile.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div class="profile-section">
                    <h4>📈 Areas to Improve</h4>
                    <ul>${data.profile.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>
                </div>
            </div>
        </div>
    `;

    // Explanation Card
    document.getElementById('explanation-card').innerHTML = `
        <div class="card-header">
            <h3>🧠 AI Explanation</h3>
            <span class="badge info">${Math.round(data.explanation.confidence * 100)}% confidence</span>
        </div>
        <div class="card-body">
            <p class="main-reason">${data.explanation.main_reason}</p>
            <div class="feature-bars">
                ${data.explanation.contributions.slice(0, 4).map(c => `
                    <div class="feature-bar">
                        <div class="feature-bar-label">
                            <span>${c.feature}</span>
                            <span>${(c.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div class="feature-bar-track">
                            <div class="feature-bar-fill ${c.impact}" style="width: ${c.weight * 100}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Recommendation Card
    document.getElementById('recommendation-card').innerHTML = `
        <div class="card-header">
            <h3>💡 Recommendation</h3>
            <span class="badge ${data.recommendation.plan_type}">${data.recommendation.plan_type}</span>
        </div>
        <div class="card-body">
            <h4>${data.recommendation.title}</h4>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">${data.recommendation.description}</p>
            <ul class="action-list">
                ${data.recommendation.actions.map(a => `<li>${a}</li>`).join('')}
            </ul>
        </div>
    `;

    // Learning Path Card
    document.getElementById('learning-path-card').innerHTML = `
        <div class="card-header">
            <h3>🛤️ Learning Path</h3>
            <span class="badge ${data.learning_path.difficulty}">${data.learning_path.difficulty_label}</span>
        </div>
        <div class="card-body">
            <div class="progress-section">
                <div class="progress-header">
                    <span>Your Progress</span>
                    <span>${data.learning_path.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.learning_path.progress}%"></div>
                </div>
                <p style="color: var(--success); font-size: 0.85rem; margin-top: 0.5rem;">${data.learning_path.estimated_improvement}</p>
            </div>
            <h4 style="margin-bottom: 0.5rem;">📋 Next Steps</h4>
            <ol class="steps-list">
                ${data.learning_path.next_steps.map(s => `<li>${s}</li>`).join('')}
            </ol>
            <h4 style="margin: 1rem 0 0.5rem;">📅 Study Plan</h4>
            ${data.learning_path.study_plan.map(item => `
                <div class="study-plan-item">
                    <span>${item.topic}</span>
                    <span style="color: var(--text-muted)">${item.duration}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Render Chart
    renderStudentChart(data.input_data.G1, data.input_data.G2, data.predicted_score);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function renderStudentChart(g1, g2, predicted) {
    const ctx = document.getElementById('score-chart');
    if (!ctx) return;

    if (state.charts.studentScore) {
        state.charts.studentScore.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    state.charts.studentScore = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['G1 (Period 1)', 'G2 (Period 2)', 'Predicted G3'],
            datasets: [{
                data: [g1, g2, predicted],
                backgroundColor: ['#64748b', '#6366f1', '#10b981'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b' }
                }
            }
        }
    });
}

// ============================================
// Teacher Dashboard
// ============================================

async function loadTeacherPage(page) {
    const template = document.getElementById('teacher-dashboard-template');
    elements.contentContainer.innerHTML = template.innerHTML;

    // Load data
    await Promise.all([loadStudents(), loadAnalytics()]);

    setupTeacherDashboard();
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/students`);
        const data = await response.json();
        state.students = data.students || [];
    } catch (error) {
        console.error('Error loading students:', error);
        state.students = [];
    }
}

async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/class-analytics`);
        state.analytics = await response.json();
    } catch (error) {
        console.error('Error loading analytics:', error);
        state.analytics = null;
    }
}

function setupTeacherDashboard() {
    // Display overview
    displayClassOverview();

    // Display student table
    displayStudentTable();

    // Display recommendations
    displayTeacherRecommendations();

    // Display at-risk students
    displayAtRiskStudents();

    // Render charts
    renderTeacherCharts();

    // Setup add student button
    document.getElementById('add-student-btn').addEventListener('click', openAddModal);
    document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
}

function displayClassOverview() {
    if (!state.analytics) return;

    const stats = state.analytics.statistics;
    document.getElementById('total-students').textContent = stats.total_students;
    document.getElementById('avg-score').textContent = stats.average_score.toFixed(1);
    document.getElementById('at-risk-count').textContent = stats.at_risk_count;
    document.getElementById('mastery-rate').textContent = stats.mastery_rate + '%';
}

function displayStudentTable() {
    const tbody = document.getElementById('students-tbody');

    if (!state.students.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No students found</td></tr>';
        return;
    }

    tbody.innerHTML = state.students.map(student => {
        const pred = student.prediction;
        const riskLevel = pred.risk_level.level;

        return `
            <tr data-id="${student.id}">
                <td><strong>${student.name}</strong></td>
                <td>${pred.predicted_score.toFixed(1)}</td>
                <td><span class="badge ${pred.mastery === 1 ? 'success' : 'warning'}">${pred.mastery_status}</span></td>
                <td class="risk-${riskLevel}">${pred.risk_level.label}</td>
                <td><button class="table-btn view" onclick="viewStudent('${student.id}')">View</button></td>
            </tr>
        `;
    }).join('');
}

function displayTeacherRecommendations() {
    const container = document.getElementById('teacher-recommendations');

    if (!state.analytics || !state.analytics.recommendations.length) {
        container.innerHTML = '<p style="color: var(--text-muted);">No recommendations at this time.</p>';
        return;
    }

    container.innerHTML = state.analytics.recommendations.map(rec => `
        <div class="recommendation-item ${rec.priority}">
            <p>${rec.message}</p>
            ${rec.students ? `<small>Students: ${rec.students.join(', ')}</small>` : ''}
        </div>
    `).join('');
}

function displayAtRiskStudents() {
    const container = document.getElementById('at-risk-list');

    if (!state.analytics || !state.analytics.at_risk_students.length) {
        container.innerHTML = '<p style="color: var(--text-muted);">No at-risk students identified.</p>';
        return;
    }

    container.innerHTML = state.analytics.at_risk_students.map(student => `
        <div class="at-risk-item">
            <div class="at-risk-info">
                <h4>${student.name}</h4>
                <p>${student.main_issue}</p>
            </div>
            <div>
                <span class="badge ${student.risk_level}">${student.risk_level} risk</span>
                <span style="margin-left: 0.5rem; font-weight: 600;">${student.predicted_score.toFixed(1)}/20</span>
            </div>
        </div>
    `).join('');
}

function renderTeacherCharts() {
    if (!state.analytics) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Risk Distribution Chart
    const riskCtx = document.getElementById('risk-chart');
    if (riskCtx) {
        if (state.charts.risk) state.charts.risk.destroy();

        const riskDist = state.analytics.statistics.risk_distribution;
        state.charts.risk = new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['High Risk', 'Medium Risk', 'Low Risk', 'No Risk'],
                datasets: [{
                    data: [riskDist.high, riskDist.medium, riskDist.low, riskDist.none],
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    }
                }
            }
        });
    }

    // Score Distribution Chart
    const distCtx = document.getElementById('distribution-chart');
    if (distCtx) {
        if (state.charts.distribution) state.charts.distribution.destroy();

        const scoreDist = state.analytics.score_distribution;
        state.charts.distribution = new Chart(distCtx, {
            type: 'bar',
            data: {
                labels: ['Excellent (16+)', 'Good (12-15)', 'Average (10-11)', 'Below Avg (8-9)', 'Failing (<8)'],
                datasets: [{
                    data: [scoreDist.excellent, scoreDist.good, scoreDist.average, scoreDist.below_average, scoreDist.failing],
                    backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }
}

// ============================================
// Student Modal (View Details)
// ============================================

window.viewStudent = function(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const pred = student.prediction;
    const modal = document.getElementById('student-modal');
    const modalBody = document.getElementById('modal-body');

    document.getElementById('modal-student-name').textContent = student.name;

    modalBody.innerHTML = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <span class="stat-label">Predicted Score</span>
                    <span class="stat-value">${pred.predicted_score.toFixed(1)}/20</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">${pred.mastery === 1 ? '✅' : '⏳'}</div>
                <div class="stat-content">
                    <span class="stat-label">Mastery</span>
                    <span class="stat-value">${pred.mastery_status}</span>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 1rem;">
            <div class="card-header">
                <h3>📝 Student Data</h3>
            </div>
            <div class="card-body">
                <div class="form-grid">
                    <div><strong>Study Time:</strong> ${student.studytime}</div>
                    <div><strong>Failures:</strong> ${student.failures}</div>
                    <div><strong>Absences:</strong> ${student.absences}</div>
                    <div><strong>G1:</strong> ${student.G1}</div>
                    <div><strong>G2:</strong> ${student.G2}</div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 1rem;">
            <div class="card-header">
                <h3>🧠 AI Insights</h3>
            </div>
            <div class="card-body">
                <p class="main-reason">${pred.explanation.main_reason}</p>
            </div>
        </div>

        <div class="card" style="margin-bottom: 1rem;">
            <div class="card-header">
                <h3>👤 Profile</h3>
            </div>
            <div class="card-body">
                <div class="profile-lists">
                    <div class="profile-section">
                        <h4>💪 Strengths</h4>
                        <ul>${pred.profile.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                    </div>
                    <div class="profile-section">
                        <h4>📈 Weaknesses</h4>
                        <ul>${pred.profile.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>💡 Recommendations</h3>
            </div>
            <div class="card-body">
                <ul class="action-list">
                    ${pred.recommendation.actions.map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
};

function closeModal() {
    document.getElementById('student-modal').classList.add('hidden');
}

// ============================================
// Add Student Modal
// ============================================

function openAddModal() {
    document.getElementById('add-student-modal').classList.remove('hidden');
}

function closeAddModal() {
    document.getElementById('add-student-modal').classList.add('hidden');
    document.getElementById('add-student-form').reset();
}

async function handleAddStudent(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('new-name').value,
        studytime: parseInt(document.getElementById('new-studytime').value),
        failures: parseInt(document.getElementById('new-failures').value),
        absences: parseInt(document.getElementById('new-absences').value),
        G1: parseInt(document.getElementById('new-G1').value),
        G2: parseInt(document.getElementById('new-G2').value)
    };

    try {
        const response = await fetch(`${API_BASE}/add-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            closeAddModal();
            // Reload data
            await Promise.all([loadStudents(), loadAnalytics()]);
            setupTeacherDashboard();
        }
    } catch (error) {
        console.error('Error adding student:', error);
    }
}

// ============================================
// Utility Functions
// ============================================

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Refresh charts with new theme
    if (state.user?.role === 'teacher') {
        renderTeacherCharts();
    } else if (state.charts.studentScore) {
        const data = state.charts.studentScore.data.datasets[0].data;
        renderStudentChart(data[0], data[1], data[2]);
    }
}

function getRiskIcon(level) {
    const icons = { high: '🚨', medium: '⚠️', low: '📊', none: '✨' };
    return icons[level] || '📊';
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 5000);
    }
}
