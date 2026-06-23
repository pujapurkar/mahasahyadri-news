'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubAdminRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errors, setErrors] = useState({
    username: '', email: '', mobile: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = { username: '', email: '', mobile: '', password: '', confirmPassword: '' };
    if (!username.trim()) e.username = 'Username is required';
    if (!email.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address';
    }
    if (!mobile.trim()) {
      e.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      e.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (!password.trim()) {
      e.password = 'Password is required';
    } else if (password.length < 8) {
      e.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword.trim()) {
      e.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return !e.username && !e.email && !e.mobile && !e.password && !e.confirmPassword;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
    const res = await fetch('/api/subadmin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, mobile, password }),
      });
      const data = await res.json();
      if (data.status === 'OK') {
        setShowSuccessPopup(true);
      } else {
        alert(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 15px',
    border: `2px solid ${hasError ? '#e74c3c' : '#e1e1e1'}`,
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  });

  const eyeIcon = (visible: boolean) => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {visible ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  );

 
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #1e88e5 0%, #64b5f6 50%, #ffffff 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 50px;
          padding-right:120px;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
       {/* Success Popup */}
{/* Success Popup */}
{showSuccessPopup && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px'
  }}>
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '36px 32px',
      maxWidth: '420px', width: '100%', textAlign: 'center',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      animation: 'slideUp 0.4s ease'
    }}>
      {/* Green Check Icon */}
      <div style={{
        width: '70px', height: '70px', borderRadius: '50%',
        background: '#eaf3de', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px'
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>
        Registration Request Sent!
      </h3>

      {/* Message */}
      <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.7', marginBottom: '8px' }}>
        Your registration request has been successfully submitted to the Admin.
      </p>
      <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.7', marginBottom: '28px' }}>
        Once the Admin <strong>approves</strong> your request, you will receive an <strong>email</strong>.
      </p>

      {/* OK Button */}
      <button
        onClick={() => router.push('/admin/login')}
        style={{
          width: '100%', padding: '12px',
          background: 'linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)',
          color: '#fff', border: 'none', borderRadius: '8px',
          fontSize: '15px', fontWeight: 600, cursor: 'pointer'
        }}
      >
        OK, Got it!
      </button>
    </div>
  </div>
)}

      <div style={{
        width: '140%', maxWidth: '560px', background: 'white',
        padding: '40px 45px', borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.5s ease',
       
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ color: '#333', fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
            Sub Admin Register
          </h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Fill in the details to create your account
          </p>
        </div>

        <form onSubmit={handleRegister}>

          {/* 1. Username */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={inputStyle(!!errors.username)}
              onFocus={e => (e.target.style.borderColor = '#1e88e5')}
              onBlur={e => (e.target.style.borderColor = errors.username ? '#e74c3c' : '#e1e1e1')}
              placeholder="Choose a username"
            />
            {errors.username && (
              <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {errors.username}
              </span>
            )}
          </div>

          {/* 2. Email ID */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
              Email ID
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle(!!errors.email)}
              onFocus={e => (e.target.style.borderColor = '#1e88e5')}
              onBlur={e => (e.target.style.borderColor = errors.email ? '#e74c3c' : '#e1e1e1')}
              placeholder="Enter your email"
            />
            {errors.email && (
              <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* 3. Mobile No */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
              Mobile No
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              style={inputStyle(!!errors.mobile)}
              onFocus={e => (e.target.style.borderColor = '#1e88e5')}
              onBlur={e => (e.target.style.borderColor = errors.mobile ? '#e74c3c' : '#e1e1e1')}
              placeholder="Enter 10-digit mobile number"
            />
            {errors.mobile && (
              <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {errors.mobile}
              </span>
            )}
          </div>

          {/* 4. Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle(!!errors.password), padding: '12px 45px 12px 15px' }}
                onFocus={e => (e.target.style.borderColor = '#1e88e5')}
                onBlur={e => (e.target.style.borderColor = errors.password ? '#e74c3c' : '#e1e1e1')}
                placeholder="Min. 8 characters"
              />
              <span onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666', userSelect: 'none' }}>
                {eyeIcon(showPassword)}
              </span>
            </div>
            {errors.password && (
              <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* 5. Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle(!!errors.confirmPassword), padding: '12px 45px 12px 15px' }}
                onFocus={e => (e.target.style.borderColor = '#1e88e5')}
                onBlur={e => (e.target.style.borderColor = errors.confirmPassword ? '#e74c3c' : '#e1e1e1')}
                placeholder="Re-enter your password"
              />
              <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666', userSelect: 'none' }}>
                {eyeIcon(showConfirmPassword)}
              </span>
            </div>
            {errors.confirmPassword && (
              <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#90caf9' : 'linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '16px', fontWeight: 600, transition: 'all 0.3s', marginTop: '10px',
            }}
            onMouseEnter={e => { if (!loading) { (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 5px 20px rgba(30,136,229,0.4)'; } }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; (e.target as HTMLButtonElement).style.boxShadow = 'none'; }}
          >
            {loading ? 'Registering...' : 'Submit'}
          </button>

          {/* Back to Login */}
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <Link
              href="/admin/login"
              style={{ color: '#1e88e5', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
            >
              Already have an account? Login
            </Link>
          </div>

        </form>
      </div>
    </>
  );
}