'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMarathiDate, formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { getCurrentDate } from '@/lib/utils';
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

export default function AdminNewsDetailPage() {

  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {

    if (id) {
      fetchNews();
    }
  }, [id]);

  async function fetchNews() {
    try {

      // 👇 admin parameter add
      const res = await fetch(`/api/news/${id}?admin=1`);

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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ color: '#27A4F3', fontSize: '18px' }}>
        {language === 'mr' ? 'लोड होत आहे...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg,#27A4F3,#1e88d4)',
        color: 'white',
        padding: '15px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: 'auto',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div
            style={{ fontSize: '22px', fontWeight: 700, cursor: 'pointer' }}
            onClick={() => router.push('/admin/dashboard')}
          >
            🏔️ महासह्याद्री (Admin)
          </div>

          <div style={{
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
}}>
  <span>{getCurrentDate(language)}</span>

 <span>{language === 'mr' ? 'भाषा:' : 'Language:'}</span>
  <select
    value={language}
    onChange={(e) => setLanguage(e.target.value as 'mr' | 'en')}
    style={{
      padding: '4px',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer'
    }}
  >
    <option value="mr">Marathi</option>
    <option value="en">English</option>
  </select>
</div>
        </div>
      </div>


      <div style={{ maxWidth: '1200px', margin: 'auto', padding: '20px' }}>

        {/* BACK BUTTON */}
        <button
          onClick={() => router.push('/admin/dashboard')}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#1e88d4',
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: '15px'
          }}
        >
         ← {language === 'mr' ? 'ॲडमिन डॅशबोर्ड' : 'Admin Dashboard'}
        </button>


        {/* NEWS CARD */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>
            {language === 'mr' ? news.Title : "This is English Title"}
          </h1>

          <div style={{
            color: '#666',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
             📅 {formatDate(news.PublishDate, language)} |
            👤 {language === 'mr' ? news.Author : "Author"} |
           🏷️ {translations[language].allNews}
          </div>


          {mainImage && (
            <img
              src={mainImage}
              style={{
                width: '100%',
                maxHeight: '500px',
                objectFit: 'cover',
                borderRadius: '10px',
                marginBottom: '20px'
              }}
            />
          )}


          <div
            style={{
              fontSize: '16px',
              lineHeight: '1.8'
            }}
dangerouslySetInnerHTML={{
  __html: language === 'mr' ? news.Content : "This is English Content"
}}
          />


          {/* GALLERY */}
          {news.Gallery && news.Gallery.length > 0 && (

            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '10px',
              overflowX: 'auto'
            }}>

              {news.Gallery.map((src, idx) => (

                <img
                  key={idx}
                  src={src}
                  onClick={() => setMainImg(src, idx)}
                  style={{
                    height: '120px',
                    width: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: activeImg === idx ? '3px solid #27A4F3' : ''
                  }}
                />

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}