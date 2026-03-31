import { useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { predict } from '../services/api'
import { useAuth } from '../App'
import '../styles/StudentDashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const DEMO_VALUES = {
  studytime: 3,
  failures: 0,
  absences: 4,
  G1: 13,
  G2: 14,
}

function StudentDashboard() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    studytime: '', failures: '', absences: '', G1: '', G2: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const fillDemo = () => setFormData(Object.fromEntries(Object.entries(DEMO_VALUES).map(([k, v]) => [k, String(v)])))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = {
        studytime: parseInt(formData.studytime),
        failures: parseInt(formData.failures),
        absences: parseInt(formData.absences),
        G1: parseInt(formData.G1),
        G2: parseInt(formData.G2),
      }
      const response = await predict(data)
      setResult(response)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Prediction failed. Is the backend running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const getChartData = () => {
    if (!result) return null
    return {
      labels: ['G1 (Period 1)', 'G2 (Period 2)', 'Predicted G3'],
      datasets: [{
        label: 'Score',
        data: [parseInt(formData.G1), parseInt(formData.G2), result.predicted_score],
        backgroundColor: ['rgba(100,116,139,0.7)', 'rgba(99,102,241,0.7)', 'rgba(16,185,129,0.8)'],
        borderColor: ['#64748b', '#6366f1', '#10b981'],
        borderWidth: 2,
        borderRadius: 10,
      }],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 20, grid: { color: 'rgba(0,0,0,0.06)' }, title: { display: true, text: 'Score (0-20)' } },
      x: { grid: { display: false } },
    },
  }

  const riskColors = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6', none: '#10b981' }
  const scorePercent = result ? (result.predicted_score / 20) * 100 : 0
  const riskLevel = result?.risk_level?.level || 'none'

  return (
    <div className="student-dashboard">

      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋</h2>
          <p>Enter your academic data to get an AI-powered performance prediction.</p>
        </div>
        <div className="welcome-badge">
          <span>🤖 AI Powered</span>
        </div>
      </div>

      {/* Input Form */}
      <section className="card input-card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-icon">📝</span>
            <h3>Your Academic Data</h3>
          </div>
          <button className="btn-demo" onClick={fillDemo}>✨ Auto-Fill Demo</button>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid-5">
              <div className="form-field">
                <label>Study Time</label>
                <div className="input-with-badge">
                  <input type="number" name="studytime" min="1" max="4" value={formData.studytime} onChange={handleInputChange} required placeholder="1–4" />
                  {formData.studytime && <span className="input-badge">{['<2h','2-5h','5-10h','>10h'][parseInt(formData.studytime)-1] || ''}</span>}
                </div>
                <span className="field-hint">1=&lt;2h · 2=2-5h · 3=5-10h · 4=&gt;10h</span>
              </div>
              <div className="form-field">
                <label>Past Failures</label>
                <input type="number" name="failures" min="0" max="4" value={formData.failures} onChange={handleInputChange} required placeholder="0–4" />
                <span className="field-hint">Number of class failures</span>
              </div>
              <div className="form-field">
                <label>Absences</label>
                <input type="number" name="absences" min="0" max="93" value={formData.absences} onChange={handleInputChange} required placeholder="0–93" />
                <span className="field-hint">School absences count</span>
              </div>
              <div className="form-field">
                <label>G1 — Period 1</label>
                <input type="number" name="G1" min="0" max="20" value={formData.G1} onChange={handleInputChange} required placeholder="0–20" />
                <span className="field-hint">First period grade</span>
              </div>
              <div className="form-field">
                <label>G2 — Period 2</label>
                <input type="number" name="G2" min="0" max="20" value={formData.G2} onChange={handleInputChange} required placeholder="0–20" />
                <span className="field-hint">Second period grade</span>
              </div>
            </div>

            {error && (
              <div className="error-alert">
                <span>⚠️</span>
                <span>{error}</span>
                <button type="button" onClick={() => setError('')}>×</button>
              </div>
            )}

            <button type="submit" className="btn-predict" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner"></span><span>Analyzing...</span></>
              ) : (
                <><span>🔮</span><span>Analyze My Performance</span></>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      {result && (
        <div className="results-wrapper">

          {/* Stat Cards Row */}
          <div className="stats-grid">
            {/* Score Ring */}
            <div className="stat-card score-card">
              <div className="score-ring" style={{ '--pct': scorePercent, '--color': scorePercent >= 60 ? '#10b981' : scorePercent >= 40 ? '#f59e0b' : '#ef4444' }}>
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color)" strokeWidth="10"
                    strokeDasharray={`${scorePercent * 3.14} 314`} strokeLinecap="round"
                    transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1.2s ease' }}/>
                </svg>
                <div className="ring-label">
                  <span className="ring-value">{result.predicted_score?.toFixed(1)}</span>
                  <span className="ring-unit">/20</span>
                </div>
              </div>
              <span className="stat-name">Predicted Score</span>
            </div>

            {/* Mastery */}
            <div className={`stat-card mastery-card ${result.mastery === 1 ? 'mastered' : 'not-mastered'}`}>
              <div className="stat-icon-large">{result.mastery === 1 ? '🏆' : '📖'}</div>
              <div className="stat-info">
                <span className="stat-name">Mastery</span>
                <span className={`mastery-badge ${result.mastery === 1 ? 'mastered' : 'learning'}`}>
                  {result.mastery_status}
                </span>
              </div>
            </div>

            {/* Risk */}
            <div className="stat-card risk-card" style={{ '--risk-color': riskColors[riskLevel] }}>
              <div className="stat-icon-large">
                {riskLevel === 'high' ? '🚨' : riskLevel === 'medium' ? '⚠️' : riskLevel === 'low' ? '📊' : '✨'}
              </div>
              <div className="stat-info">
                <span className="stat-name">Risk Level</span>
                <span className="risk-pill" style={{ background: `${riskColors[riskLevel]}22`, color: riskColors[riskLevel], border: `1px solid ${riskColors[riskLevel]}44` }}>
                  {result.risk_level?.label}
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="stat-card confidence-card">
              <div className="stat-icon-large">🧠</div>
              <div className="stat-info">
                <span className="stat-name">AI Confidence</span>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${(result.explanation?.confidence || 0.7) * 100}%` }}></div>
                </div>
                <span className="confidence-pct">{Math.round((result.explanation?.confidence || 0.7) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Risk Alert */}
          {(riskLevel === 'high' || riskLevel === 'medium') && (
            <div className={`alert-banner ${riskLevel}`}>
              <span>{riskLevel === 'high' ? '🚨' : '⚠️'}</span>
              <span>{result.risk_level?.message}</span>
            </div>
          )}

          {/* Detail Grid */}
          <div className="detail-grid-2">
            {/* Profile */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>👤</span><h3>Your Profile</h3></div>
                <span className="tag">{result.profile?.performance_label}</span>
              </div>
              <div className="card-body">
                <p className="profile-summary">{result.profile?.summary}</p>
                <div className="two-col">
                  <div>
                    <h4 className="section-label">💪 Strengths</h4>
                    <ul className="bullet-list green">
                      {result.profile?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="section-label">📈 Improve</h4>
                    <ul className="bullet-list amber">
                      {result.profile?.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>🧠</span><h3>AI Explanation</h3></div>
              </div>
              <div className="card-body">
                <p className="insight-main">{result.explanation?.main_reason}</p>
                <div className="insights-stack">
                  {result.explanation?.insights?.map((ins, i) => (
                    <div key={i} className={`insight-row ${ins.toLowerCase().includes('good') ? 'positive' : 'warning'}`}>
                      {ins.toLowerCase().includes('good') ? '✅' : '⚠️'} {ins}
                    </div>
                  ))}
                </div>
                <div className="feature-bars">
                  {result.explanation?.contributions?.slice(0, 4).map((c, i) => (
                    <div key={i} className="feature-row">
                      <div className="feature-meta">
                        <span>{c.feature}</span>
                        <span>{Math.round(c.weight * 100)}%</span>
                      </div>
                      <div className="feature-track">
                        <div className={`feature-fill ${c.impact}`} style={{ width: `${c.weight * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>💡</span><h3>Recommendation</h3></div>
                <span className="tag">{result.recommendation?.plan_type}</span>
              </div>
              <div className="card-body">
                <h4 className="rec-title">{result.recommendation?.title}</h4>
                <p>{result.recommendation?.description}</p>
                <ul className="action-list">
                  {result.recommendation?.actions?.map((a, i) => <li key={i}><span>→</span>{a}</li>)}
                </ul>
              </div>
            </div>

            {/* Learning Path */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>🛤️</span><h3>Learning Path</h3></div>
                <span className="tag">{result.learning_path?.difficulty_label}</span>
              </div>
              <div className="card-body">
                <div className="progress-bar-wrap">
                  <div className="progress-label">
                    <span>Your Progress</span><span>{result.learning_path?.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar-fill" style={{ width: `${result.learning_path?.progress}%` }}></div>
                  </div>
                  <p className="improvement-note">{result.learning_path?.estimated_improvement}</p>
                </div>
                <h4 className="section-label">📋 Next Steps</h4>
                <ol className="steps-list">
                  {result.learning_path?.next_steps?.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                <div className="study-plan">
                  {result.learning_path?.study_plan?.map((item, i) => (
                    <div key={i} className="study-item">
                      <span className="study-topic">{item.topic}</span>
                      <span className="study-duration">{item.duration}</span>
                      <span className={`priority-tag priority-${item.priority}`}>{item.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <div className="card-title"><span>📈</span><h3>Score Progression</h3></div>
            </div>
            <div className="card-body">
              <div style={{ height: '240px' }}>
                <Bar data={getChartData()} options={chartOptions} />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default StudentDashboard
