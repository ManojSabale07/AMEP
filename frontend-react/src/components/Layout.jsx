import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useAuth } from '../App'
import '../styles/Layout.css'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, role, logout, darkMode, toggleDarkMode, clerkEnabled } = useAuth()
  const location = useLocation()

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
    const item = navItems.find(nav => nav.path === path)
    return item?.label || 'Dashboard'
  }

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo-icon">🎓</span>
          <div className="logo-text">
            <h2>AMEP</h2>
            <span className="role-badge">{role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/student' || item.path === '/teacher'}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <span className="user-name">
              {clerkEnabled && user ? user.firstName : user?.name || 'User'}
            </span>
          </div>
          <button className="btn-logout" onClick={logout}>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="header-right">
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            {clerkEnabled && <UserButton />}
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
