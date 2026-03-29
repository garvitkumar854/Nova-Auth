import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  getSessions,
  logout,
  logoutAll,
  logoutSession,
  updateFullName,
  updateUsername,
  deleteAccount,
} from '../services/api'
import '../styles/dashboard.css'

const USERNAME_REGEX = /^[a-z0-9_]{3,16}$/

function formatLastActive(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Just Now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function DashboardPage() {
  const shouldReduceMotion = useReducedMotion()
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const firstName = currentUser?.fullName?.split(' ')[0] || 'User'
  const [sessions, setSessions] = useState([])
  const [activeSidebarSession, setActiveSidebarSession] = useState(null)

  const [activePanel, setActivePanel] = useState('')
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isSessionLoading, setIsSessionLoading] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [sessionActionId, setSessionActionId] = useState('')
  const [fullNameInput, setFullNameInput] = useState(currentUser?.fullName || '')
  const [usernameInput, setUsernameInput] = useState(currentUser?.username || '')

  const persistUser = (nextUser) => {
    setCurrentUser(nextUser)
    localStorage.setItem('user', JSON.stringify(nextUser))
  }

  const loadSessions = async () => {
    setIsSessionLoading(true)
    try {
      const response = await getSessions()
      setSessions(Array.isArray(response?.sessions) ? response.sessions : [])
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsSessionLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleUpdateFullName = async (e) => {
    e.preventDefault()
    setStatusMessage('')

    const fullName = fullNameInput.trim()
    if (fullName.length < 2 || fullName.length > 60) {
      setStatusMessage('Full name must be between 2 and 60 characters.')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const response = await updateFullName({ fullName })
      if (response?.user) {
        persistUser(response.user)
      }
      setStatusMessage(response?.message || 'Full name updated successfully.')
      setShowChangeNameForm(false)
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdateUsername = async (e) => {
    e.preventDefault()
    setStatusMessage('')

    const username = usernameInput.trim().toLowerCase()
    if (!USERNAME_REGEX.test(username)) {
      setStatusMessage('Username must be 3-16 characters and use only letters, numbers, or _.')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const response = await updateUsername({ username })
      if (response?.user) {
        persistUser(response.user)
      }
      setStatusMessage(response?.message || 'Username updated successfully.')
      setShowChangeUsernameForm(false)
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleLogoutSession = async (sessionId) => {
    setStatusMessage('')
    setSessionActionId(String(sessionId))

    const target = sessions.find((session) => String(session.id) === String(sessionId))

    try {
      if (target?.status === 'current') {
        await logout()
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/'
        return
      }

      const response = await logoutSession({ sessionId })
      setStatusMessage(response?.message || 'Session logged out successfully.')
      await loadSessions()
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setSessionActionId('')
    }
  }

  const handleLogoutAll = async () => {
    setStatusMessage('')

    try {
      await logoutAll()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/'
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setStatusMessage('')

    if (!deleteAccountPassword.trim()) {
      setStatusMessage('Password is required to delete account.')
      return
    }

    setIsDeletingAccount(true)
    try {
      await deleteAccount({ password: deleteAccountPassword })
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/'
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const hasMultipleSessions = sessions.filter(s => s.status !== 'logged_out').length > 1
  const activeSessions = sessions.filter(s => s.status !== 'logged_out')
  const panelMotion = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2, ease: 'easeOut' } }

  const handleLogoutCurrent = async () => {
    setStatusMessage('')
    try {
      await logout()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/'
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  return (
    <main className="dashboard-page">
      <motion.div
        className="dashboard-card"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div className="dashboard-header">
          <h1>Welcome, {firstName}</h1>
          <p className="dashboard-user-info">Manage your account and security settings</p>
        </div>

        {statusMessage && <p className="dashboard-status-message">{statusMessage}</p>}

        <div className={`dashboard-content ${hasMultipleSessions ? 'with-sessions-sidebar' : ''}`}>
          {/* Left Side - Settings */}
          <aside className="dashboard-sidebar">
            <h2 className="section-title">Account Settings</h2>

            <motion.div className="settings-group" layout>
              <h3 className="setting-label">Profile</h3>

              <button
                className="setting-button"
                onClick={() => setActivePanel((prev) => (prev === 'fullName' ? '' : 'fullName'))}
              >
                <div className="button-text">
                  <span className="button-title">Change Full Name</span>
                  <span className="button-desc">Update your profile name</span>
                </div>
              </button>

              <AnimatePresence initial={false}>
              {activePanel === 'fullName' && (
                <motion.form className="inline-form" onSubmit={handleUpdateFullName} {...panelMotion}>
                  <input
                    type="text"
                    placeholder="Enter new full name"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    required
                  />
                  <div className="form-actions">
                    <button type="submit" className="form-btn form-btn-primary" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="form-btn form-btn-secondary"
                      onClick={() => setActivePanel('')}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
              </AnimatePresence>
            </motion.div>

            <motion.div className="settings-group" layout>
              <button
                className="setting-button"
                onClick={() => setActivePanel((prev) => (prev === 'username' ? '' : 'username'))}
              >
                <div className="button-text">
                  <span className="button-title">Change Username</span>
                  <span className="button-desc">Update your username</span>
                </div>
              </button>

              <AnimatePresence initial={false}>
              {activePanel === 'username' && (
                <motion.form className="inline-form" onSubmit={handleUpdateUsername} {...panelMotion}>
                  <input
                    type="text"
                    placeholder="Enter new username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                  />
                  <div className="form-actions">
                    <button type="submit" className="form-btn form-btn-primary" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="form-btn form-btn-secondary"
                      onClick={() => setActivePanel('')}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
              </AnimatePresence>
            </motion.div>

            <motion.div className="settings-group" layout>
              <h3 className="setting-label">Security</h3>

              <button
                className="setting-button"
                onClick={() => setActivePanel((prev) => (prev === 'password' ? '' : 'password'))}
              >
                <div className="button-text">
                  <span className="button-title">Change Password</span>
                  <span className="button-desc">Update your account password</span>
                </div>
              </button>

              <AnimatePresence initial={false}>
              {activePanel === 'password' && (
                <motion.form className="inline-form" {...panelMotion}>
                  <input type="password" placeholder="Current password" />
                  <input type="password" placeholder="New password" />
                  <input type="password" placeholder="Confirm new password" />
                  <div className="form-actions">
                    <button type="submit" className="form-btn form-btn-primary">
                      Update
                    </button>
                    <button
                      type="button"
                      className="form-btn form-btn-secondary"
                      onClick={() => setActivePanel('')}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
              </AnimatePresence>
            </motion.div>

            <motion.div className="settings-group settings-group-danger" layout>
              <button
                className="setting-button setting-button-danger"
                onClick={() => setActivePanel((prev) => (prev === 'delete' ? '' : 'delete'))}
              >
                <div className="button-text">
                  <span className="button-title">Delete Account</span>
                  <span className="button-desc">Permanently delete your account</span>
                </div>
              </button>

              <AnimatePresence initial={false}>
              {activePanel === 'delete' && (
                <motion.form className="inline-form" onSubmit={handleDeleteAccount} {...panelMotion}>
                  <p className="form-warning">This action cannot be undone. All your data will be permanently deleted.</p>
                  <input 
                    type="password" 
                    placeholder="Enter your password to confirm"
                    value={deleteAccountPassword}
                    onChange={(e) => setDeleteAccountPassword(e.target.value)}
                    required
                  />
                  <div className="form-actions">
                    <button type="submit" className="form-btn form-btn-danger" disabled={isDeletingAccount}>
                      {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </button>
                    <button
                      type="button"
                      className="form-btn form-btn-secondary"
                      onClick={() => {
                        setActivePanel('')
                        setDeleteAccountPassword('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
              </AnimatePresence>
            </motion.div>
          </aside>

          {/* Middle - Sessions List */}
          <section className="dashboard-sessions">
            <h2 className="section-title">All Sessions</h2>
            <p className="sessions-desc">Active devices using your account</p>

            {isSessionLoading && <p className="sessions-desc">Loading sessions...</p>}

            {!isSessionLoading && sessions.length === 0 && (
              <p className="sessions-desc">No sessions found.</p>
            )}

            <div className="sessions-list">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  className={`session-item session-${session.status} ${activeSidebarSession?.id === session.id ? 'active-in-sidebar' : ''}`}
                  onClick={() => hasMultipleSessions && setActiveSidebarSession(session)}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="session-device-icon">
                    {String(session.device || 'D').slice(0, 1).toUpperCase()}
                  </div>

                  <div className="session-info">
                    <div className="session-device">
                      <span className="device-name">
                        {session.browser} on {session.os}
                      </span>
                      {session.status === 'current' && (
                        <span className="session-badge current">Current</span>
                      )}
                      {session.status === 'logged_out' && (
                        <span className="session-badge logged-out">Logged Out</span>
                      )}
                    </div>

                    <div className="session-meta">
                      <span className="meta-item">
                        {session.device} • {session.browser}
                      </span>
                      <span className="meta-item">
                        <span className="meta-label">IP:</span> {session.ipAddress}
                      </span>
                      <span className="meta-item">
                        <span className="meta-label">Last:</span> {formatLastActive(session.lastActive)}
                      </span>
                    </div>
                  </div>

                  {session.status !== 'logged_out' && !hasMultipleSessions && (
                    <button
                      className="session-logout-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLogoutSession(session.id)
                      }}
                      disabled={sessionActionId === String(session.id)}
                    >
                      {sessionActionId === String(session.id) ? 'Processing...' : 'Logout'}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </section>

          {/* Right Side - Sessions Sidebar (Premium) */}
          {hasMultipleSessions && (
            <motion.aside
              className="sessions-sidebar-premium"
              initial={shouldReduceMotion ? false : { opacity: 0, x: 10 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h3 className="sidebar-title">Active Sessions</h3>
              <p className="sidebar-desc">{activeSessions.length} active device{activeSessions.length !== 1 ? 's' : ''}</p>

              <div className="premium-sessions-list">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`premium-session-card ${session.status === 'current' ? 'current-session' : ''} ${activeSidebarSession?.id === session.id ? 'selected' : ''}`}
                    onClick={() => setActiveSidebarSession(session)}
                  >
                    <div className="premium-session-header">
                      <div className="premium-session-icon">
                        {String(session.browser || 'B').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="premium-session-title">
                        <h4>{session.browser}</h4>
                        <p>{session.os}</p>
                      </div>
                      {session.status === 'current' && (
                        <span className="current-badge">Current</span>
                      )}
                    </div>

                    <div className="premium-session-details">
                      <div className="detail-item">
                        <span className="detail-label">Device:</span>
                        <span>{session.device}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">IP:</span>
                        <span className="ip-address">{session.ipAddress}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Active:</span>
                        <span>{formatLastActive(session.lastActive)}</span>
                      </div>

                      {session.status !== 'logged_out' && (
                        <button
                          className="premium-logout-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLogoutSession(session.id)
                          }}
                          disabled={sessionActionId === String(session.id)}
                        >
                          {sessionActionId === String(session.id) ? 'Logging out...' : 'Logout'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </div>

        <div className="dashboard-footer">
          <button className="logout-all-btn" onClick={handleLogoutAll}>
            Logout All Sessions
          </button>
          <button className="logout-cta-btn" onClick={handleLogoutCurrent}>
            Logout
          </button>
        </div>
      </motion.div>
    </main>
  )
}

export default DashboardPage

