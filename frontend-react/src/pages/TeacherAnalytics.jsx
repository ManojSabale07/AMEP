import React, { useState, useEffect } from 'react'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Title, Tooltip, Legend
} from 'chart.js'
import { getClassAnalytics } from '../services/api'
import '../styles/TeacherDashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend)

function TeacherAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getClassAnalytics()
      .then(data => { setAnalytics(data); setLoading(false) })
      .catch(err => { setError(err.response?.data?.error || 'Failed to load analytics'); setLoading(false) })
  }, [])

  if (loading) return <div className="td-loading"><div className="td-spinner"></div><p>Loading analytics...</p></div>
  if (error) return <div className="td-error"><div className="error-icon">⚠️</div><h3>Error</h3><p>{error}</p></div>

  const stats = analytics?.statistics || {}
  const dist = analytics?.score_distribution || {}
  const riskDist = stats.risk_distribution || {}

  const riskChartData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk', 'No Risk'],
    datasets: [{
      data: [riskDist.high || 0, riskDist.medium || 0, riskDist.low || 0, riskDist.none || 0],
      backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(245,158,11,0.85)', 'rgba(59,130,246,0.85)', 'rgba(16,185,129,0.85)'],
      borderWidth: 0, hoverOffset: 8,
    }],
  }

  const scoreChartData = {
    labels: ['Excellent (≥16)', 'Good (12-15)', 'Average (10-11)', 'Below Avg (8-9)', 'Failing (<8)'],
    datasets: [{
      label: 'Number of Students',
      data: [dist.excellent || 0, dist.good || 0, dist.average || 0, dist.below_average || 0, dist.failing || 0],
      backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#f97316', '#ef4444'],
      borderRadius: 10,
    }],
  }

  const chartOpts = (title) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, title: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
  })

  const statCards = [
    { icon: '👥', label: 'Total Students', value: stats.total_students || 0, color: '#6366f1' },
    { icon: '📊', label: 'Class Average', value: `${stats.average_score?.toFixed(1) || 0}/20`, color: '#8b5cf6' },
    { icon: '🏆', label: 'Mastery Rate', value: `${stats.mastery_rate || 0}%`, color: '#10b981' },
    { icon: '⚠️', label: 'At Risk', value: stats.at_risk_count || 0, color: '#ef4444' },
    { icon: '⭐', label: 'High Performers', value: stats.high_performers || 0, color: '#f59e0b' },
    { icon: '🆘', label: 'Need Support', value: stats.needs_support || 0, color: '#f97316' },
  ]

  return (
    <div className="teacher-dashboard">
      <div className="td-welcome">
        <div><h2>Class Analytics 📊</h2><p>Data-driven insights for your class</p></div>
      </div>

      {/* Stat Row (6 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {statCards.map(({ icon, label, value, color }) => (
          <div key={label} className="td-stat-card" style={{ borderLeft: `3px solid ${color}` }}>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text, #1e293b)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 500, marginTop: '0.2rem' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="td-charts">
        <div className="card">
          <div className="card-header"><div className="card-title"><span>🚦</span><h3>Risk Distribution</h3></div></div>
          <div className="card-body chart-body" style={{ height: 260 }}>
            <Doughnut data={riskChartData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%', maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title"><span>📈</span><h3>Score Distribution</h3></div></div>
          <div className="card-body chart-body" style={{ height: 260 }}>
            <Bar data={scoreChartData} options={chartOpts()} />
          </div>
        </div>
      </div>

      {/* At-Risk Students */}
      <div className="td-bottom-grid">
        <div className="card">
          <div className="card-header"><div className="card-title"><span>🚨</span><h3>Needs Attention</h3></div></div>
          <div className="card-body">
            {analytics?.at_risk_students?.length > 0 ? (
              <div className="at-risk-list">
                {analytics.at_risk_students.map((s, i) => {
                  const color = { high: '#ef4444', medium: '#f59e0b' }[s.risk_level] || '#3b82f6'
                  return (
                    <div key={i} className={`at-risk-item risk-${s.risk_level}`}>
                      <div className="at-risk-left">
                        <div className="at-risk-dot" style={{ background: color }}></div>
                        <div>
                          <div className="at-risk-name">{s.name}</div>
                          <div className="at-risk-issue">{s.main_issue}</div>
                        </div>
                      </div>
                      <div className="at-risk-right">
                        <span className="at-risk-score">{s.predicted_score?.toFixed(1)}/20</span>
                        <span className="at-risk-badge" style={{ background: `${color}18`, color }}>{s.risk_level}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <div className="td-no-data">✅ No students at high risk!</div>}
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
    </div>
  )
}

export default TeacherAnalytics
