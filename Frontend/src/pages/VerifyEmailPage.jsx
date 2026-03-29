import AuthShell from '../components/AuthShell'
import OTPInput from '../components/OTPInput'
import '../styles/auth-ui.css'

function VerifyEmailPage() {
  return (
    <AuthShell>
      <h1>Confirm Your Email</h1>
      <p className="subtitle">Enter the OTP code sent to your inbox to complete account verification.</p>

      <form className="register-form" onSubmit={(e) => e.preventDefault()}>
        <OTPInput />
        <button type="submit">Verify Email</button>
      </form>

      <p className="otp-resend-text">Didn&apos;t receive the code? <button type="button" className="switch-link">Resend OTP</button></p>
      <p className="test-route-note">
        <a href="/" className="route-link">Back to login/register</a>
      </p>
    </AuthShell>
  )
}

export default VerifyEmailPage
