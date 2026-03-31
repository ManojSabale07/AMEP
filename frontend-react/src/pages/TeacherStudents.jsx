import React, { useState, useEffect } from 'react'
import { getStudents, addStudent, updateStudentAPI, deleteStudent } from '../services/api'
import '../styles/TeacherDashboard.css'

function TeacherStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [editStudent, setEditStudent] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState(null)
  const [newStudent, setNewStudent] = useState({ name: '', studytime: 2, failures: 0, absences: 0, G1: 10, G2: 10 })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => { loadStudents() }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getStudents()
      setStudents(data.students || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await addStudent(newStudent)
      setShowAdd(false)
      setNewStudent({ name: '', studytime: 2, failures: 0, absences: 0, G1: 10, G2: 10 })
      await loadStudents()
      showToast('Student added!')
    } catch (err) { showToast('Failed to add student', 'error') }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateStudentAPI(editStudent.id, editStudent)
      setEditStudent(null)
      await loadStudents()
      showToast('Student updated!')
    } catch (err) { showToast('Failed to update student', 'error') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return
    try {
      await deleteStudent(id)
      await loadStudents()
      showToast('Student deleted')
    } catch (err) { showToast('Failed to delete student', 'error') }
  }

  const getRiskColor = (level) => ({ high: '#ef4444', medium: '#f59e0b', low: '#3b82f6', none: '#10b981' }[level] || '#94a3b8')

  const sorted = [...students]
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      const risk = s.prediction?.risk_level?.level || 'none'
      const matchRisk = filterRisk === 'all' || risk === filterRisk
      return matchSearch && matchRisk
    })
    .sort((a, b) => {
      let va = a[sortField] ?? (a.prediction?.[sortField] ?? '')
      let vb = b[sortField] ?? (b.prediction?.[sortField] ?? '')
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      return sortDir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1)
    })

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'

  if (loading) return <div className="td-loading"><div className="td-spinner"></div><p>Loading students...</p></div>
  if (error) return <div className="td-error"><div className="error-icon">⚠️</div><h3>Error</h3><p>{error}</p><button className="btn-retry" onClick={loadStudents}>🔄 Retry</button></div>

  return (
    <div className="teacher-dashboard">
      {toast && <div className={`td-toast ${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}

      <div className="td-welcome">
        <div><h2>Student Management 📋</h2><p>{students.length} students total</p></div>
        <button className="btn-add-student" onClick={() => setShowAdd(true)}>+ Add Student</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>📋</span><h3>All Students</h3></div>
          <div className="td-filters">
            <input className="td-search" placeholder="🔍 Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="td-filter-select" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
              <option value="all">All Risks</option>
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
                  {[['name','Name'],['G1','G1'],['G2','G2'],['studytime','Study'],['absences','Absences'],['failures','Failures']].map(([f, label]) => (
                    <th key={f} onClick={() => toggleSort(f)} style={{ cursor: 'pointer', userSelect: 'none' }}>{label}<SortIcon field={f} /></th>
                  ))}
                  <th>Predicted</th><th>Risk</th><th>Mastery</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan="10" className="td-empty">No students found.</td></tr>
                ) : sorted.map(s => {
                  const risk = s.prediction?.risk_level?.level || 'none'
                  return (
                    <tr key={s.id} className={`td-row risk-row-${risk}`}>
                      <td className="td-name">{s.name}</td>
                      <td>{s.G1}</td><td>{s.G2}</td>
                      <td>{s.studytime}</td><td>{s.absences}</td><td>{s.failures}</td>
                      <td><strong>{s.prediction?.predicted_score?.toFixed(1)}</strong></td>
                      <td><span className="risk-chip" style={{ background: `${getRiskColor(risk)}18`, color: getRiskColor(risk), border: `1px solid ${getRiskColor(risk)}44` }}>{s.prediction?.risk_level?.label}</span></td>
                      <td><span className={`badge-mastery ${s.prediction?.mastery === 1 ? 'yes' : 'no'}`}>{s.prediction?.mastery_status}</span></td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-view" onClick={() => setEditStudent({ ...s })}>✏️</button>
                        <button className="btn-view" onClick={() => handleDelete(s.id, s.name)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>🗑️</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editStudent && (
        <div className="modal-backdrop" onClick={() => setEditStudent(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>✏️ Edit — {editStudent.name}</h3><button className="modal-close" onClick={() => setEditStudent(null)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleUpdate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Name</label><input type="text" value={editStudent.name} onChange={e => setEditStudent({ ...editStudent, name: e.target.value })} />
                  </div>
                  {[['studytime','Study Time (1-4)',1,4],['failures','Failures (0-4)',0,4],['absences','Absences (0-93)',0,93],['G1','G1 (0-20)',0,20],['G2','G2 (0-20)',0,20]].map(([k,label,min,max]) => (
                    <div key={k} className="form-field">
                      <label>{label}</label>
                      <input type="number" min={min} max={max} value={editStudent[k]} onChange={e => setEditStudent({ ...editStudent, [k]: parseInt(e.target.value) })} />
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn-predict">💾 Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>➕ Add New Student</h3><button className="modal-close" onClick={() => setShowAdd(false)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleAdd}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Full Name</label><input type="text" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required placeholder="Student name" />
                  </div>
                  {[['studytime','Study Time (1-4)',1,4],['failures','Failures (0-4)',0,4],['absences','Absences (0-93)',0,93],['G1','G1 (0-20)',0,20],['G2','G2 (0-20)',0,20]].map(([k,label,min,max]) => (
                    <div key={k} className="form-field">
                      <label>{label}</label>
                      <input type="number" min={min} max={max} value={newStudent[k]} onChange={e => setNewStudent({ ...newStudent, [k]: parseInt(e.target.value) })} />
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

export default TeacherStudents
