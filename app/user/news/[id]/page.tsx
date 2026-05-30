'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDate, getCurrentDate } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { translations } from '@/lib/translations';

interface NewsDetail {
  Id: number;
  Title: string;
  Content: string;
  Author: string;
  PublishDate: string;
  CategoryName: string;
  Gallery: string[];
}
interface Category {
  CategoryId: number;
  CategoryName: string;
  NameMr: string;
  NameEn: string;
}

export default function UserNewsDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = translations[language] || translations.en;
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aboutModal, setAboutModal] = useState(false);
  const hasFetched = useRef(false);

  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (id && !hasFetched.current) {
      fetchNews();
      fetchCategories();
      hasFetched.current = true;
    }
  }, [id]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.status === 'OK') setCategories(data.data);
    } catch (e) { console.error(e); }
  }

  async function fetchNews() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isAdmin = urlParams.has('admin');
      const apiUrl = isAdmin ? `/api/news/${id}?admin=1` : `/api/news/${id}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.status === 'OK') {
        setNews(data.data);
        if (data.data.Gallery?.length > 0) {
          setMainImage(data.data.Gallery[0]);
        }
      } else {
        router.push('/user/dashboard');
      }
    } catch {
      router.push('/user/dashboard');
    } finally {
      setLoading(false);
    }
  }

  function setMainImg(src: string, idx: number) {
    setMainImage(src);
    setActiveImg(idx);
  }

  async function submitFeedback() {
    if (!feedbackForm.name.trim() || !feedbackForm.email.trim() || !feedbackForm.message.trim()) {
      alert(language === 'mr' ? 'कृपया सर्व माहिती भरा.' : 'Please fill all fields.');
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm),
      });
      const d = await res.json();
      if (d.status === 'OK') {
        alert(language === 'mr' ? '✅ फीडबॅक यशस्वीरित्या पाठवला!' : '✅ Feedback submitted successfully!');
        setFeedbackModal(false);
        setFeedbackForm({ name: '', email: '', message: '' });
      } else {
        alert(language === 'mr' ? '❌ त्रुटी: ' + d.message : '❌ Error: ' + d.message);
      }
    } catch {
      alert(language === 'mr' ? 'काहीतरी चुकले!' : 'Something went wrong!');
    } finally {
      setFeedbackLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#27A4F3', fontSize: '18px' }}>
          {language === 'mr' ? 'लोड होत आहे...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!news) return null;

  const footerYear = language === 'mr'
    ? new Date().getFullYear().toString().split('').map(d =>
        ['०','१','२','३','४','५','६','७','८','९'][parseInt(d)]
      ).join('')
    : new Date().getFullYear().toString();

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans Devanagari','Poppins',sans-serif; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .header { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 15px 0; box-shadow: 0 2px 10px rgba(39,164,243,0.3); }
        .back-link { color: #1e88d4; text-decoration: none; display: inline-block; margin: 20px 0 16px; font-weight: 600; font-size: 14px; }
        .back-link:hover { text-decoration: underline; }
        .news-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 24px; }
        .news-title { font-size: 28px; font-weight: 700; margin-bottom: 12px; line-height: 1.3; color: #111; }
        .news-meta { color: #666; margin-bottom: 20px; font-size: 14px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
        .main-img { width: 100%; max-height: 500px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; display: block; }
        .news-content { font-size: 18px; line-height: 1.8; color: #333; }
        .gallery { margin-top: 24px; display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px; }
        .gallery img { height: 150px; width: 220px; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.15); flex: 0 0 auto; cursor: pointer; transition: all 0.3s; }
        .gallery img:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
        .gallery img.active { outline: 3px solid #27A4F3; }
        .footer { background: linear-gradient(135deg, #1d74bb 0%, #1665a8 100%); color: white; padding: 24px 0; margin-top: 40px; }
        @media (max-width: 768px) {
          .news-title { font-size: 22px; }
          .news-card { padding: 16px; }
          .main-img { max-height: 300px; }
          .gallery img { width: 150px; height: 100px; }
          .news-content { font-size: 16px; }
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/user/dashboard')}>
              🏔️ {t.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span>{getCurrentDate(language)}</span>
              <span>{language === 'mr' ? 'भाषा:' : 'Language:'}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'mr' | 'en')}
                style={{ borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', padding: '2px 6px', cursor: 'pointer', outline: 'none', fontSize: '13px' }}
              >
                <option value="en">English</option>
                <option value="mr">मराठी</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <button
          className="back-link"
          onClick={() => router.push('/user/dashboard')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          &larr; {language === 'mr' ? 'परत मुख्यपृष्ठावर' : 'Back to Home'}
        </button>

        <div className="news-card">
          <h1 className="news-title">{news.Title}</h1>
          <div className="news-meta">
            <span>📅 {formatDate(news.PublishDate, language)}</span>
            <span>|</span>
            <span>👤 {news.Author}</span>
            <span>|</span>
            <span>🏷️ {(() => {
              const cat = categories.find(c => c.CategoryName === news.CategoryName);
              return language === 'mr' ? (cat?.NameMr || news.CategoryName) : (cat?.NameEn || news.CategoryName);
            })()}</span>
          </div>

          {mainImage && (
            <img src={mainImage} alt={news.Title} className="main-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}

              <div
            style={{
              fontSize: '18px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}
            dangerouslySetInnerHTML={{
              __html: news.Content
            }}
          />
          {news.Gallery && news.Gallery.length > 0 && (
            <div className="gallery">
              {news.Gallery.map((src, idx) => (
                <img key={idx} src={src} alt={`Gallery ${idx + 1}`}
                  className={activeImg === idx ? 'active' : ''}
                  onClick={() => setMainImg(src, idx)}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '20px 0' }}>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{t.about}</h3>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>
  {t.aboutDesc}
</p>
              <span
                onClick={() => setAboutModal(true)}
                style={{ color: '#90caf9', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', marginTop: '6px', display: 'inline-block' }}
              >
                 {t.aboutReadMore}
              </span>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{t.contact}</h3>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>{t.email}: mahasahyadri.press@gmail.com</p>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>{t.phone}: +91 9881131059</p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{t.feedback}</h3>
              {/* ✅ Modal open karo — redirect nahi */}
              <a
                href="#"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setFeedbackModal(true); }}
                style={{
                  color: '#fff', textDecoration: 'none', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(255,255,255,0.15)', padding: '8px 16px',
                  borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {language === 'mr' ? 'तुमची प्रतिक्रिया द्या' : 'Give your feedback'}
              </a>
            </div>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '20px', fontSize: '13px', opacity: 0.8 }}>
            © {footerYear} {t.title}. {t.copyright}
          </div>
        </div>
      </div>

      {/* ===== FEEDBACK MODAL ===== */}
      {feedbackModal && (
        <div
          style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, justifyContent: 'center', alignItems: 'center', padding: '12px' }}
          onClick={() => setFeedbackModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>
                  📝 {language === 'mr' ? 'फीडबॅक' : 'Feedback'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                  {language === 'mr' ? 'तुमचा अभिप्राय आम्हाला द्या' : 'Share your feedback with us'}
                </div>
              </div>
              <button
                onClick={() => setFeedbackModal(false)}
                style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '5px', color: '#333' }}>
                  {language === 'mr' ? 'नाव' : 'Name'}
                </label>
                <input
                  type="text" value={feedbackForm.name}
                  onChange={e => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  placeholder={language === 'mr' ? 'तुमचे नाव' : 'Your name'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '5px', color: '#333' }}>
                  {language === 'mr' ? 'ईमेल' : 'Email'}
                </label>
                <input
                  type="email" value={feedbackForm.email}
                  onChange={e => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '5px', color: '#333' }}>
                  {language === 'mr' ? 'संदेश' : 'Message'}
                </label>
                <textarea
                  value={feedbackForm.message}
                  onChange={e => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  placeholder={language === 'mr' ? 'तुमचा अभिप्राय येथे लिहा...' : 'Write your feedback here...'}
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={submitFeedback}
                disabled={feedbackLoading}
                style={{ width: '100%', padding: '12px', background: feedbackLoading ? '#90caf9' : 'linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: feedbackLoading ? 'not-allowed' : 'pointer' }}
              >
                {feedbackLoading
                  ? (language === 'mr' ? 'पाठवत आहे...' : 'Sending...')
                  : (language === 'mr' ? '✔ पाठवा' : '✔ Submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {aboutModal && (
        <div
          style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, justifyContent: 'center', alignItems: 'center', padding: '12px' }}
          onClick={() => setAboutModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%)', color: '#fff', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t.aboutModalTitle}</h3>
              <button onClick={() => setAboutModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
           <div style={{ padding: '20px', overflowY: 'auto', lineHeight: '1.8', fontSize: '14px', color: '#333' }}>
  <p>{t.aboutP1}</p>
  <br />
  <p>{t.aboutP2}</p>
  <br />
  <p>{t.aboutP3}</p>
  <br />
  <p>{t.aboutP4}</p>
  <br />
  <p>{t.aboutP5}</p>
</div>
          </div>
        </div>
      )}
    </div>
  );
}
