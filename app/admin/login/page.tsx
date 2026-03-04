'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = { username: '', password: '' };
    if (!username.trim()) e.username = 'Username is required';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return !e.username && !e.password;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === 'OK') {
        router.push('/admin/dashboard');
      } else {
        alert('Invalid username or password. Please try again.');
        setPassword('');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
          padding: 20px;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        width: '100%', maxWidth: '420px', background: 'white',
        padding: '40px 35px', borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.5s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ color: '#333', fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
            Admin Login
          </h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Enter your credentials to access admin panel
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%', padding: '12px 15px',
                  border: `2px solid ${errors.username ? '#e74c3c' : '#e1e1e1'}`,
                  borderRadius: '8px', fontSize: '15px',
                  outline: 'none', transition: 'all 0.3s',
                }}
                onFocus={e => e.target.style.borderColor = '#1e88e5'}
                onBlur={e => e.target.style.borderColor = errors.username ? '#e74c3c' : '#e1e1e1'}
                placeholder="Username"
              />
            </div>
            {errors.username && (
              <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {errors.username}
              </span>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 45px 12px 15px',
                  border: `2px solid ${errors.password ? '#e74c3c' : '#e1e1e1'}`,
                  borderRadius: '8px', fontSize: '15px',
                  outline: 'none', transition: 'all 0.3s',
                }}
                onFocus={e => e.target.style.borderColor = '#1e88e5'}
                onBlur={e => e.target.style.borderColor = errors.password ? '#e74c3c' : '#e1e1e1'}
                placeholder="Password"
              />
              {/* Eye Toggle */}
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '15px', top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer',
                  color: '#666', userSelect: 'none',
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </>
                  )}
                </svg>
              </span>
            </div>
            {errors.password && (
              <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Login Button */}
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
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Forgot Password */}
          <div style={{ textAlign: 'right', marginTop: '15px' }}>
            <Link href="/admin/forgot-password" style={{ color: '#1e88e5', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}