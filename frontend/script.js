// API Configuration
const API_BASE_URL = 'http://localhost:8000';
const PREDICT_ENDPOINT = '/predict';

// DOM Elements
const form = document.getElementById('prediction-form');
const predictBtn = document.getElementById('predict-btn');
const btnText = predictBtn.querySelector('.btn-text');
const loader = predictBtn.querySelector('.loader');
const errorMessage = document.getElementById('error-message');
const results = document.getElementById('results');
const themeToggle = document.getElementById('theme-toggle');

// Chart instance
let scoreChart = null;

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update chart colors if exists
    if (scoreChart) {
        updateChartTheme();
    }
});

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    hideResults();

    if (!validateForm()) {
        return;
    }

    const formData = {
        studytime: parseInt(document.getElementById('studytime').value),
        failures: parseInt(document.getElementById('failures').value),
        absences: parseInt(document.getElementById('absences').value),
        G1: parseInt(document.getElementById('G1').value),
        G2: parseInt(document.getElementById('G2').value)
    };

    setLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}${PREDICT_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        console.error('Prediction error:', error);
        showError(getErrorMessage(error));
    } finally {
        setLoading(false);
    }
});

// Validation
function validateForm() {
    const fields = ['studytime', 'failures', 'absences', 'G1', 'G2'];
    const ranges = {
        studytime: [1, 4],
        failures: [0, 4],
        absences: [0, 93],
        G1: [0, 20],
        G2: [0, 20]
    };

    const errors = [];

    fields.forEach(field => {
        const value = parseInt(document.getElementById(field).value);
        const [min, max] = ranges[field];

        if (isNaN(value) || value < min || value > max) {
            errors.push(`${field} must be between ${min} and ${max}`);
        }
    });

    if (errors.length > 0) {
        showError(errors.join('. '));
        return false;
    }

    return true;
}

