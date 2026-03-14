'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedbackPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [msg, setMsg] = useState({ text: '', color: 'green' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setMsg({ text: 'कृपया सर्व माहिती भरा', color: 'red' });
      return;
    }

    setSubmitting(true);
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      if (data.status === 'OK') {
        setMsg({ text: '✔ तुमचा अभिप्राय यशस्वीरित्या पाठवला गेला! धन्यवाद!', color: 'green' });
        setForm({ name: '', email: '', message: '' });
        
        setTimeout(() => {
          router.push('/user/dashboard');
        }, 2000);
      } else {
        setMsg({ text: 'त्रुटी: ' + data.message, color: 'red' });
      }
    } catch (err) {
      setMsg({ text: 'त्रुटी झाली. कृपया पुन्हा प्रयत्न करा.', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans Devanagari', 'Poppins', sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%); }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 20px; text-align: center; border-radius: 16px 16px 0 0; }
        .card { background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        .label { font-weight: 700; margin-bottom: 8px; display: block; font-size: 14px; color: #333; }
        .input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; font-family: inherit; transition: border 0.3s; }
        .input:focus { outline: none; border-color: #27A4F3; }
        textarea.input { min-height: 120px; resize: vertical; }
        .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
        .btn:hover { transform: translateY(-2px); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .message { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
        .back-link { color: #1e88d4; text-decoration: none; display: inline-block; margin-bottom: 20px; font-weight: 600; }
        @media (max-width: 768px) {
          .container { padding: 12px; }
          .card { padding: 20px; }
        }
      `}</style>

      <div className="container">
        <button
          onClick={() => router.push('/user/dashboard')}
          className="back-link"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px' }}
        >
          &larr; परत मुख्यपृष्ठावर
        </button>

        <div className="header">
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>📝 फीडबॅक</h1>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>तुमचा अभिप्राय आम्हाला द्या</p>
        </div>

        <div className="card">
          {msg.text && (
            <div 
              className="message"
              style={{
                background: msg.color === 'green' ? '#d4edda' : '#f8d7da',
                color: msg.color === 'green' ? '#155724' : '#721c24',
                border: `1px solid ${msg.color === 'green' ? '#c3e6cb' : '#f5c6cb'}`
              }}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">नाव</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="तुमचे नाव"
              />
            </div>

            <div className="form-group">
              <label className="label">ईमेल</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label className="label">संदेश</label>
              <textarea
                className="input"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="तुमचा अभिप्राय येथे लिहा..."
              />
            </div>

            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'पाठवत आहे...' : '✔ पाठवा'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}