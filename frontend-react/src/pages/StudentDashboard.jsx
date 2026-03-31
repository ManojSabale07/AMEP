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
import '../styles/StudentDashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function StudentDashboard() {
  const [formData, setFormData] = useState({
    studytime: '',
    failures: '',
    absences: '',
    G1: '',
    G2: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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
      setError(err.response?.data?.error || 'Failed to get prediction. Is the backend running?')
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
        data: [
          parseInt(formData.G1),
          parseInt(formData.G2),
          result.predicted_score
        ],
        backgroundColor: [
          'rgba(100, 116, 139, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgba(100, 116, 139, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      }],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 20,
        title: { display: true, text: 'Score (0-20)' },
      },
      x: {
        grid: { display: false },
      },
    },
  }

  return (
    <div className="student-dashboard">
      {/* Input Section */}
      <section className="card input-section">
        <div className="card-header">
          <h3>📝 Enter Your Data</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="studytime">Study Time</label>
                <input
                  type="number"
                  id="studytime"
                  name="studytime"
                  min="1"
                  max="4"
                  value={formData.studytime}
                  onChange={handleInputChange}
                  required
                  placeholder="1-4"
                />
                <span className="hint">1=&lt;2h, 2=2-5h, 3=5-10h, 4=&gt;10h</span>
              </div>
              <div className="form-group">
                <label htmlFor="failures">Past Failures</label>
                <input
                  type="number"
                  id="failures"
                  name="failures"
                  min="0"
                  max="4"
                  value={formData.failures}
                  onChange={handleInputChange}
                  required
                  placeholder="0-4"
                />
              </div>
              <div className="form-group">
                <label htmlFor="absences">Absences</label>
                <input
                  type="number"
                  id="absences"
                  name="absences"
                  min="0"
                  max="93"
                  value={formData.absences}
                  onChange={handleInputChange}
                  required
                  placeholder="0-93"
                />
              </div>
              <div className="form-group">
                <label htmlFor="G1">G1 (Period 1)</label>
                <input
                  type="number"
                  id="G1"
                  name="G1"
                  min="0"
                  max="20"
                  value={formData.G1}
                  onChange={handleInputChange}
                  required
                  placeholder="0-20"
                />
              </div>
              <div className="form-group">
                <label htmlFor="G2">G2 (Period 2)</label>
                <input
                  type="number"
                  id="G2"
                  name="G2"
                  min="0"
                  max="20"
                  value={formData.G2}
                  onChange={handleInputChange}
                  required
                  placeholder="0-20"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <span>🔮 Analyze My Performance</span>
                </>
              )}
            </button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <div className="results-section">
          {/* Stats Cards */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon">
                {result.mastery === 1 ? '✅' : '⏳'}
              </div>
              <div className="stat-content">
                <span className="stat-label">Mastery Status</span>
                <span className={`stat-value ${result.mastery === 1 ? 'success' : 'warning'}`}>
                  {result.mastery_status}
                </span>
              </div>
            </div>

            <div className="stat-card highlight">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <span className="stat-label">Predicted Score</span>
                <span className="stat-value">{result.predicted_score.toFixed(1)}/20</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                {result.risk_level?.level === 'high' ? '🚨' :
                 result.risk_level?.level === 'medium' ? '⚠️' :
                 result.risk_level?.level === 'low' ? '📊' : '✨'}
              </div>
              <div className="stat-content">
                <span className="stat-label">Risk Level</span>
                <span className={`stat-value risk-${result.risk_level?.level}`}>
                  {result.risk_level?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Alert */}
          {(result.risk_level?.level === 'high' || result.risk_level?.level === 'medium') && (
            <div className={`alert ${result.risk_level.level === 'high' ? 'danger' : 'warning'}`}>
              <span>🚨</span>
              <span>{result.risk_level.message}</span>
            </div>
          )}

          {/* Main Grid */}
          <div className="dashboard-grid">
            {/* Profile Card */}
            <section className="card">
              <div className="card-header">
                <h3>👤 Your Profile</h3>
                <span className={`badge ${result.profile?.performance_tag}`}>
                  {result.profile?.performance_label}
                </span>
              </div>
              <div className="card-body">
                <p className="profile-summary">{result.profile?.summary}</p>
                <div className="profile-lists">
                  <div className="profile-section">
                    <h4>💪 Strengths</h4>
                    <ul>
                      {result.profile?.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="profile-section">
                    <h4>📈 Areas to Improve</h4>
                    <ul>
                      {result.profile?.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Explanation Card */}
            <section className="card">
              <div className="card-header">
                <h3>🧠 AI Explanation</h3>
                <span className="confidence-badge">
                  {Math.round((result.explanation?.confidence || 0.7) * 100)}% confidence
                </span>
              </div>
              <div className="card-body">
                <p className="main-reason">{result.explanation?.main_reason}</p>
                <div className="insights-list">
                  {result.explanation?.insights.map((insight, i) => (
                    <div key={i} className="insight-item">
                      {insight.includes('good') ? '✅' : '⚠️'} {insight}
                    </div>
                  ))}
                </div>
                <div className="feature-bars">
                  {result.explanation?.contributions.slice(0, 4).map((c, i) => (
                    <div key={i} className="feature-bar">
                      <div className="feature-bar-label">
                        <span>{c.feature}</span>
                        <span>{Math.round(c.weight * 100)}%</span>
                      </div>
                      <div className="feature-bar-track">
                        <div
                          className={`feature-bar-fill ${c.impact}`}
                          style={{ width: `${c.weight * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recommendation Card */}
            <section className="card">
              <div className="card-header">
                <h3>💡 Recommendation</h3>
                <span className={`badge ${result.recommendation?.plan_type}`}>
                  {result.recommendation?.plan_type}
                </span>
              </div>
              <div className="card-body">
                <h4>{result.recommendation?.title}</h4>
                <p>{result.recommendation?.description}</p>
                <ul className="action-list">
                  {result.recommendation?.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Learning Path Card */}
            <section className="card">
              <div className="card-header">
                <h3>🛤️ Learning Path</h3>
                <span className={`badge ${result.learning_path?.difficulty}`}>
                  {result.learning_path?.difficulty_label}
                </span>
              </div>
              <div className="card-body">
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Your Progress</span>
                    <span>{result.learning_path?.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${result.learning_path?.progress}%` }}
                    />
                  </div>
                  <p className="improvement-text">{result.learning_path?.estimated_improvement}</p>
                </div>

                <h4>📋 Next Steps</h4>
                <ol className="steps-list">
                  {result.learning_path?.next_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>

                <h4>📅 Study Plan</h4>
                <div className="study-plan">
                  {result.learning_path?.study_plan.map((item, i) => (
                    <div key={i} className="study-plan-item">
                      <span className="topic">{item.topic}</span>
                      <span className="duration">{item.duration}</span>
                      <span className={`priority-badge priority-${item.priority}`}>
                        {item.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Chart */}
          <section className="card chart-section">
            <div className="card-header">
              <h3>📈 Score Comparison</h3>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <Bar data={getChartData()} options={chartOptions} />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