// Display all results
function displayResults(data) {
    // Mastery Status
    const masteryEl = document.getElementById('mastery-status');
    masteryEl.textContent = data.mastery_status;
    masteryEl.style.color = data.mastery === 1 ? 'var(--success)' : 'var(--warning)';
    document.getElementById('mastery-icon').textContent = data.mastery === 1 ? '✅' : '⏳';

    // Predicted Score
    document.getElementById('predicted-score').textContent = data.predicted_score.toFixed(1) + '/20';

    // Risk Level
    displayRisk(data.risk_level);

    // Profile
    displayProfile(data.profile);

    // Explanation
    displayExplanation(data.explanation);

    // Recommendation
    displayRecommendation(data.recommendation);

    // Learning Path
    displayLearningPath(data.learning_path);

    // Chart
    renderScoreChart(data.input_data.G1, data.input_data.G2, data.predicted_score);

    // Show results
    results.classList.remove('hidden');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display Risk Level
function displayRisk(risk) {
    const riskCard = document.getElementById('risk-card');
    const riskLevel = document.getElementById('risk-level');
    const riskIcon = document.getElementById('risk-icon');
    const riskAlert = document.getElementById('risk-alert');
    const riskMessage = document.getElementById('risk-message');

    riskLevel.textContent = risk.label;
    riskLevel.style.color = risk.color;

    // Set icon based on risk level
    const icons = { high: '🚨', medium: '⚠️', low: '📊', none: '✨' };
    riskIcon.textContent = icons[risk.level];

    // Show alert for high/medium risk
    if (risk.level === 'high' || risk.level === 'medium') {
        riskAlert.classList.remove('hidden');
        riskAlert.className = `alert ${risk.level}-risk`;
        riskMessage.textContent = risk.message;
    } else {
        riskAlert.classList.add('hidden');
    }
}

// Display Profile
function displayProfile(profile) {
    const badge = document.getElementById('performance-badge');
    badge.textContent = profile.performance_label;
    badge.className = `badge ${profile.performance_tag}`;

    document.getElementById('profile-summary').textContent = profile.summary;

    // Strengths
    const strengthsList = document.getElementById('strengths-list');
    strengthsList.innerHTML = profile.strengths.map(s => `<li>${s}</li>`).join('');

    // Weaknesses
    const weaknessesList = document.getElementById('weaknesses-list');
    weaknessesList.innerHTML = profile.weaknesses.map(w => `<li>${w}</li>`).join('');
}

// Display Explanation
function displayExplanation(explanation) {
    document.getElementById('main-reason').textContent = explanation.main_reason;

    const confidenceBadge = document.getElementById('confidence-badge');
    confidenceBadge.textContent = `${Math.round(explanation.confidence * 100)}% confidence`;

    // Insights
    const insightsList = document.getElementById('insights-list');
    insightsList.innerHTML = explanation.insights.map(insight => {
        const icon = insight.includes('good') || insight.includes('positive') ? '✅' : '⚠️';
        return `<div class="insight-item">${icon} ${insight}</div>`;
    }).join('');

    // Feature importance bars
    const featureBars = document.getElementById('feature-bars');
    featureBars.innerHTML = explanation.contributions.slice(0, 4).map(c => `
        <div class="feature-bar">
            <div class="feature-bar-label">
                <span>${c.feature}</span>
                <span>${(c.weight * 100).toFixed(0)}%</span>
            </div>
            <div class="feature-bar-track">
                <div class="feature-bar-fill ${c.impact}" style="width: ${c.weight * 100}%"></div>
            </div>
        </div>
    `).join('');
}

// Display Recommendation
function displayRecommendation(recommendation) {
    const badge = document.getElementById('plan-badge');
    badge.textContent = recommendation.plan_type;
    badge.className = `badge ${recommendation.plan_type}`;

    document.getElementById('recommendation-title').textContent = recommendation.title;
    document.getElementById('recommendation-description').textContent = recommendation.description;

    const actionsList = document.getElementById('recommendation-actions');
    actionsList.innerHTML = recommendation.actions.map(action => `<li>${action}</li>`).join('');
}

// Display Learning Path
function displayLearningPath(path) {
    const badge = document.getElementById('difficulty-badge');
    badge.textContent = path.difficulty_label;
    badge.className = `badge ${path.difficulty}`;

    // Progress bar
    document.getElementById('progress-percent').textContent = `${path.progress}%`;
    document.getElementById('progress-fill').style.width = `${path.progress}%`;
    document.getElementById('improvement-potential').textContent = path.estimated_improvement;

    // Next steps
    const stepsList = document.getElementById('next-steps-list');
    stepsList.innerHTML = path.next_steps.map(step => `<li>${step}</li>`).join('');

    // Study plan
    const studyPlan = document.getElementById('study-plan');
    studyPlan.innerHTML = path.study_plan.map(item => `
        <div class="study-item">
            <span class="study-item-topic">${item.topic}</span>
            <span class="study-item-duration">${item.duration}</span>
            <span class="study-item-priority priority-${item.priority}">${item.priority}</span>
        </div>
    `).join('');
}

// Render Score Chart
function renderScoreChart(g1, g2, predicted) {
    if (scoreChart) {
        scoreChart.destroy();
    }

    const ctx = document.getElementById('score-chart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['G1 (Period 1)', 'G2 (Period 2)', 'Predicted G3'],
            datasets: [{
                label: 'Score',
                data: [g1, g2, predicted],
                backgroundColor: [
                    'rgba(100, 116, 139, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(100, 116, 139, 1)',
                    'rgba(99, 102, 241, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Score: ${context.parsed.y.toFixed(2)} / 20`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    title: {
                        display: true,
                        text: 'Score (0-20)',
                        color: isDark ? '#94a3b8' : '#64748b'
                    },
                    grid: {
                        color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b'
                    }
                }
            }
        }
    });
}

// Update chart theme
function updateChartTheme() {
    if (scoreChart && scoreChart.data) {
        const g1 = scoreChart.data.datasets[0].data[0];
        const g2 = scoreChart.data.datasets[0].data[1];
        const predicted = scoreChart.data.datasets[0].data[2];
        renderScoreChart(g1, g2, predicted);
    }
}

// Loading state
function setLoading(isLoading) {
    predictBtn.disabled = isLoading;
    btnText.classList.toggle('hidden', isLoading);
    loader.classList.toggle('hidden', !isLoading);
}

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function hideResults() {
    results.classList.add('hidden');
}

function getErrorMessage(error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Unable to connect to the server. Please ensure the backend is running on port 8000.';
    }
    if (error.message.includes('Server error')) {
        return `Server error occurred. ${error.message}`;
    }
    return error.message || 'An unexpected error occurred. Please try again.';
}

// Initialize
initTheme();
