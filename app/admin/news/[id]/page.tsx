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
  const [aboutModal, setAboutModal] = useState(false);
  const footerYear = new Date().getFullYear();

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

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
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px'
      }}>
  <span style={{ whiteSpace: 'nowrap' }}>{getCurrentDate(language)}</span>
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <span>{language === 'mr' ? 'भाषा:' : 'Language:'}</span>
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as 'mr' | 'en')}
      style={{
        padding: '4px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        color: '#000',
        cursor: 'pointer',
        outline: 'none'
      }}
    >
      <option value="mr">मराठी</option>
      <option value="en">English</option>
    </select>
  </div>
</div>
        </div>
      </div>


      {/* MAIN CONTENT */}
      <div style={{ flex: 1 }}>
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
            
            <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
             {news.Title}
            </h1>

            <div style={{
              color: '#666',
              marginBottom: '20px',
              fontSize: '16px'
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
    fontSize: '18px',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap'
  }}
  dangerouslySetInnerHTML={{
    __html: news.Content
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


   <footer
  style={{
    background: '#1976d2',
    color: '#fff',
    padding: '30px 0 16px',
    marginTop: '10px',
  }}
>
  <div
    style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '0 60px',
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1.2fr',  // ← About wide, Feedback narrow
      gap: '60px',                             // ← columns दूर
      marginBottom: '24px',
    }}
  >
    {/* About */}
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
        {translations[language].about}
      </h3>
     <p style={{ fontSize: '13px', lineHeight: '1.65', opacity: 0.9 }}>
  {translations[language].aboutDesc}
</p>
      <span
        onClick={() => setAboutModal(true)}
        style={{ color: '#90caf9', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', marginTop: '6px', display: 'inline-block' }}
     >
   {translations[language].aboutReadMore}
</span>
    </div>

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
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{translations[language].aboutModalTitle}</h3>
            <button onClick={() => setAboutModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', lineHeight: '1.8', fontSize: '14px', color: '#333' }}>
  <p>{translations[language].aboutP1}</p>
  <br />
  <p>{translations[language].aboutP2}</p>
  <br />
  <p>{translations[language].aboutP3}</p>
  <br />
  <p>{translations[language].aboutP4}</p>
  <br />
  <p>{translations[language].aboutP5}</p>
</div>
        </div>
      </div>
    )}

    {/* Contact */}
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
        {translations[language].contact}
      </h3>
      <p style={{ fontSize: '13px', lineHeight: '1.8', opacity: 0.9 }}>
        {translations[language].email}: mahasahyadri.press@gmail.com
      </p>
      <p style={{ fontSize: '13px', lineHeight: '1.8', opacity: 0.9 }}>
        {translations[language].phone}: +91 9881131059
      </p>
    </div>

<div>
  <h3
    style={{
      fontSize: '14px',
      fontWeight: 600,
      marginBottom: '8px',
      color: '#fff',
    }}
  >
    Follow Us
  </h3>

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      whiteSpace: 'nowrap',
    }}
  >
    <a
      href="#"
      style={{
        color: '#fff',
        textDecoration: 'none',
        opacity: 0.9,
      }}
    >
      Facebook •
    </a>

    <a
      href="#"
      style={{
        color: '#fff',
        textDecoration: 'none',
        opacity: 0.9,
      }}
    >
      Instagram •
    </a>

    <a
      href="#"
      style={{
        color: '#fff',
        textDecoration: 'none',
        opacity: 0.9,
      }}
    >
      Twitter
    </a>
  </div>
</div>
  </div>

  {/* Copyright */}
  <div
    style={{
      textAlign: 'center',
      fontSize: '13px',
      opacity: 0.88,
      paddingTop: '12px',
    }}
  >
    © 2026 {translations[language].title}. {translations[language].copyright}
  </div>
</footer>

    </div>
  );
}