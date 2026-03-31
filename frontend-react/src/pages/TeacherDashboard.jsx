import { useState, useEffect } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { getStudents, getClassAnalytics, addStudent, deleteStudent } from '../services/api'
import { useAuth } from '../App'
import '../styles/TeacherDashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

function TeacherDashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [toast, setToast] = useState(null)
  const [newStudent, setNewStudent] = useState({ name: '', studytime: 2, failures: 0, absences: 0, G1: 10, G2: 10 })

  useEffect(() => { loadData() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [studentsData, analyticsData] = await Promise.all([
        getStudents(),
        getClassAnalytics()
      ])
      setStudents(studentsData.students || [])
      setAnalytics(analyticsData)
      showToast('Dashboard data loaded successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    try {
      await addStudent(newStudent)
      setShowAddModal(false)
      setNewStudent({ name: '', studytime: 2, failures: 0, absences: 0, G1: 10, G2: 10 })
      await loadData()
      showToast('Student added successfully!')
    } catch (err) {
      showToast('Failed to add student', 'error')
    }
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const risk = s.prediction?.risk_level?.level || 'none'
    const matchesRisk = filterRisk === 'all' || risk === filterRisk
    return matchesSearch && matchesRisk
  })

  const getRiskColor = (level) => {
    const map = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6', none: '#10b981' }
    return map[level] || '#94a3b8'
  }

  const getRiskDistributionData = () => {
    if (!analytics) return null
    const dist = analytics.statistics?.risk_distribution || {}
    return {
      labels: ['High Risk', 'Medium Risk', 'Low Risk', 'No Risk'],
      datasets: [{
        data: [dist.high || 0, dist.medium || 0, dist.low || 0, dist.none || 0],
        backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(245,158,11,0.85)', 'rgba(59,130,246,0.85)', 'rgba(16,185,129,0.85)'],
        borderWidth: 0, hoverOffset: 6,
      }],
    }
  }

  const getScoreDistributionData = () => {
    if (!analytics) return null
    const dist = analytics.score_distribution || {}
    return {
      labels: ['Excellent', 'Good', 'Average', 'Below Avg', 'Failing'],
      datasets: [{
        label: 'Students',
        data: [dist.excellent || 0, dist.good || 0, dist.average || 0, dist.below_average || 0, dist.failing || 0],
        backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#f97316', '#ef4444'],
        borderRadius: 8,
      }],
    }
  }

  if (loading) return (
    <div className="td-loading">
      <div className="td-spinner"></div>
      <p>Loading teacher dashboard...</p>
    </div>
  )

  if (error) return (
    <div className="td-error">
      <div className="error-icon">⚠️</div>
      <h3>Could not load data</h3>
      <p>{error}</p>
      <button className="btn-retry" onClick={loadData}>🔄 Retry</button>
    </div>
  )

  return (
    <div className="teacher-dashboard">
      {/* Toast */}
      {toast && (
        <div className={`td-toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Welcome */}
      <div className="td-welcome">
        <div>
          <h2>Welcome, {user?.name?.split(' ')[0] || 'Teacher'} 👋</h2>
          <p>Here's your class overview for today.</p>
        </div>
        <button className="btn-add-student" onClick={() => setShowAddModal(true)}>
          <span>+</span> Add Student
        </button>
      </div>

      {/* Stat Cards */}
      <div className="td-stats">
        <div className="td-stat-card">
          <span className="td-stat-icon">👥</span>
          <div>
            <div className="td-stat-value">{analytics?.statistics?.total_students || 0}</div>
            <div className="td-stat-label">Total Students</div>
          </div>
        </div>
        <div className="td-stat-card">
          <span className="td-stat-icon">📊</span>
          <div>
            <div className="td-stat-value">{analytics?.statistics?.average_score?.toFixed(1) || '—'}</div>
            <div className="td-stat-label">Avg. Score / 20</div>
          </div>
        </div>
        <div className="td-stat-card warning">
          <span className="td-stat-icon">⚠️</span>
          <div>
            <div className="td-stat-value">{analytics?.statistics?.at_risk_count || 0}</div>
            <div className="td-stat-label">At-Risk Students</div>
          </div>
        </div>
        <div className="td-stat-card success">
          <span className="td-stat-icon">🏆</span>
          <div>
            <div className="td-stat-value">{analytics?.statistics?.mastery_rate || 0}%</div>
            <div className="td-stat-label">Mastery Rate</div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>📋</span><h3>Student List</h3></div>
          <div className="td-filters">
            <input
              className="td-search"
              placeholder="🔍 Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select className="td-filter-select" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
              <option value="none">No Risk</option>
            </select>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="td-table-wrapper">
            <table className="td-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>G1</th><th>G2</th>
                  <th>Predicted</th>
                  <th>Mastery</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="7" className="td-empty">No students found.</td></tr>
                ) : filteredStudents.map(student => {
                  const risk = student.prediction?.risk_level?.level || 'none'
                  return (
                    <tr key={student.id} className={`td-row risk-row-${risk}`}>
                      <td className="td-name">{student.name}</td>
                      <td>{student.G1}</td>
                      <td>{student.G2}</td>
                      <td><strong>{student.prediction?.predicted_score?.toFixed(1)}</strong></td>
                      <td>
                        <span className={`badge-mastery ${student.prediction?.mastery === 1 ? 'yes' : 'no'}`}>
                          {student.prediction?.mastery_status || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="risk-chip" style={{ background: `${getRiskColor(risk)}18`, color: getRiskColor(risk), border: `1px solid ${getRiskColor(risk)}44` }}>
                          {student.prediction?.risk_level?.label || '—'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-view" onClick={() => setSelectedStudent(student)}>View</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="td-charts">
        <div className="card">
          <div className="card-header"><div className="card-title"><span>📊</span><h3>Risk Distribution</h3></div></div>
          <div className="card-body chart-body">
            {getRiskDistributionData() && (
              <Doughnut data={getRiskDistributionData()} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title"><span>📈</span><h3>Score Distribution</h3></div></div>
          <div className="card-body chart-body">
            {getScoreDistributionData() && (
              <Bar data={getScoreDistributionData()} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
            )}
          </div>
        </div>
      </div>

      {/* At-Risk + Recommendations */}
      <div className="td-bottom-grid">
        <div className="card">
          <div className="card-header"><div className="card-title"><span>🚨</span><h3>Needs Attention</h3></div></div>
          <div className="card-body">
            {analytics?.at_risk_students?.length > 0 ? (
              <div className="at-risk-list">
                {analytics.at_risk_students.map((s, i) => (
                  <div key={i} className={`at-risk-item risk-${s.risk_level}`}>
                    <div className="at-risk-left">
                      <div className="at-risk-dot" style={{ background: getRiskColor(s.risk_level) }}></div>
                      <div>
                        <div className="at-risk-name">{s.name}</div>
                        <div className="at-risk-issue">{s.main_issue}</div>
                      </div>
                    </div>
                    <div className="at-risk-right">
                      <span className="at-risk-score">{s.predicted_score?.toFixed(1)}/20</span>
                      <span className="at-risk-badge" style={{ background: `${getRiskColor(s.risk_level)}18`, color: getRiskColor(s.risk_level) }}>{s.risk_level}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="td-no-data">✅ No students at high risk!</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><span>💡</span><h3>Recommendations</h3></div></div>
          <div className="card-body">
            {analytics?.recommendations?.length > 0 ? (
              <div className="rec-list">
                {analytics.recommendations.map((rec, i) => (
                  <div key={i} className={`rec-item priority-${rec.priority}`}>
                    <div className="rec-dot"></div>
                    <div>
                      <p className="rec-message">{rec.message}</p>
                      {rec.students?.length > 0 && <small className="rec-students">Students: {rec.students.join(', ')}</small>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="td-no-data">No recommendations at this time.</div>}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 {selectedStudent.name}</h3>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-section">
                  <h4>📊 Prediction</h4>
                  <div className="modal-stat-row"><span>Score</span><strong>{selectedStudent.prediction?.predicted_score?.toFixed(1)}/20</strong></div>
                  <div className="modal-stat-row"><span>Mastery</span>
                    <span className={`badge-mastery ${selectedStudent.prediction?.mastery === 1 ? 'yes' : 'no'}`}>{selectedStudent.prediction?.mastery_status}</span>
                  </div>
                  <div className="modal-stat-row"><span>Risk</span>
                    <span className="risk-chip" style={{ background: `${getRiskColor(selectedStudent.prediction?.risk_level?.level)}18`, color: getRiskColor(selectedStudent.prediction?.risk_level?.level) }}>
                      {selectedStudent.prediction?.risk_level?.label}
                    </span>
                  </div>
                </div>
                <div className="modal-section">
                  <h4>📚 Academic Data</h4>
                  <div className="modal-stat-row"><span>Study Time</span><strong>{selectedStudent.studytime}</strong></div>
                  <div className="modal-stat-row"><span>Failures</span><strong>{selectedStudent.failures}</strong></div>
                  <div className="modal-stat-row"><span>Absences</span><strong>{selectedStudent.absences}</strong></div>
                  <div className="modal-stat-row"><span>G1</span><strong>{selectedStudent.G1}</strong></div>
                  <div className="modal-stat-row"><span>G2</span><strong>{selectedStudent.G2}</strong></div>
                </div>
              </div>
              <div className="modal-section">
                <h4>🧠 AI Insight</h4>
                <p className="modal-insight">{selectedStudent.prediction?.explanation?.main_reason || 'No insight available.'}</p>
              </div>
              <div className="modal-section">
                <h4>💡 Recommendation</h4>
                <p className="modal-insight">{selectedStudent.prediction?.recommendation?.description || 'No recommendation available.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Add New Student</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddStudent}>
                <div className="form-field" style={{ marginBottom: '1rem' }}>
                  <label>Full Name</label>
                  <input type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required placeholder="Student name" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[['studytime','Study Time (1-4)',1,4],['failures','Failures (0-4)',0,4],['absences','Absences (0-93)',0,93],['G1','G1 (0-20)',0,20],['G2','G2 (0-20)',0,20]].map(([key,label,min,max]) => (
                    <div key={key} className="form-field">
                      <label>{label}</label>
                      <input type="number" min={min} max={max} value={newStudent[key]} onChange={e => setNewStudent({...newStudent, [key]: parseInt(e.target.value)})} />
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn-predict">Add Student</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard
