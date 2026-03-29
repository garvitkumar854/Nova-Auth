import { useState } from 'react'
import AuthShell from '../components/AuthShell'
import { login, register } from '../services/api'
import '../styles/auth-ui.css'

const USERNAME_REGEX = /^[a-z0-9_]{3,16}$/
const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/

function AuthPage() {
  const [mode, setMode] = useState('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  })
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
  })

  const onRegisterChange = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }))
  }

  const onLoginChange = (field, value) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })

    const fullName = registerForm.fullName.trim()
    const username = registerForm.username.trim().toLowerCase()
    const email = registerForm.email.trim().toLowerCase()

    if (fullName.length < 2 || fullName.length > 60) {
      setStatus({ type: 'error', text: 'Full name must be between 2 and 60 characters.' })
      return
    }

    if (!USERNAME_REGEX.test(username)) {
      setStatus({ type: 'error', text: 'Username must be 3-16 characters and use only letters, numbers, or _.' })
      return
    }

    if (!EMAIL_REGEX.test(email)) {
      setStatus({ type: 'error', text: 'Please provide a valid email address.' })
      return
    }

    if (registerForm.password.length < 8) {
      setStatus({ type: 'error', text: 'Password must be at least 8 characters long.' })
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        fullName,
        username,
        email,
        password: registerForm.password,
      })
      localStorage.setItem('pendingVerificationEmail', email)
      setStatus({ type: 'success', text: 'Registration successful. Please verify your email.' })
      window.location.href = '/verify-email'
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })

    const identifier = loginForm.identifier.trim()

    if (!identifier) {
      setStatus({ type: 'error', text: 'Email or username is required.' })
      return
    }

    if (identifier.includes('@') && !EMAIL_REGEX.test(identifier.toLowerCase())) {
      setStatus({ type: 'error', text: 'Please provide a valid email address.' })
      return
    }

    if (!identifier.includes('@') && !USERNAME_REGEX.test(identifier.toLowerCase())) {
      setStatus({ type: 'error', text: 'Please provide a valid username.' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await login({
        email: identifier.includes('@') ? identifier.toLowerCase() : '',
        username: identifier.includes('@') ? '' : identifier.toLowerCase(),
        password: loginForm.password,
      })

      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken)
      }
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      setStatus({ type: 'success', text: 'Login successful. Redirecting...' })
      window.location.href = '/'
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell>
      {mode === 'register' ? (
        <>
          <h1>Create your account</h1>
          <p className="subtitle">Simple, secure, and ready to use.</p>

          <form className="register-form" onSubmit={handleRegister}>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={registerForm.fullName}
              onChange={(e) => onRegisterChange('fullName', e.target.value)}
              required
            />

            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="user_test"
              value={registerForm.username}
              onChange={(e) => onRegisterChange('username', e.target.value)}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={registerForm.email}
              onChange={(e) => onRegisterChange('email', e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={registerForm.password}
              onChange={(e) => onRegisterChange('password', e.target.value)}
              minLength={8}
              required
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="switch-text">
            Already have an account?{' '}
            <button type="button" className="switch-link" onClick={() => setMode('login')}>
              Login
            </button>
          </p>
        </>
      ) : (
        <>
          <h1>Login to continue</h1>
          <p className="subtitle">Enter your credentials to access your account.</p>

          <form className="register-form" onSubmit={handleLogin}>
            <label htmlFor="loginEmail">Email or Username</label>
            <input
              id="loginEmail"
              type="text"
              placeholder="you@example.com or username"
              value={loginForm.identifier}
              onChange={(e) => onLoginChange('identifier', e.target.value)}
              required
            />

            <label htmlFor="loginPassword">Password</label>
            <input
              id="loginPassword"
              type="password"
              placeholder="Enter password"
              value={loginForm.password}
              onChange={(e) => onLoginChange('password', e.target.value)}
              required
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="switch-text">
            Don&apos;t have an account?{' '}
            <button type="button" className="switch-link" onClick={() => setMode('register')}>
              Register
            </button>
          </p>
        </>
      )}

      {status.text && <p className={`form-status ${status.type}`}>{status.text}</p>}

      <p className="test-route-note">
        UI testing routes:{' '}
        <a href="/verify-email" className="route-link">
          Verify email
        </a>
        {' • '}
        <a href="/dashboard" className="route-link">
          Dashboard
        </a>
      </p>
    </AuthShell>
  )
}

export default AuthPage
