'use client';
import { useState } from 'react';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'reset';
type MsgType = 'success' | 'error' | 'info' | null;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [headerDesc, setHeaderDesc] = useState('Enter your email address to receive OTP');
  const [message, setMessage] = useState<{ type: MsgType; text: string }>({ type: null, text: '' });

  function showMsg(type: MsgType, text: string) {
    setMessage({ type, text });
  }

  // Step 1: Send OTP
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { showMsg('error', 'Email is required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendOTP', email }),
      });
      const data = await res.json();
      if (data.status === 'OK') {
        setStep('otp');
        setHeaderDesc('Enter the OTP sent to your email');
        showMsg('info', data.message);
      } else {
        showMsg('error', data.message);
      }
    } catch {
      showMsg('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) { showMsg('error', 'OTP is required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verifyOTP', email, otp }),
      });
      const data = await res.json();
      if (data.status === 'OK') {
        setStep('reset');
        setHeaderDesc('Set your new password');
        showMsg('success', 'OTP verified successfully! Now set your new password.');
      } else {
        showMsg('error', data.message);
      }
    } catch {
      showMsg('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim()) { showMsg('error', 'New password is required'); return; }
    if (newPassword !== confirmPassword) { showMsg('error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetPassword', email, newPassword }),
      });
      const data = await res.json();
      if (data.status === 'OK') {
        showMsg('success', 'Password reset successfully! Redirecting to login...');
        setTimeout(() => { window.location.href = '/admin/login'; }, 3000);
      } else {
        showMsg('error', data.message);
      }
    } catch {
      showMsg('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 15px',
    border: '2px solid #e1e1e1', borderRadius: '8px',
    fontSize: '15px', outline: 'none', transition: 'all 0.3s',
    fontFamily: 'inherit',
  };

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '14px', cursor: loading ? 'not-allowed' : 'pointer',
    background: loading ? '#90caf9' : 'linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)',
    color: 'white', border: 'none', borderRadius: '8px',
    fontSize: '16px', fontWeight: 600, marginTop: '10px', transition: 'all 0.3s',
  };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #1e88e5 0%, #64b5f6 50%, #ffffff 100%);
          min-height: 100vh; display: flex; align-items: center;
          justify-content: center; padding: 20px;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus { border-color: #1e88e5 !important; box-shadow: 0 0 0 3px rgba(30,136,229,0.1); }
      `}</style>

      <div style={{
        width: '100%', maxWidth: '420px', background: 'white',
        padding: '40px 35px', borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.5s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ color: '#333', fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
            Forgot Password
          </h2>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5 }}>{headerDesc}</p>
        </div>

        {/* Messages */}
        {message.type === 'success' && (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {message.text}
          </div>
        )}
        {message.type === 'error' && (
          <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {message.text}
          </div>
        )}
        {message.type === 'info' && (
          <div style={{ background: '#d1ecf1', border: '1px solid #bee5eb', color: '#0c5460', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', lineHeight: 1.5 }}>
            {message.text}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
                Email Address
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="your@email.com" />
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
                Enter OTP
              </label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={inputStyle} placeholder="6-digit OTP" />
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPass1 ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '45px' }} placeholder="New Password" />
                <span onClick={() => setShowPass1(!showPass1)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPass1 ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                  </svg>
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPass2 ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '45px' }} placeholder="Confirm Password" />
                <span onClick={() => setShowPass2(!showPass2)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPass2 ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                  </svg>
                </span>
              </div>
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/admin/login" style={{ color: '#1e88e5', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </>
  );
}