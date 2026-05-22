'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMarathiDate, getRelativeTime, parseGallery, truncateText, toMarathiDigits } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { getCurrentDate } from '@/lib/utils';
import { translations } from '@/lib/translations';


interface NewsItem {
  Id: number;
  Title: string;
  Content: string;
  Category: string;
  Author: string;
  PublishDate: string;
  Gallery: string[];
  CommentCount: number;
}
interface SliderItem { Id: number; Title: string; Excerpt: string; Category: string; Author: string; TimeAgo: string; HeroImage: string; }
interface WidgetItem { Id?: number; Title: string; SubTitle: string; Url?: string; }
interface Category { 
  CategoryId: number; 
  CategoryName: string; 
  NameMr: string;
  NameEn: string;
}
export default function UserDashboard() {
  const router = useRouter();

  const { language, setLanguage } = useLanguage();
  const [breakingNews, setBreakingNews] = useState<string[]>([]);
  const [sliderNews, setSliderNews] = useState<SliderItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const categoryMap: Record<string, string> = Object.fromEntries(
  categories.map(c => [
    c.CategoryName,
    language === 'mr' ? c.NameMr : c.NameEn
  ])
);

  const [activeCategory, setActiveCategory] = useState('all');
  const [mostViewed, setMostViewed] = useState<WidgetItem[]>([]);
  const [heroes, setHeroes] = useState<WidgetItem[]>([]);
  const [vividha, setVividha] = useState<WidgetItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);
  const sliderIntervalRef = useRef<any>(null);
  const [commentsModal, setCommentsModal] = useState(false);
  const [currentNewsId, setCurrentNewsId] = useState<number | null>(null);
  const [currentNewsTitle, setCurrentNewsTitle] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userName, setUserName] = useState('');
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  // ---- Load all data ----
  useEffect(() => {
    fetchAllData('all');
    const el = document.getElementById('footerYear');
    if (el) {
      el.textContent =
        language === 'mr'
          ? toMarathiDigits(new Date().getFullYear().toString())
          : new Date().getFullYear().toString();
    }
  }, []);

  useEffect(() => {
    fetchAllData(activeCategory);
  }, [language]);

  async function fetchAllData(cat: string) {
    try {
      const apiCat = cat === 'all' ? '' : cat;

      const [
        newsRes,
        breakRes,
        sliderRes,
        catRes,
        mvRes,
        heroRes,
        vivRes
      ] = await Promise.all([
        fetch(`/api/news?category=${encodeURIComponent(apiCat)}&lang=${language}`),
        fetch(`/api/news/breaking?lang=${language}`),
        fetch(`/api/news/slider?lang=${language}`),
        fetch('/api/categories'),
        fetch(`/api/news/most-viewed?lang=${language}`),
        fetch(`/api/news/heroes?lang=${language}`),
        fetch(`/api/news/vividha?lang=${language}`),
      ]);
      const [nd, bd, sd, cd, mv, hd, vd] = await Promise.all([
        newsRes.json(), breakRes.json(), sliderRes.json(),
        catRes.json(), mvRes.json(), heroRes.json(), vivRes.json()
      ]);
      if (nd.status === 'OK') setNews(nd.data);
      if (bd.status === 'OK') setBreakingNews(bd.data);
      if (sd.status === 'OK') setSliderNews(sd.data);
      if (cd.status === 'OK') setCategories(cd.data);
      if (mv.status === 'OK') setMostViewed(mv.data);
      if (hd.status === 'OK') setHeroes(hd.data);
      if (vd.status === 'OK') setVividha(vd.data);
    } catch (e) { console.error(e); }
  }

  // ---- Slider logic ----
  useEffect(() => {
    if (sliderNews.length === 0) return;
    sliderIntervalRef.current = setInterval(() => setCurrentSlide(p => (p + 1) % sliderNews.length), 5000);
    return () => clearInterval(sliderIntervalRef.current);
  }, [sliderNews]);

  // ---- Breaking ticker ----
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    if (breakingNews.length === 0) {
      ticker.style.transform = `translateX(0px)`;
      return;
    }

    let x = window.innerWidth;
    const speed = 1.5;
    let raf: number;

    function step() {
      x -= speed;
      if (x <= -ticker!.scrollWidth) {
        x = window.innerWidth;
      }
      ticker!.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [breakingNews, language]);

  // ---- Category filter ----
  function filterCategory(cat: string) {
    setActiveCategory(cat);
    const apiCat = cat === 'all' ? '' : cat;
    fetch(`/api/news?category=${encodeURIComponent(apiCat)}&lang=${language}`)
      .then(r => r.json())
      .then(d => { if (d.status === 'OK') setNews(d.data); });
  }

  async function openComments(id: number, title: string) {
    setCurrentNewsId(id); setCurrentNewsTitle(title); setCommentsModal(true);
    const res = await fetch(`/api/comments?newsId=${id}`);
    const d = await res.json();
    if (d.status === 'OK') setComments(d.comments);
  }

  async function submitComment() {
    if (!userName.trim()) {
      alert(language === 'mr' ? 'कृपया तुमचे नाव टाका.' : 'Please enter your name.');
      return;
    }
    if (!newComment.trim()) { 
      alert(language === 'mr' ? 'कृपया तुमची प्रतिक्रिया लिहा.' : 'Please write your comment.');
      return; 
    }
    try {
      const res = await fetch(
        `/api/comments?newsId=${currentNewsId}&commentText=${encodeURIComponent(newComment)}&userName=${encodeURIComponent(userName)}`, 
        { method: 'POST' }
      );
      const d = await res.json();
      if (d.status === 'OK') {
        alert(language === 'mr' ? 'प्रतिक्रिया यशस्वीरित्या जोडली!' : 'Comment added successfully!');
        setNewComment('');
        const r = await fetch(`/api/comments?newsId=${currentNewsId}`);
        const rd = await r.json();
        if (rd.status === 'OK') setComments(rd.comments);
      } else {
        alert(language === 'mr' ? 'त्रुटी: ' + d.message : 'Error: ' + d.message);
      }
    } catch (error) {
      console.error('Comment submit error:', error);
      alert(language === 'mr' ? 'प्रतिक्रिया जोडताना त्रुटी झाली!' : 'Error while adding comment!');
    }
  }

  async function submitReply(parentId: number) {
    if (!userName.trim()) {
      alert(language === 'mr' ? 'कृपया तुमचे नाव टाका.' : 'Please enter your name.');
      return;
    }
    if (!replyText.trim()) { 
      alert(language === 'mr' ? 'कृपया तुमचे उत्तर लिहा.' : 'Please write your reply.');
      return; 
    }
    try {
      const res = await fetch(
        `/api/comments?newsId=${currentNewsId}&commentText=${encodeURIComponent(replyText)}&userName=${encodeURIComponent(userName)}&parentId=${parentId}`, 
        { method: 'POST' }
      );
      const d = await res.json();
      if (d.status === 'OK') {
        alert(language === 'mr' ? 'उत्तर यशस्वीरित्या जोडले!' : 'Reply added successfully!');
        setReplyText('');
        setReplyTo(null);
        const r = await fetch(`/api/comments?newsId=${currentNewsId}`);
        const rd = await r.json();
        if (rd.status === 'OK') setComments(rd.comments);
      } else {
        alert('त्रुटी: ' + d.message);
      }
    } catch (error) {
      console.error('Reply submit error:', error);
      alert('उत्तर जोडताना त्रुटी झाली!');
    }
  }

  async function deleteComment(cid: number) {
    if (!confirm(language === 'mr' ? 'ही प्रतिक्रिया delete करायची खात्री आहे का?' : 'Are you sure you want to delete this comment?')) return;
    await fetch(`/api/comments?commentId=${cid}`, { method: 'DELETE' });
    const r = await fetch(`/api/comments?newsId=${currentNewsId}`);
    const d = await r.json();
    if (d.status === 'OK') setComments(d.comments);
  }

  function shareNews(e: React.MouseEvent, id: number) {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/news/${id}`;
    if (navigator.share) { navigator.share({ title: '📰 महासह्याद्री', url }).catch(() => {}); }
    else { navigator.clipboard.writeText(url); alert((language === 'mr' ? 'लिंक कॉपी झाली!' : 'Link copied!') + '\n' + url); }
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
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { overflow-x: hidden; width: 100%; }
        body {
          font-family: 'Noto Sans Devanagari', 'Poppins', sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%);
          color: #333;
          font-size: 14px;
          overflow-x: hidden;
        }

        /* ===== CONTAINER ===== */
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 12px;
          width: 100%;
          box-sizing: border-box;
        }

        /* ===== HEADER ===== */
        .top-header {
          background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%);
          color: white;
          padding: 14px 16px;
          box-shadow: 0 2px 10px rgba(39,164,243,0.3);
        }
        .header-content {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 8px;
        }
        .site-title {
          font-size: 16px;
          font-weight: 700;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .site-logo {
          height: 70px;
          width: auto;
          transition: transform 0.3s ease;
        }
        .site-logo:hover { transform: scale(1.05); }

        /* ===== BREAKING NEWS — FIXED: no 100vw overflow ===== */
        .breaking-news {
          background: rgba(255,255,255,0.15);
          padding: 8px 10px;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          backdrop-filter: blur(6px);
          margin-top: 10px;
          font-size: 12px;
          width: 100%;          /* was 100vw — caused horizontal scroll */
          margin-left: 0;       /* remove negative margin trick */
          box-sizing: border-box;
        }
        .breaking-label {
          font-weight: 600;
          margin-right: 8px;
          display: inline-block;
          color: #fff;
          min-width: 100px;
        }
        .news-ticker-wrapper {
          overflow: hidden;
          display: inline-block;
          width: calc(100% - 0px);
          vertical-align: middle;
        }
        .news-ticker {
          display: inline-flex;
          gap: 40px;
          white-space: nowrap;
          will-change: transform;
        }
        .news-ticker span {
          display: inline-block;
          font-weight: 500;
          color: #fff;
        }

        /* ===== HERO SLIDER ===== */
        .hero-slider {
          position: relative;
          width: 100%;
          margin: 10px 0 14px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          background: #000;
          aspect-ratio: 16/9;
        }
        .slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 0.6s ease-in-out;
          pointer-events: none;
        }
        .slide.active { opacity: 1; pointer-events: auto; }
        .slide img { width: 100%; height: 100%; object-fit: cover; }
        .slide-overlay {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.75));
          padding: 14px 12px 10px;
          color: white;
        }
        .slide-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.6);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .slide-description {
          font-size: 11px;
          opacity: 0.9;
          max-height: 2.8em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .slider-controls {
          position: absolute;
          top: 50%;
          left: 0; right: 0;
          display: flex;
          justify-content: space-between;
          transform: translateY(-50%);
          padding: 0 8px;
          pointer-events: none;
          z-index: 5;
        }
        .slider-btn {
          pointer-events: auto;
          background: rgba(0,0,0,0.45);
          border: none;
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          transition: 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .slider-btn:hover { background: rgba(255,255,255,0.9); color: black; }
        .slider-dots {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 6;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: 0.3s;
          border: none;
        }
        .dot.active { background: #fff; transform: scale(1.3); }

        /* ===== CATEGORIES — FIXED: horizontal scroll, no wrap on mobile ===== */
        .categories {
          display: flex;
          overflow-x: auto;
          flex-wrap: nowrap;          /* MUST be nowrap */
          gap: 8px;
          padding: 6px 0 10px;
          margin: 10px 0 14px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;      /* Firefox */
          width: 100%;
        }
        .categories::-webkit-scrollbar { display: none; } /* Chrome/Safari */

        .category-pill {
          flex: 0 0 auto;             /* prevent shrink/wrap */
          white-space: nowrap;
          padding: 7px 14px;
          border-radius: 999px;
          background: #fff;
          color: #666;
          font-weight: 500;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
          cursor: pointer;
          font-size: 13px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .category-pill.active {
          background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%);
          color: #fff;
          border-color: #27A4F3;
          box-shadow: 0 4px 12px rgba(39,164,243,0.3);
        }

        /* ===== MAIN LAYOUT ===== */
        .main-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin: 0 0 24px;
          width: 100%;
          align-items: start;
        }

        /* ===== NEWS CARDS ===== */
        .news-section { display: flex; flex-direction: column; gap: 12px; width: 100%; }

        .news-card {
          background: white;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          display: grid;
          grid-template-columns: 1fr;   /* single column by default (mobile) */
          gap: 12px;
          padding: 12px;
          width: 100%;
          transition: transform 0.3s, box-shadow 0.3s;
          overflow: hidden;
          cursor: pointer;
        }
        .news-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.13); }

        .news-image-container {
          width: 100%;
          height: 180px;
          overflow: hidden;
          border-radius: 10px;
          background: #f0f0f0;
          position: relative;
        }
        .news-main-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .news-card:hover .news-main-image { transform: scale(1.04); }

        .news-content-area {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .news-category {
          display: inline-block;
          background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          width: fit-content;
        }
        .news-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #111;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-excerpt {
          color: #555;
          line-height: 1.6;
          margin-bottom: 10px;
          font-size: 13px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          color: #888;
          font-size: 12px;
          align-items: center;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid #f0f0f0;
        }

        /* ===== SIDEBAR ===== */
        .sidebar { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        .widget {
          background: white;
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.08);
        }
        .widget-title { font-size: 15px; font-weight: 700; color: #27A4F3; margin-bottom: 8px; }
        .widget-item {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 13px;
          cursor: pointer;
        }
        .widget-item:last-child { border-bottom: none; }
        .widget-item-title { font-weight: 600; color: #222; }
        .widget-item-meta { font-size: 12px; color: #888; }

        /* ===== FOOTER ===== */
        .footer {
          background: linear-gradient(135deg, #1d74bb 0%, #1665a8 100%);
          color: white;
          padding: 24px 0 18px;
          margin-top: 24px;
          font-size: 13px;
        }

        /* ===== RESPONSIVE: TABLET & DESKTOP ===== */
        @media (min-width: 640px) {
          .news-card {
            grid-template-columns: 200px 1fr;
            gap: 16px;
            padding: 16px;
          }
          .news-image-container { height: 160px; }
          .news-content-area { min-height: 160px; }
          .news-title { font-size: 18px; }
          .site-title { font-size: 18px; }
          .slide-title { font-size: 18px; }
          .slide-description { font-size: 12px; }
        }

        @media (min-width: 768px) {
          .site-title { font-size: 22px; }
          .site-logo { height: 70px; }
          .hero-slider { margin: 20px 0 24px; aspect-ratio: 16/8; }
          .categories { flex-wrap: wrap; overflow-x: visible; }
          .main-layout { grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr); gap: 24px; }
          .news-card {
            grid-template-columns: 280px 1fr;
            gap: 20px;
            padding: 20px;
          }
          .news-image-container { height: 210px; }
          .news-content-area { min-height: 210px; }
          .news-title { font-size: 20px; }
          .slide-title { font-size: 20px; }
          .slide-description { font-size: 13px; }
          .breaking-label { min-width: 120px; }
        }

        @media (min-width: 1024px) {
          .news-card { grid-template-columns: 320px 1fr; }
          .news-image-container { height: 240px; }
          .news-content-area { min-height: 240px; }
          .news-title { font-size: 22px; }
        }
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="top-header">
        <div className="header-content">
          <div className="site-title" onClick={() => router.push('/user/dashboard')}>
            <img 
              src="/images/Mahasahyadri.png" 
              alt="MahaSahyadri" 
              className="site-logo"
              style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            MahaSahyadri
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ whiteSpace: 'nowrap' }}>{getCurrentDate(language)}</span>
              <span>{language === 'mr' ? 'भाषा:' : 'Language:'}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'mr')}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  color: '#000',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <option value="en" style={{ color: '#000' }}>English</option>
                <option value="mr" style={{ color: '#000' }}>मराठी</option>
              </select>
            </div>
          </div>
        </div>

        {/* Breaking News */}
        <div className="breaking-news">
          <span className="breaking-label">🔴 {translations[language].breaking}:</span>
          <div className="news-ticker-wrapper">
            <div className="news-ticker" ref={tickerRef}>
              {breakingNews.length === 0 ? (
                <span>{translations[language].noBreaking}</span>
              ) : (
                breakingNews.map((title, i) => (
                  <span key={i}>{title} &nbsp;&nbsp;&nbsp;</span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* ===== HERO SLIDER ===== */}
        <div className="hero-slider">
          {sliderNews.map((item, i) => (
            <div
              key={item.Id}
              className={`slide ${i === currentSlide ? 'active' : ''}`}
              onClick={() => router.push(`/user/news/${item.Id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.HeroImage || '/images/Mahasahyadri.png'}
                alt={item.Title}
                onError={e => { (e.target as HTMLImageElement).src = '/images/Mahasahyadri.png'; }}
              />
              <div className="slide-overlay">
                <div className="slide-title">{item.Title}</div>
                <div className="slide-description">{item.Excerpt}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
                  🏷️ {categoryMap[item.Category] || item.Category} &nbsp;
                  📅 {item.TimeAgo} &nbsp;
                  👤 {item.Author}
                </div>
              </div>
            </div>
          ))}
          <div className="slider-controls">
            <button className="slider-btn" onClick={() => { clearInterval(sliderIntervalRef.current); setCurrentSlide(p => (p - 1 + sliderNews.length) % sliderNews.length); }}>&#10094;</button>
            <button className="slider-btn" onClick={() => { clearInterval(sliderIntervalRef.current); setCurrentSlide(p => (p + 1) % sliderNews.length); }}>&#10095;</button>
          </div>
          <div className="slider-dots">
            {sliderNews.map((_, i) => (
              <button key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(i)} />
            ))}
          </div>
        </div>

        {/* ===== CATEGORY PILLS ===== */}
        <div className="categories">
          {[
            { label: translations[language].allNews, value: 'all' },
            ...categories
              .filter(c => c.NameEn !== 'All News')
              .map(c => ({
                label: language === 'mr' ? c.NameMr : c.NameEn,
                value: c.CategoryName
              }))
          ].map(cat => (
            <button
              key={cat.value}
              className={`category-pill ${activeCategory === cat.value ? 'active' : ''}`}
              onClick={() => filterCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ===== MAIN LAYOUT ===== */}
        <div className="main-layout">

          {/* News Section */}
          <div className="news-section">
            {news.map((item) => (
              <div key={item.Id} className="news-card" onClick={() => router.push(`/user/news/${item.Id}`)}>
                {/* Image */}
                <div className="news-image-container">
                  {item.Gallery?.[0] ? (
                    <img 
                      src={item.Gallery[0]} 
                      alt={item.Title} 
                      className="news-main-image"
                      onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      color: '#666', fontSize: '13px', textAlign: 'center', padding: '8px'
                    }}>
                      📷 {language === 'mr' ? 'छायाचित्र उपलब्ध नाही' : 'Image not available'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="news-content-area">
                  <div>
                    <span className="news-category">{categoryMap[item.Category] || item.Category}</span>
                    <h3 className="news-title">{item.Title}</h3>
                    <p className="news-excerpt">{truncateText(item.Content, 180)}</p>
                  </div>

                  <div className="news-meta">
                    <span>📅 {getRelativeTime(item.PublishDate, language)}</span>
                    <span>•</span>
                    <span>👤 {item.Author}</span>
                    <span>•</span>
                    <span 
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); openComments(item.Id, item.Title); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27A4F3" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {item.CommentCount}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={e => shareNews(e, item.Id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27A4F3" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="widget">
              <h3 className="widget-title">⛰️ {translations[language].mostViewed}</h3>
              {mostViewed.map((item, i) => (
                <div key={i} className="widget-item" onClick={() => router.push(`/user/news/${item.Id}`)}>
                  <div className="widget-item-title">{item.Title}</div>
                  <div className="widget-item-meta">{item.SubTitle}</div>
                </div>
              ))}
            </div>
            <div className="widget">
              <h3 className="widget-title">🎭 {translations[language].heroes}</h3>
              {heroes.map((item, i) => (
                <div key={i} className="widget-item" onClick={() => router.push(`/user/news/${item.Id}`)}>
                  <div className="widget-item-title">{item.Title}</div>
                  <div className="widget-item-meta">{item.SubTitle}</div>
                </div>
              ))}
            </div>
            <div className="widget">
              <h3 className="widget-title">📰 {translations[language].vividha}</h3>
              {vividha.map((item, i) => (
                <div key={i} className="widget-item" onClick={() => router.push(`/user/news/${item.Id}`)}>
                  <div className="widget-item-title">{item.Title}</div>
                  <div className="widget-item-meta">{item.SubTitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="footer">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', padding: '16px 0' }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>{translations[language].about}</h3>
              <p>{translations[language].aboutDesc}</p>
            </div>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>{translations[language].contact}</h3>
              <p>
                {translations[language].email}: mahasahyadri.press@gmail.com <br />
                {translations[language].phone}: +91 9881131059
              </p>
            </div>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>{translations[language].feedback}</h3>
              <p>
                <a 
                  href="#" 
                  onClick={e => { e.preventDefault(); setFeedbackModal(true); }}
                  style={{ 
                    color: '#fff', textDecoration: 'none', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.15)', padding: '8px 16px',
                    borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.3)', transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {language === 'mr' ? 'तुमची प्रतिक्रिया द्या' : 'Give your feedback'}
                </a>
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', paddingBottom: '18px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px' }}>
            © <span id="footerYear"></span> {translations[language].title}. {translations[language].copyright}
          </div>
        </div>
      </div>

      {/* ===== COMMENTS MODAL ===== */}
      {commentsModal && (
        <div
          style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, justifyContent: 'center', alignItems: 'center', padding: '12px' }}
          onClick={() => setCommentsModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{translations[language].comments}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{currentNewsTitle}</div>
              </div>
              <button
                onClick={() => { setCommentsModal(false); setUserName(''); setNewComment(''); setReplyText(''); setReplyTo(null); }}
                style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}
              >✕</button>
            </div>

            <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
              {comments.length === 0 ? (
                <div style={{ color: '#777' }}>{translations[language].noComments}.</div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.CommentId}>
                    <div style={{ marginBottom: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '13px' }}>{c.User}</strong>
                        {c.User === 'Admin' && (
                          <span style={{ background: '#27A4F3', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Admin</span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.5' }}>{c.Text}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>{getRelativeTime(c.Date, language)}</div>
                      <button 
                        onClick={() => setReplyTo(replyTo === c.CommentId ? null : c.CommentId)} 
                        style={{ marginTop: '8px', border: 'none', background: '#e3f2fd', color: '#1976d2', fontSize: '12px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        💬 {translations[language].reply}
                      </button>
                    </div>

                    {replyTo === c.CommentId && (
                      <div style={{ marginTop: '8px', marginBottom: '8px', padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                        <input 
                          type="text" value={userName} onChange={e => setUserName(e.target.value)} 
                          placeholder={translations[language].yourName}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} 
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" value={replyText} onChange={e => setReplyText(e.target.value)} 
                            placeholder={language === 'mr' ? 'तुमचे उत्तर लिहा...' : 'Write your reply...'}
                            style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} 
                          />
                          <button 
                            onClick={() => submitReply(c.CommentId)} 
                            style={{ border: 'none', background: '#27A4F3', color: '#fff', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            {translations[language].submit}
                          </button>
                        </div>
                      </div>
                    )}

                    {c.Replies && c.Replies.length > 0 && (
                      <div style={{ marginLeft: '20px', marginBottom: '12px' }}>
                        {c.Replies.map((reply: any) => (
                          <div key={reply.CommentId} style={{ marginBottom: '8px', padding: '8px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '13px' }}>{reply.User}</strong>
                              {reply.User === 'Admin' && (
                                <span style={{ background: '#27A4F3', color: '#fff', fontSize: '9px', padding: '2px 5px', borderRadius: '3px' }}>Admin</span>
                              )}
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{reply.Text}</div>
                            <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{getRelativeTime(reply.Date, language)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '1px solid #eee', padding: '12px', background: '#fafafa' }}>
              <input 
                type="text" value={userName} onChange={e => setUserName(e.target.value)} 
                placeholder={translations[language].yourName} 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} 
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" value={newComment} onChange={e => setNewComment(e.target.value)} 
                  placeholder={translations[language].writeComment}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '13px' }} 
                />
                <button 
                  onClick={submitComment} 
                  style={{ border: 'none', background: '#27A4F3', color: '#fff', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {translations[language].submit}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div style={{ background: 'linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>📝 {language === 'mr' ? 'फीडबॅक' : 'Feedback'}</div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                  {language === 'mr' ? 'तुमचा अभिप्राय आम्हाला द्या' : 'Share your feedback with us'}
                </div>
              </div>
              <button 
                onClick={() => setFeedbackModal(false)} 
                style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

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
    </>
  );
}