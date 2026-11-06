import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'
import PasswordReset from './components/PasswordReset'
import Home from './components/Home'
import StaffLogin from './components/StaffLogin'
import StaffSignup from './components/StaffSignup'
import StaffDashboard from './components/StaffDashboard'
import AdminLogin from './components/AdminLogin'
import AdminSignup from './components/AdminSignup'
import AdminDashboard from './components/AdminDashboard'
import CreateAccount from './components/CreateAccount'
import './App.css'
import { useAuth } from './context/AuthContext'

/**
 * Navigation Views:
 *  home            – SmartCanteen Home Page  (DEFAULT on app start)
 *  create-account  – Role selection page (Student/Faculty/Staff/Admin)
 *  login           – Student/Faculty login
 *  signup          – Student/Faculty registration (shared, role passed as prop)
 *  forgot-password – Password reset
 *  staff-login     – Separate Staff login
 *  staff-signup    – Separate Staff registration
 *  staff-dashboard – Staff dashboard (protected)
 *  admin-login     – Separate Admin login
 *  admin-signup    – Separate Admin registration
 */

function App() {
  // ── Theme ──────────────────────────────────────────────────────────
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('canteen_theme')
    if (savedTheme) return savedTheme
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }

  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('canteen_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // ── View / Routing ─────────────────────────────────────────────────
  /**
   * Map URL paths to view names.
   * The app always opens the Home page by default ('/').
   * Registration and Login are only opened on user action.
   */
  const getInitialView = () => {
    const path = window.location.pathname.toLowerCase()
    if (path === '/login') return 'login'
    if (path === '/signup') return 'signup'
    if (path === '/create-account') return 'create-account'
    if (path === '/forgot-password' || path === '/reset-password') return 'forgot-password'
    if (path === '/staff-login') return 'staff-login'
    if (path === '/staff-signup') return 'staff-signup'
    if (path === '/staff-dashboard') return 'staff-dashboard'
    if (path === '/staff-tasks') return 'staff-tasks'
    if (path === '/admin-login') return 'admin-login'
    if (path === '/admin-signup') return 'admin-signup'
    if (path === '/admin-dashboard') return 'admin-dashboard'
    if (path === '/admin-tasks') return 'admin-tasks'
    // Always default to home page — fixes the bug where staff-signup was opening first
    return 'home'
  }

  const [currentView, setCurrentView] = useState(getInitialView)

  // Track the selected signup role (STUDENT or FACULTY) coming from CreateAccount
  const [signupRole, setSignupRole] = useState('STUDENT')

  // ── Auth ──────────────────────────────────────────────────────────
  const { user, loading: authLoading } = useAuth()

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase()
      if (path === '/login') setCurrentView('login')
      else if (path === '/signup') setCurrentView('signup')
      else if (path === '/create-account') setCurrentView('create-account')
      else if (path === '/forgot-password' || path === '/reset-password') setCurrentView('forgot-password')
      else if (path === '/staff-login') setCurrentView('staff-login')
      else if (path === '/staff-signup') setCurrentView('staff-signup')
      else if (path === '/staff-dashboard') setCurrentView('staff-dashboard')
      else if (path === '/staff-tasks') setCurrentView('staff-tasks')
      else if (path === '/admin-login') setCurrentView('admin-login')
      else if (path === '/admin-signup') setCurrentView('admin-signup')
      else if (path === '/admin-dashboard') setCurrentView('admin-dashboard')
      else if (path === '/admin-tasks') setCurrentView('admin-tasks')
      else setCurrentView('home')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Protect staff-dashboard & staff-tasks: only STAFF and ADMIN can access it
  useEffect(() => {
    if (authLoading) return
    if (currentView === 'staff-dashboard' || currentView === 'staff-tasks') {
      if (!user) {
        navigateTo('staff-login')
      } else if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
        navigateTo('staff-login')
      }
    }
  }, [authLoading, user, currentView])

  // Protect admin-dashboard & admin-tasks: only ADMIN can access it (Task S.6 & S.4)
  useEffect(() => {
    if (authLoading) return
    if (currentView === 'admin-dashboard' || currentView === 'admin-tasks') {
      if (!user) {
        navigateTo('admin-login')
      } else if (user.role !== 'ADMIN') {
        navigateTo('admin-login')
      }
    }
  }, [authLoading, user, currentView])

  // ── Navigation ────────────────────────────────────────────────────
  const pathMap = {
    home: '/',
    'create-account': '/create-account',
    login: '/login',
    signup: '/signup',
    'forgot-password': '/forgot-password',
    'staff-login': '/staff-login',
    'staff-signup': '/staff-signup',
    'staff-dashboard': '/staff-dashboard',
    'staff-tasks': '/staff-tasks',
    'admin-login': '/admin-login',
    'admin-signup': '/admin-signup',
    'admin-dashboard': '/admin-dashboard',
    'admin-tasks': '/admin-tasks',
  }

  const navigateTo = (view) => {
    const targetPath = pathMap[view] || '/'
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath)
    }
    setCurrentView(view)
  }

  // ── Success handlers ──────────────────────────────────────────────
  const handleLoginSuccess = () => {
    navigateTo('home')
  }

  const handleSignupSuccess = () => {
    navigateTo('login')
  }

  const handleStaffLoginSuccess = () => {
    navigateTo('staff-dashboard')
  }

  /**
   * After Admin login → redirect to Admin Dashboard (Task S.6).
   */
  const handleAdminLoginSuccess = () => {
    navigateTo('admin-dashboard')
  }

  const handleStaffLogout = () => {
    navigateTo('staff-login')
  }

  const handleAdminLogout = () => {
    navigateTo('admin-login')
  }

  // ── Loading spinner ───────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, border: '3px solid rgba(34,197,94,0.2)',
          borderTopColor: '#22c55e', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Loading Smart Canteen…</span>
      </div>
    )
  }

  return (
    <div className="app-root">

      {/* ══════════════════════════════════════
          HOME PAGE  (default view on app start)
      ══════════════════════════════════════ */}
      {currentView === 'home' && (
        <Home
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigateToLogin={() => navigateTo('login')}
          onNavigateToSignup={() => navigateTo('create-account')}   
          onNavigateToStaffLogin={() => navigateTo('staff-login')}
          onNavigateToStaffDashboard={() => navigateTo('staff-dashboard')}
          onNavigateToAdminDashboard={() => navigateTo('admin-dashboard')}
        />
      )}

      {/* ══════════════════════════════════════
          CREATE ACCOUNT – Role Selection Page
          Home → Register → here → pick role
      ══════════════════════════════════════ */}
      {currentView === 'create-account' && (
        <CreateAccount
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectStudentFaculty={(role) => {
            setSignupRole(role)          // remember which role the user chose
            navigateTo('signup')
          }}
          onSelectStaff={() => navigateTo('staff-signup')}
          onSelectAdmin={() => navigateTo('admin-signup')}
          onBackToHome={() => navigateTo('login')}
        />
      )}

      {/* ══════════════════════════════════════
          STUDENT / FACULTY LOGIN  (shared)
      ══════════════════════════════════════ */}
      {currentView === 'login' && (
        <Login
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchToSignup={() => navigateTo('create-account')}
          onForgotPassword={() => navigateTo('forgot-password')}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToStaffLogin={() => navigateTo('staff-login')}
          onNavigateToAdminLogin={() => navigateTo('admin-login')}
        />
      )}

      {/* ══════════════════════════════════════
          STUDENT / FACULTY SIGNUP  (shared)
          Role determined by signupRole state
      ══════════════════════════════════════ */}
      {currentView === 'signup' && (
        <Signup
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchToLogin={() => navigateTo('login')}
          onSignupSuccess={handleSignupSuccess}
          onNavigateToStaffSignup={() => navigateTo('staff-signup')}
          initialRole={signupRole}    
        />
      )}

      {/* ══════════════════════════════════════
          PASSWORD RESET
      ══════════════════════════════════════ */}
      {currentView === 'forgot-password' && (
        <PasswordReset
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchToLogin={() => navigateTo('login')}
        />
      )}

      {/* ══════════════════════════════════════
          STAFF LOGIN  (separate)
      ══════════════════════════════════════ */}
      {currentView === 'staff-login' && (
        <StaffLogin
          theme={theme}
          onToggleTheme={toggleTheme}
          onLoginSuccess={handleStaffLoginSuccess}
          onSwitchToSignup={() => navigateTo('staff-signup')}
          onSwitchToMainLogin={() => navigateTo('login')}
          onForgotPassword={() => navigateTo('forgot-password')}
        />
      )}

      {/* ══════════════════════════════════════
          STAFF SIGNUP  (separate)
      ══════════════════════════════════════ */}
      {currentView === 'staff-signup' && (
        <StaffSignup
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchToLogin={() => navigateTo('staff-login')}
          onSwitchToMainLogin={() => navigateTo('login')}
        />
      )}

      {/* ══════════════════════════════════════
          STAFF DASHBOARD & TASKS  (protected)
      ══════════════════════════════════════ */}
      {(currentView === 'staff-dashboard' || currentView === 'staff-tasks') && (
        <StaffDashboard
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleStaffLogout}
          onNavigateToHome={() => navigateTo('home')}
          initialTab={currentView === 'staff-tasks' ? 'tasks' : 'inventory'}
        />
      )}

      {/* ══════════════════════════════════════
          ADMIN LOGIN  (separate)
      ══════════════════════════════════════ */}
      {currentView === 'admin-login' && (
        <AdminLogin
          theme={theme}
          onToggleTheme={toggleTheme}
          onLoginSuccess={handleAdminLoginSuccess}
          onSwitchToLogin={() => navigateTo('login')}
          onSwitchToSignup={() => navigateTo('admin-signup')}
        />
      )}

      {/* ══════════════════════════════════════
          ADMIN SIGNUP  (separate)
      ══════════════════════════════════════ */}
      {currentView === 'admin-signup' && (
        <AdminSignup
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchToLogin={() => navigateTo('admin-login')}
          onSwitchToMain={() => navigateTo('create-account')}
        />
      )}

      {/* ══════════════════════════════════════
          ADMIN DASHBOARD & TASKS  (protected)
      ══════════════════════════════════════ */}
      {(currentView === 'admin-dashboard' || currentView === 'admin-tasks') && (
        <AdminDashboard
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleAdminLogout}
          onNavigateToHome={() => navigateTo('home')}
          initialTab={currentView === 'admin-tasks' ? 'tasks' : 'students'}
        />
      )}

    </div>
  )
}

export default App
