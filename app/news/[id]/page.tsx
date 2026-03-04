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

export default function NewsDetailsPage() {
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
        router.push('/admin/dashboard');
      }
    } catch {
      router.push('/admin/dashboard');
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

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans Devanagari','Poppins',sans-serif; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 15px 0; }
        .back-link { color: #1e88d4; text-decoration: none; display: inline-block; margin-bottom: 16px; }
        .news-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .news-title { font-size: 26px; font-weight: 700; margin-bottom: 10px; }
        .main-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin: 16px 0; }
        .gallery { display: flex; gap: 12px; overflow-x: auto; margin-top: 20px; }
        .gallery img { height: 120px; width: 180px; border-radius: 8px; object-fit: cover; cursor: pointer; flex: 0 0 auto; }
        .gallery img.active { outline: 3px solid #27A4F3; }
      `}</style>

      <div className="header">
        <div className="container">
          <div style={{ fontSize: '24px', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/admin/dashboard')}>
            🏔️ महासह्याद्री
          </div>
        </div>
      </div>

      <div className="container">
        <a href="/admin/dashboard" className="back-link" onClick={e => { e.preventDefault(); router.push('/admin/dashboard'); }}>
          ← परत बातम्यांकडे
        </a>

        <div className="news-card">
          <h1 className="news-title">{news.Title}</h1>
          <div style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>
            📅 {formatMarathiDate(news.PublishDate)} | 👤 {news.Author} | 🏷️ {news.CategoryName}
          </div>

          {mainImage && <img src={mainImage} alt={news.Title} className="main-img" />}

          <div dangerouslySetInnerHTML={{ __html: news.Content }} />

          {news.Gallery && news.Gallery.length > 0 && (
            <div className="gallery">
              {news.Gallery.map((src, idx) => (
                <img key={idx} src={src} alt="" className={activeImg === idx ? 'active' : ''} onClick={() => setMainImg(src, idx)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}