import { useMemo, useState } from 'react'
import AuthShell from '../components/AuthShell'
import OTPInput from '../components/OTPInput'
import { verifyEmail } from '../services/api'
import '../styles/auth-ui.css'

function VerifyEmailPage() {
  const pendingEmail = useMemo(() => localStorage.getItem('pendingVerificationEmail') || '', [])
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  const handleVerify = async (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })

    if (!pendingEmail) {
      setStatus({ type: 'error', text: 'No pending verification email found. Please register first.' })
      return
    }

    if (otp.length !== 6) {
      setStatus({ type: 'error', text: 'Please enter the full 6-digit OTP.' })
      return
    }

    setIsSubmitting(true)
    try {
      await verifyEmail({ email: pendingEmail, otp })
      localStorage.removeItem('pendingVerificationEmail')
      setStatus({ type: 'success', text: 'Email verified successfully. Please login.' })
      window.location.href = '/'
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <h1>Confirm Your Email</h1>
      <p className="subtitle">Enter the OTP code sent to your inbox to complete account verification.</p>

      {pendingEmail && <p className="verify-email-note">Code sent to {pendingEmail}</p>}

      <form className="register-form" onSubmit={handleVerify}>
        <OTPInput onOtpChange={setOtp} />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      {status.text && <p className={`form-status ${status.type}`}>{status.text}</p>}

      <p className="otp-resend-text">
        Didn&apos;t receive the code? Check spam or register again.
      </p>
      <p className="test-route-note">
        <a href="/" className="route-link">Back to login/register</a>
      </p>
    </AuthShell>
  )
}

export default VerifyEmailPage
