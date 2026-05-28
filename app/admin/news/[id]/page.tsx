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
            
            <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>
             {news.Title}
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
        सह्याद्रीचा अतिविशाल वारसा आणि समृद्ध निसर्ग संस्कृतीचा विचार करता तमाम सह्यप्रेमींकरीता एक समर्पित डिजिटल मंचची गरज होती...
      </p>
      <span
        onClick={() => setAboutModal(true)}
        style={{ color: '#90caf9', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', marginTop: '6px', display: 'inline-block' }}
      >
        अधिक वाचा...
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
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>महासह्याद्री विषयी…</h3>
            <button onClick={() => setAboutModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', lineHeight: '1.8', fontSize: '14px', color: '#333' }}>
            <p>सह्याद्रीचा अतिविशाल वारसा आणि समृद्ध निसर्ग संस्कृतीचा विचार करता तमाम सह्यप्रेमींकरीता एक समर्पित डिजिटल मंचची गरज होती. त्यातूनच 'महासह्याद्री'चा उदय झालाय. राज्यातील सह्याद्रीप्रेमी, दुर्गप्रेमी, पर्यावरणमित्र, निसर्गप्रेमी आणि ट्रेकर्स मंडळींचं हक्काचं डिजिटल व्यासपीठ म्हणजे 'महासह्याद्री' न्यूजपोर्टल.</p>
            <br />
            <p>सह्याद्री केवळ दगडधोंड्यांची एक पर्वतरांग नाही. महाराष्ट्राची ती जाज्वल्य अस्मिता आणि एक अमीट अशी समृध्द संस्कृती आहे. पश्चिम घाटातून उगम पावलेल्या सह्यरांगा म्हणजे मराठी इतिहासाचा कणा आहे. या विस्तीर्ण सह्यरांगांमधील घडामोडींची माहिती 'महासह्याद्री'च्या माध्यमातून एकाच छताखाली उपलब्ध होईल.</p>
            <br />
            <p>गडकिल्ले, घाटवाटा, जंगले, स्थापत्यशिल्पे, निसर्ग आणि पर्यावरणविषयक घडामोडी जाणून घेण्यासाठी 'महासह्याद्री' हे एक हक्काचे विश्वासू माध्यम ठरावे, असे आमुचे प्रयत्न नव्हे; तर ध्येय आहे.</p>
            <br />
            <p>हिंदवी स्वराज्याचे संस्थापक छत्रपती शिवाजी महाराज आणि मावळ्यांच्या पराक्रमांचा साक्षीदार असलेला, संतांची भूमी असलेला सह्याद्रीमधील इतिहास, वर्तमानातील भूगोल आणि या सह्याद्रीच्या कुशीत वसलेल्या मानवी संस्कृतीमधील घडामोडी सहज सोप्या भाषेत सह्यप्रेमींसमोर आणण्याचा आमचा संकल्प आहे.</p>
            <br />
            <p>'महासह्याद्री' वेबसाईट म्हणजे केवळ माहितीचे भांडार न राहता सह्याद्रीचे संवर्धन, कला, इतिहास आणि येथील साहसाला वाहिलेली एक अखंड चळवळ ठरेल. वाचक, लेखक आणि दाते म्हणून तुम्ही महासह्याद्री परिवारात हक्काने सामील व्हावे, हेच विनम्र आवाहन.</p>
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