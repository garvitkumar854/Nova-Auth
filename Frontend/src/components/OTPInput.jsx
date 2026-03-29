import { useState, useRef } from 'react'

function OTPInput() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '')
    const digits = paste.slice(0, 6).split('')
    const newOtp = [...otp]
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit
    })
    setOtp(newOtp)
    const nextEmptyIndex = newOtp.findIndex((d) => d === '')
    if (nextEmptyIndex >= 0) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  return (
    <div className="otp-input-container">
      <div className="otp-input-group">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="otp-digit-input"
            placeholder="•"
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      <p className="otp-helper-text">Enter the 6-digit code from your email</p>
    </div>
  )
}

export default OTPInput
