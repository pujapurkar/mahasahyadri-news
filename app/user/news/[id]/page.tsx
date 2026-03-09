'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMarathiDate, formatMarathiDate } from '@/lib/utils';

interface NewsDetail {
  Id: number;
  Title: string;
  Content: string;
  Author: string;
  PublishDate: string;
  CategoryName: string;
  Gallery: string[];
}

export default function UserNewsDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [mainImage, setMainImage] = useState('');
  const [marathiDate, setMarathiDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setMarathiDate(getMarathiDate());
    if (id) fetchNews();
  }, [id]);

  async function fetchNews() {
    try {
      const res = await fetch(`/api/news/${id}`);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#27A4F3', fontSize: '18px' }}>लोड होत आहे...</div>
      </div>
    );
  }

  if (!news) return null;

  const footerYear = new Date().getFullYear().toString().split('').map(d =>
    ['०','१','२','३','४','५','६','७','८','९'][parseInt(d)]
  ).join('');

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
        .news-content { font-size: 16px; line-height: 1.8; color: #333; }
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
        }
      `}</style>

      <div className="header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/user/dashboard')}>
              🏔️ महासह्याद्री
            </div>
            <div style={{ fontSize: '13px' }}>{marathiDate}</div>
          </div>
        </div>
      </div>

      <div className="container">
        <button
          className="back-link"
          onClick={() => router.push('/user/dashboard')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          &larr; परत मुख्यपृष्ठावर
        </button>

        <div className="news-card">
          <h1 className="news-title">{news.Title}</h1>

          <div className="news-meta">
            <span>📅 {formatMarathiDate(news.PublishDate)}</span>
            <span>|</span>
            <span>👤 {news.Author}</span>
            <span>|</span>
            <span>🏷️ {news.CategoryName}</span>
          </div>

          {mainImage && (
            <img
              src={mainImage}
              alt={news.Title}
              className="main-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          <div
            className="news-content"
            dangerouslySetInnerHTML={{ __html: news.Content }}
          />

          {news.Gallery && news.Gallery.length > 0 && (
            <div className="gallery">
              {news.Gallery.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  className={activeImg === idx ? 'active' : ''}
                  onClick={() => setMainImg(src, idx)}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '20px 0' }}>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>आमच्याबद्दल</h3>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>सह्याद्री निसर्ग बातम्या</p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>संपर्क</h3>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>ईमेल: info@sahyadrinews.com</p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>फीडबॅक</h3>
              <button onClick={() => router.push('/feedback')} style={{ color: '#fff', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                तुमची प्रतिक्रिया द्या
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '20px', fontSize: '13px', opacity: 0.8 }}>
            © {footerYear} सह्याद्री निसर्ग बातम्या. सर्व हक्क राखीव.
          </div>
        </div>
      </div>
    </div>
  );
}