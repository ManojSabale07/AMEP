import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import '../styles/Layout.css'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, role, logout, darkMode, toggleDarkMode } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const studentNavItems = [
    { path: '/student', icon: '📊', label: 'Dashboard' },
    { path: '/student/profile', icon: '👤', label: 'My Profile' },
    { path: '/student/learning', icon: '📚', label: 'Learning Path' },
  ]

  const teacherNavItems = [
    { path: '/teacher', icon: '📊', label: 'Dashboard' },
    { path: '/teacher/students', icon: '👥', label: 'Students' },
    { path: '/teacher/analytics', icon: '📈', label: 'Analytics' },
  ]

  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems

  const getPageTitle = () => {
    const path = location.pathname
    const item = navItems.find(nav => path.startsWith(nav.path))
    return item?.label || 'Dashboard'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon">🎓</div>
            {sidebarOpen && (
              <div className="logo-text">
                <h2>AMEP</h2>
                <span className="logo-tagline">AI Learning Platform</span>
              </div>
            )}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div className="role-pill">
          <span className={`role-indicator ${role}`}></span>
          {sidebarOpen && <span className="role-label">{role === 'teacher' ? '👨‍🏫 Teacher' : '📚 Student'}</span>}
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/student' || item.path === '/teacher'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="nav-label">{item.label}</span>}
                  {sidebarOpen && <span className="nav-arrow">›</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            {sidebarOpen && (
              <div className="user-info-text">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="user-email">{user?.email || ''}</span>
              </div>
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div className="header-left">
            <button
              className="menu-toggle mobile-only"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-home">AMEP</span>
              <span className="breadcrumb-sep">›</span>
              <h1>{getPageTitle()}</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="header-time">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
            <button className="theme-toggle" onClick={toggleDarkMode} title="Toggle theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <div className="header-user">
              <div className="header-avatar">{getInitials(user?.name)}</div>
              <span className="header-username">{user?.name?.split(' ')[0] || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
