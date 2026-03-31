import React, { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { updateStudentProfile } from '../services/api'
import '../styles/StudentDashboard.css'

const DEMO_PROFILE = {
  studytime: 3,
  failures: 0,
  absences: 4,
  G1: 13,
  G2: 14,
}

function StudentProfile() {
  const { user, setUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    studytime: user?.studytime || 2,
    failures: user?.failures || 0,
    absences: user?.absences || 0,
    G1: user?.G1 || 0,
    G2: user?.G2 || 0,
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [prediction, setPrediction] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await updateStudentProfile(form)
      if (response.success) {
        setUser({ ...user, ...response.student })
        setPrediction(response.prediction)
        setEditing(false)
        showToast('Profile updated successfully!')
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const fillDemo = () => {
    setForm(prev => ({ ...prev, ...DEMO_PROFILE }))
  }

  const riskColors = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6', none: '#10b981' }
  const riskLevel = prediction?.risk_level?.level || 'none'

  return (
    <div className="student-dashboard">
      {/* Toast */}
      {toast && (
        <div className={`td-toast ${toast.type}`} style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', padding: '0.875rem 1.25rem', borderRadius: '12px', fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,.15)', animation: 'slideToast .3s ease', background: toast.type === 'success' ? '#dcfce7' : '#fee2e2', color: toast.type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header Banner */}
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)' }}>
        <div className="welcome-text">
          <h2>Your Profile 👤</h2>
          <p>View and update your academic data. Your prediction updates live.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!editing && <button className="btn-demo" onClick={() => setEditing(true)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>✏️ Edit Profile</button>}
        </div>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>👤</span><h3>Academic Profile</h3></div>
          {!editing && <button className="btn-demo" onClick={fillDemo}>✨ Load Demo Data</button>}
        </div>
        <div className="card-body">
          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-grid-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-field">
                  <label>Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                </div>
                <div className="form-field">
                  <label>Study Time (1–4)</label>
                  <input type="number" min="1" max="4" value={form.studytime} onChange={e => setForm({ ...form, studytime: parseInt(e.target.value) })} />
                  <span className="field-hint">1=&lt;2h  2=2-5h  3=5-10h  4=&gt;10h</span>
                </div>
                <div className="form-field">
                  <label>Past Failures</label>
                  <input type="number" min="0" max="4" value={form.failures} onChange={e => setForm({ ...form, failures: parseInt(e.target.value) })} />
                </div>
                <div className="form-field">
                  <label>Absences</label>
                  <input type="number" min="0" max="93" value={form.absences} onChange={e => setForm({ ...form, absences: parseInt(e.target.value) })} />
                </div>
                <div className="form-field">
                  <label>G1 — Period 1</label>
                  <input type="number" min="0" max="20" value={form.G1} onChange={e => setForm({ ...form, G1: parseInt(e.target.value) })} />
                </div>
                <div className="form-field">
                  <label>G2 — Period 2</label>
                  <input type="number" min="0" max="20" value={form.G2} onChange={e => setForm({ ...form, G2: parseInt(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-predict" disabled={saving} style={{ flex: 1 }}>
                  {saving ? <><span className="btn-spinner"></span>Saving...</> : <><span>💾</span>Save & Predict</>}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={{ flex: 0.5, padding: '0.875rem', borderRadius: '12px', border: '2px solid var(--border, #e2e8f0)', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {[
                ['👤 Name', user?.name || '—'],
                ['📧 Email', user?.email || '—'],
                ['🎓 Role', 'Student'],
                ['📚 Study Time', `${user?.studytime || 2} (${['','<2h','2-5h','5-10h','>10h'][user?.studytime || 2]})`],
                ['❌ Failures', user?.failures ?? 0],
                ['📅 Absences', user?.absences ?? 0],
                ['📝 G1', user?.G1 ?? 0],
                ['📝 G2', user?.G2 ?? 0],
                ['📅 Joined', user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--bg, #f8fafc)', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid var(--border, #e2e8f0)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text, #1e293b)' }}>{String(value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prediction Result */}
      {prediction && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span>🔮</span><h3>Your AI Prediction</h3></div>
            <span className="tag" style={{ background: `${riskColors[riskLevel]}18`, color: riskColors[riskLevel], border: `1px solid ${riskColors[riskLevel]}44` }}>
              {prediction.risk_level?.label}
            </span>
          </div>
          <div className="card-body">
            <div className="stats-grid">
              <div className="stat-card">
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1' }}>{prediction.predicted_score?.toFixed(1)}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted,#64748b)' }}>/20</span></div>
                <span className="stat-name">Predicted Score</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon-large">{prediction.mastery === 1 ? '🏆' : '📖'}</div>
                <span className={`mastery-badge ${prediction.mastery === 1 ? 'mastered' : 'learning'}`}>{prediction.mastery_status}</span>
                <span className="stat-name">Mastery Status</span>
              </div>
              <div className="stat-card" style={{ '--risk-color': riskColors[riskLevel] }}>
                <div className="stat-icon-large">{riskLevel === 'high' ? '🚨' : riskLevel === 'medium' ? '⚠️' : '✅'}</div>
                <span className="risk-pill" style={{ background: `${riskColors[riskLevel]}18`, color: riskColors[riskLevel], border: `1px solid ${riskColors[riskLevel]}44` }}>{prediction.risk_level?.label}</span>
                <span className="stat-name">Risk Level</span>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>{prediction.recommendation?.plan_type}</div>
                <span className="stat-name">Learning Plan</span>
              </div>
            </div>
            {prediction.risk_level?.message && (
              <div className={`alert-banner ${riskLevel === 'none' ? 'none' : riskLevel}`} style={riskLevel === 'none' ? { background: '#dcfce7', color: '#16a34a', borderLeft: '4px solid #10b981' } : {}}>
                {riskLevel === 'high' ? '🚨' : riskLevel === 'medium' ? '⚠️' : '✅'} {prediction.risk_level.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentProfile
