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
import { getStudents, getClassAnalytics, addStudent } from '../services/api'
import '../styles/TeacherDashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

function TeacherDashboard() {
  const [students, setStudents] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: '',
    studytime: 2,
    failures: 0,
    absences: 0,
    G1: 10,
    G2: 10,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsData, analyticsData] = await Promise.all([
        getStudents(),
        getClassAnalytics()
      ])
      setStudents(studentsData.students || [])
      setAnalytics(analyticsData)
    } catch (err) {
      setError('Failed to load data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    try {
      await addStudent(newStudent)
      setShowAddModal(false)
      setNewStudent({
        name: '',
        studytime: 2,
        failures: 0,
        absences: 0,
        G1: 10,
        G2: 10,
      })
      loadData()
    } catch (err) {
      setError('Failed to add student')
    }
  }

  const getRiskDistributionData = () => {
    if (!analytics) return null
    const dist = analytics.statistics?.risk_distribution || {}
    return {
      labels: ['High Risk', 'Medium Risk', 'Low Risk', 'No Risk'],
      datasets: [{
        data: [dist.high || 0, dist.medium || 0, dist.low || 0, dist.none || 0],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderWidth: 0,
      }],
    }
  }

  const getScoreDistributionData = () => {
    if (!analytics) return null
    const dist = analytics.score_distribution || {}
    return {
      labels: ['Excellent (16+)', 'Good (12-15)', 'Average (10-11)', 'Below Avg (8-9)', 'Failing (<8)'],
      datasets: [{
        label: 'Students',
        data: [dist.excellent || 0, dist.good || 0, dist.average || 0, dist.below_average || 0, dist.failing || 0],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderRadius: 6,
      }],
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-large"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    )
  }

  return (
    <div className="teacher-dashboard">
      {/* Class Overview */}
      <div className="class-overview">
        <div className="overview-card">
          <span className="overview-icon">👥</span>
          <div className="overview-content">
            <span className="overview-value">{analytics?.statistics?.total_students || 0}</span>
            <span className="overview-label">Total Students</span>
          </div>
        </div>
        <div className="overview-card">
          <span className="overview-icon">📊</span>
          <div className="overview-content">
            <span className="overview-value">{analytics?.statistics?.average_score?.toFixed(1) || 0}</span>
            <span className="overview-label">Average Score</span>
          </div>
        </div>
        <div className="overview-card warning">
          <span className="overview-icon">⚠️</span>
          <div className="overview-content">
            <span className="overview-value">{analytics?.statistics?.at_risk_count || 0}</span>
            <span className="overview-label">At-Risk Students</span>
          </div>
        </div>
        <div className="overview-card success">
          <span className="overview-icon">✅</span>
          <div className="overview-content">
            <span className="overview-value">{analytics?.statistics?.mastery_rate || 0}%</span>
            <span className="overview-label">Mastery Rate</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="teacher-grid">
        {/* Student List */}
        <section className="card students-list-card">
          <div className="card-header">
            <h3>📋 Student List</h3>
            <button className="btn-small" onClick={() => setShowAddModal(true)}>
              + Add Student
            </button>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Predicted</th>
                    <th>Mastery</th>
                    <th>Risk</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.prediction?.predicted_score?.toFixed(1)}</td>
                      <td>
                        <span className={`badge ${student.prediction?.mastery === 1 ? 'success' : 'warning'}`}>
                          {student.prediction?.mastery_status}
                        </span>
                      </td>
                      <td>
                        <span className={`risk-${student.prediction?.risk_level?.level}`}>
                          {student.prediction?.risk_level?.label}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-btn view"
                          onClick={() => setSelectedStudent(student)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Teacher Recommendations */}
        <section className="card recommendations-card">
          <div className="card-header">
            <h3>💡 Recommendations</h3>
          </div>
          <div className="card-body">
            {analytics?.recommendations?.length > 0 ? (
              analytics.recommendations.map((rec, i) => (
                <div key={i} className={`recommendation-item ${rec.priority}`}>
                  <p>{rec.message}</p>
                  {rec.students && rec.students.length > 0 && (
                    <small>Students: {rec.students.join(', ')}</small>
                  )}
                </div>
              ))
            ) : (
              <p className="no-data">No recommendations at this time.</p>
            )}
          </div>
        </section>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <section className="card">
          <div className="card-header">
            <h3>📊 Risk Distribution</h3>
          </div>
          <div className="card-body chart-body">
            {getRiskDistributionData() && (
              <Doughnut
                data={getRiskDistributionData()}
                options={{ plugins: { legend: { position: 'bottom' } } }}
              />
            )}
          </div>
        </section>
        <section className="card">
          <div className="card-header">
            <h3>📈 Score Distribution</h3>
          </div>
          <div className="card-body chart-body">
            {getScoreDistributionData() && (
              <Bar
                data={getScoreDistributionData()}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            )}
          </div>
        </section>
      </div>

      {/* At-Risk Students */}
      <section className="card at-risk-card">
        <div className="card-header">
          <h3>🚨 Students Needing Attention</h3>
        </div>
        <div className="card-body">
          {analytics?.at_risk_students?.length > 0 ? (
            <div className="at-risk-list">
              {analytics.at_risk_students.map((student, i) => (
                <div key={i} className="at-risk-item">
                  <div className="at-risk-info">
                    <h4>{student.name}</h4>
                    <p>{student.main_issue}</p>
                  </div>
                  <div className="at-risk-stats">
                    <span className={`badge danger`}>{student.risk_level}</span>
                    <span className="score">{student.predicted_score?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No students at high risk.</p>
          )}
        </div>
      </section>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setSelectedStudent(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedStudent.name}</h3>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="student-detail">
                <div className="detail-section">
                  <h4>📊 Prediction</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Predicted Score</span>
                      <span className="detail-value">{selectedStudent.prediction?.predicted_score?.toFixed(1)}/20</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mastery</span>
                      <span className={`badge ${selectedStudent.prediction?.mastery === 1 ? 'success' : 'warning'}`}>
                        {selectedStudent.prediction?.mastery_status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Risk Level</span>
                      <span className={`risk-${selectedStudent.prediction?.risk_level?.level}`}>
                        {selectedStudent.prediction?.risk_level?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>📚 Student Data</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Study Time</span>
                      <span className="detail-value">{selectedStudent.studytime}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Failures</span>
                      <span className="detail-value">{selectedStudent.failures}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Absences</span>
                      <span className="detail-value">{selectedStudent.absences}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">G1</span>
                      <span className="detail-value">{selectedStudent.G1}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">G2</span>
                      <span className="detail-value">{selectedStudent.G2}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>🧠 AI Insights</h4>
                  <p className="main-reason">{selectedStudent.prediction?.explanation?.main_reason}</p>
                </div>

                <div className="detail-section">
                  <h4>💡 Recommendation</h4>
                  <p>{selectedStudent.prediction?.recommendation?.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Student</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddStudent}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    required
                    placeholder="Student name"
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Study Time</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={newStudent.studytime}
                      onChange={(e) => setNewStudent({ ...newStudent, studytime: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Failures</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newStudent.failures}
                      onChange={(e) => setNewStudent({ ...newStudent, failures: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Absences</label>
                    <input
                      type="number"
                      min="0"
                      max="93"
                      value={newStudent.absences}
                      onChange={(e) => setNewStudent({ ...newStudent, absences: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>G1</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={newStudent.G1}
                      onChange={(e) => setNewStudent({ ...newStudent, G1: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>G2</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={newStudent.G2}
                      onChange={(e) => setNewStudent({ ...newStudent, G2: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary">Add Student</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard
