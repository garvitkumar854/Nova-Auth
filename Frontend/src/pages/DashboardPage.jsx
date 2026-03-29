import { useState } from 'react'
import '../styles/dashboard.css'

function DashboardPage() {
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Chrome on Windows',
      lastActive: 'Now',
      status: 'current',
      ipAddress: '192.168.1.100',
      location: 'New York, USA',
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      lastActive: '2 hours ago',
      status: 'active',
      ipAddress: '192.168.1.101',
      location: 'New York, USA',
    },
    {
      id: 3,
      device: 'Firefox on Ubuntu',
      lastActive: '1 day ago',
      status: 'active',
      ipAddress: '192.168.1.102',
      location: 'New York, USA',
    },
  ])

  const [showChangeNameForm, setShowChangeNameForm] = useState(false)
  const [showChangeUsernameForm, setShowChangeUsernameForm] = useState(false)
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false)
  const [showDeleteAccountForm, setShowDeleteAccountForm] = useState(false)

  const handleLogoutSession = (sessionId) => {
    const updatedSessions = sessions.map((session) =>
      session.id === sessionId ? { ...session, status: 'logged_out' } : session,
    )
    setSessions(updatedSessions)
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Welcome, John</h1>
          <p className="dashboard-user-info">Manage your account and security settings</p>
        </div>

        <div className="dashboard-content">
          {/* Left Side - Settings */}
          <aside className="dashboard-sidebar">
            <h2 className="section-title">Account Settings</h2>

            <div className="settings-group">
              <h3 className="setting-label">Profile</h3>

              <button
                className="setting-button"
                onClick={() => setShowChangeNameForm(!showChangeNameForm)}
              >
                <div className="button-text">
                  <span className="button-title">Change Full Name</span>
                  <span className="button-desc">Update your profile name</span>
                </div>
              </button>

              {showChangeNameForm && (
                <form className="inline-form">
                  <input type="text" placeholder="Enter new full name" defaultValue="John Doe" />
                  <div className="form-actions">
                    <button type="submit" className="form-btn form-btn-primary">
                      Save
                    </button>
                    <button
                      type="button"
                      className="form-btn form-btn-secondary"
                      onClick={() => setShowChangeNameForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="settings-group">
              <button
                className="setting-button"
                onClick={() => setShowChangeUsernameForm(!showChangeUsernameForm)}
              >
                <div className="button-text">
                  <span className="button-title">Change Username</span>
                  <span className="button-desc">Update your username</span>
                </div>
              </button>

              {showChangeUsernameForm && (
                <form className="inline-form">
                  <input type="text" placeholder="Enter new username" defaultValue="johndoe" />
                  <div className="form-actions">
                    <button type="submit" className="form-btn form-btn-primary">
                      Save
                    </button>
                    <button
                      type="button"
                      className="form-btn form-btn-secondary"
                      onClick={() => setShowChangeUsernameForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="settings-group">
              <h3 className="setting-label">Security</h3>

              <button
                className="setting-button"
                onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
              >
                <div className="button-text">
                  <span className="button-title">Change Password</span>
                  <span className="button-desc">Update your account password</span>
                </div>
              </button>

              {showChangePasswordForm && (
                <form className="inline-form">
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
                      onClick={() => setShowChangePasswordForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="settings-group settings-group-danger">
              <button
                className="setting-button setting-button-danger"
                onClick={() => setShowDeleteAccountForm(!showDeleteAccountForm)}
              >
                <div className="button-text">
                  <span className="button-title">Delete Account</span>
                  <span className="button-desc">Permanently delete your account</span>
                </div>
              </button>

              {showDeleteAccountForm && (
                <form className="inline-form">
                  <p className="form-warning">This action cannot be undone. All your data will be permanently deleted.</p>
                  <input type="password" placeholder="Enter your password to confirm" />
                  <div className="form-actions">
                    <button type="submit" className="form-btn form-btn-danger">
                      Delete Account
                    </button>
                    <button
                      type="button"
                      className="form-btn form-btn-secondary"
                      onClick={() => setShowDeleteAccountForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </aside>

          {/* Right Side - Sessions */}
          <section className="dashboard-sessions">
            <h2 className="section-title">Manage Sessions</h2>
            <p className="sessions-desc">Active devices using your account</p>

            <div className="sessions-list">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-item session-${session.status}`}
                >
                  <div className="session-device-icon">
                    {session.device.includes('Chrome') && 'C'}
                    {session.device.includes('Safari') && 'S'}
                    {session.device.includes('Firefox') && 'F'}
                  </div>

                  <div className="session-info">
                    <div className="session-device">
                      <span className="device-name">{session.device}</span>
                      {session.status === 'current' && (
                        <span className="session-badge current">Current</span>
                      )}
                      {session.status === 'logged_out' && (
                        <span className="session-badge logged-out">Logged Out</span>
                      )}
                    </div>

                    <div className="session-meta">
                      <span className="meta-item">
                        <span className="meta-label">Location:</span> {session.location}
                      </span>
                      <span className="meta-item">
                        <span className="meta-label">IP:</span> {session.ipAddress}
                      </span>
                      <span className="meta-item">
                        <span className="meta-label">Last active:</span> {session.lastActive}
                      </span>
                    </div>
                  </div>

                  {session.status !== 'logged_out' && (
                    <button
                      className="session-logout-btn"
                      onClick={() => handleLogoutSession(session.id)}
                    >
                      Logout
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-footer">
          <button className="logout-all-btn">
            Logout All Sessions
          </button>
          <a href="/" className="back-link">
            Back to Login
          </a>
        </div>
      </div>
    </main>
  )
}

export default DashboardPage
