'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMarathiDate, getRelativeTime, parseGallery, truncateText, toMarathiDigits } from '@/lib/utils';

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
interface Category { CategoryId: number; CategoryName: string; }

export default function UserDashboard() {
  const router = useRouter();
  const [marathiDate, setMarathiDate] = useState('');
  const [breakingNews, setBreakingNews] = useState<string[]>([]);
  const [sliderNews, setSliderNews] = useState<SliderItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('सर्व बातम्या');
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
  

  // ---- Load all data ----
  useEffect(() => {
    setMarathiDate(getMarathiDate());
    fetchAllData('सर्व बातम्या');
    const el = document.getElementById('footerYear');
    if (el) el.textContent = toMarathiDigits(new Date().getFullYear().toString());
  }, []);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'OK') setNews(d.data);
      });
  }, []);

  async function fetchAllData(cat: string) {
    try {
      const [newsRes, breakRes, sliderRes, catRes, mvRes, heroRes, vivRes] = await Promise.all([
        fetch(`/api/news?category=${encodeURIComponent(cat)}`),
        fetch('/api/news/breaking'),
        fetch('/api/news/slider'),
        fetch('/api/categories'),
        fetch('/api/news/most-viewed'),
        fetch('/api/news/heroes'),
        fetch('/api/news/vividha'),
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
    if (!ticker || breakingNews.length === 0) return;
    let x = window.innerWidth;
    const speed = 1.5;
    let raf: number;
    function step() {
      x -= speed;
      if (x <= -ticker!.scrollWidth) x = window.innerWidth;
      ticker!.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [breakingNews]);

  // ---- Category filter ----
  function filterCategory(cat: string) {
    setActiveCategory(cat);
    fetch(`/api/news?category=${encodeURIComponent(cat)}`).then(r => r.json()).then(d => { if (d.status === 'OK') setNews(d.data); });
  }

 async function openComments(id: number, title: string) {
    setCurrentNewsId(id); setCurrentNewsTitle(title); setCommentsModal(true);
    const res = await fetch(`/api/comments?newsId=${id}`);
    const d = await res.json();
    if (d.status === 'OK') setComments(d.comments);
  }

 async function submitComment() {
  if (!newComment.trim()) { 
    alert('कृपया तुमची प्रतिक्रिया लिहा.'); 
    return; 
  }
  
  try {
    const userName = 'वाचक';
    const res = await fetch(
      `/api/comments?newsId=${currentNewsId}&commentText=${encodeURIComponent(newComment)}&userName=${encodeURIComponent(userName)}`, 
      { method: 'POST' }
    );
    const d = await res.json();
    
    console.log('Submit response:', d); // Debug log
    
    if (d.status === 'OK') {
      alert('प्रतिक्रिया यशस्वीरित्या जोडली!'); // Success alert
      setNewComment('');
      
      // Refresh comments
      const r = await fetch(`/api/comments?newsId=${currentNewsId}`);
      const rd = await r.json();
      
      console.log('Refresh response:', rd); // Debug log
      
      if (rd.status === 'OK') {
        setComments(rd.comments);
      }
    } else {
      alert('त्रुटी: ' + d.message);
    }
  } catch (error) {
    console.error('Comment submit error:', error);
    alert('प्रतिक्रिया जोडताना त्रुटी झाली!');
  }
}
   async function deleteComment(cid: number) {
    if (!confirm('ही प्रतिक्रिया delete करायची खात्री आहे का?')) return;
    await fetch(`/api/comments?commentId=${cid}`, { method: 'DELETE' });
    const r = await fetch(`/api/comments?newsId=${currentNewsId}`);
    const d = await r.json();
    if (d.status === 'OK') setComments(d.comments);
  }

  function shareNews(e: React.MouseEvent, id: number) {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/news/${id}`;
    if (navigator.share) { navigator.share({ title: '📰 महासह्याद्री', url }).catch(() => {}); }
    else { navigator.clipboard.writeText(url); alert('लिंक कॉपी झाली!\n' + url); }
  }

  const categoryList = ['सर्व बातम्या', 'किल्ले', 'घाटवाटा', 'मंदिरे', 'वनसंपदा', 'पशुपक्षी', 'विविध'];
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { overflow-x: hidden; width: 100%; }
        body { font-family: 'Noto Sans Devanagari', 'Poppins', sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%); color: #333; font-size: 14px; overflow-x: hidden; }
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        .container { max-width: 1400px; margin: 0 auto; padding: 0 12px; width: 100%; }
        .top-header { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 12px 0 10px; box-shadow: 0 2px 10px rgba(39,164,243,0.3); }
        .header-content { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
        .site-title { font-size: 18px; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .breaking-news { background: rgba(255,255,255,0.15); padding: 8px 10px; border-radius: 8px; overflow: hidden; position: relative; backdrop-filter: blur(6px); margin-top: 10px; font-size: 12px; width: 100vw; margin-left: calc(50% - 50vw); }
        .breaking-label { font-weight: 600; margin-right: 8px; display: inline-block; color: #fff; min-width: 120px; }
        .news-ticker-wrapper { overflow: hidden; display: inline-block; width: calc(100% - 0px); vertical-align: middle; }
        .news-ticker { display: inline-flex; gap: 40px; white-space: nowrap; will-change: transform; }
        .news-ticker span { display: inline-block; font-weight: 500; color: #fff; }
        .hero-slider { position: relative; width: 100%; margin: 14px 0 16px; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); background: #000; aspect-ratio: 16/9; }
        .slide { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 0.6s ease-in-out; pointer-events: none; }
        .slide.active { opacity: 1; pointer-events: auto; }
        .slide img { width: 100%; height: 100%; object-fit: cover; }
        .slide-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.75)); padding: 16px 12px 12px; color: white; }
        .slide-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; text-shadow: 2px 2px 8px rgba(0,0,0,0.6); }
        .slide-description { font-size: 12px; opacity: 0.95; max-height: 3.6em; overflow: hidden; }
        .slider-controls { position: absolute; top: 50%; left: 0; right: 0; display: flex; justify-content: space-between; transform: translateY(-50%); padding: 0 10px; pointer-events: none; z-index: 5; }
        .slider-btn { pointer-events: auto; background: rgba(0,0,0,0.45); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; font-size: 22px; cursor: pointer; transition: 0.3s; }
        .slider-btn:hover { background: rgba(255,255,255,0.9); color: black; transform: scale(1.05); }
        .slider-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 6; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: 0.3s; border: none; }
        .dot.active { background: #fff; transform: scale(1.3); }
        .categories { display: flex; overflow-x: auto; flex-wrap: nowrap; gap: 8px; padding: 6px 0 4px; margin: 10px 0 16px; -webkit-overflow-scrolling: touch; width: 100%; }
        .category-pill { flex: 0 0 auto; padding: 7px 14px; border-radius: 999px; background: #fff; color: #666; font-weight: 500; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); cursor: pointer; font-size: 13px; text-decoration: none; }
        .category-pill.active { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: #fff; border-color: #27A4F3; box-shadow: 0 4px 12px rgba(39,164,243,0.3); }
        .main-layout { display: grid; grid-template-columns: 1fr; gap: 18px; margin: 16px 0 24px; width: 100%; align-items: start; }
        .news-section { display: flex; flex-direction: column; gap: 14px; width: 100%; }
        .news-card { background: white; border-radius: 16px; box-shadow: 0 4px 25px rgba(0,0,0,0.1); display: grid; grid-template-columns: 320px 1fr; gap: 20px; padding: 20px; width: 100%; transition: transform 0.3s, box-shadow 0.3s; overflow: hidden; cursor: pointer; }
        .news-card:hover { transform: translateY(-4px); box-shadow: 0 8px 35px rgba(0,0,0,0.15); }
        .news-image-container { width: 100%; height: 240px; overflow: hidden; border-radius: 12px; background: #f0f0f0; position: relative; }
        .news-main-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .news-card:hover .news-main-image { transform: scale(1.05); }
        .news-content-area { display: flex; flex-direction: column; justify-content: space-between; min-height: 240px; }
        .news-category { display: inline-block; background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 10px; width: fit-content; }
        .news-title { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: #111; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .news-excerpt { color: #555; line-height: 1.6; margin-bottom: 12px; font-size: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .news-meta { display: flex; flex-wrap: wrap; gap: 12px; color: #888; font-size: 13px; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f0f0; }
        .sidebar { display: flex; flex-direction: column; gap: 14px; width: 100%; }
        .widget { background: white; border-radius: 12px; padding: 14px; box-shadow: 0 4px 18px rgba(0,0,0,0.08); }
        .widget-title { font-size: 16px; font-weight: 700; color: #27A4F3; margin-bottom: 8px; }
        .widget-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; cursor: pointer; }
        .widget-item:last-child { border-bottom: none; }
        .widget-item-title { font-weight: 600; color: #222; }
        .widget-item-meta { font-size: 12px; color: #888; }
        .footer { background: linear-gradient(135deg, #1d74bb 0%, #1665a8 100%); color: white; padding: 24px 0 18px; margin-top: 24px; font-size: 13px; }
        @media (min-width: 768px) {
          .header-content { flex-direction: row; align-items: center; justify-content: space-between; }
          .site-title { font-size: 22px; }
          .hero-slider { margin: 20px 0 24px; aspect-ratio: 16/8; }
          .categories { overflow-x: visible; flex-wrap: wrap; }
          .main-layout { grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr); gap: 24px; }
        }
        @media (max-width: 768px) {
          .news-card { grid-template-columns: 1fr; }
          .news-image-container { height: 200px; }
        }
      `}</style>
      {/* Header */}
      <div className="top-header">
        <div className="container">
          <div className="header-content">
            <div className="site-title" onClick={() => router.push('/user/dashboard')}>
              🏔️ महासह्याद्री
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{marathiDate}</div>
            </div>
          </div>
          <div className="breaking-news" style={{ marginTop: '14px' }}>
            <span className="breaking-label">🔴 ताज्या बातम्या:</span>
            <div className="news-ticker-wrapper">
              <div className="news-ticker" ref={tickerRef}>
                {breakingNews.map((title, i) => <span key={i}>{title} &nbsp;&nbsp;&nbsp;</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Hero Slider */}
        <div className="hero-slider">
          {sliderNews.map((item, i) => (
            <div key={item.Id} className={`slide ${i === currentSlide ? 'active' : ''}`}
              onClick={() => router.push(`/user/news/${item.Id}`)} style={{ cursor: 'pointer' }}>
              <img src={item.HeroImage} alt={item.Title} onError={e => { (e.target as HTMLImageElement).src = '/images/no-image.jpg'; }} />
              <div className="slide-overlay">
                <div className="slide-title">{item.Title}</div>
                <div className="slide-description">{item.Excerpt}</div>
                <div style={{ display: 'flex', gap: '18px', marginTop: '10px', fontSize: '14px' }}>
                  🏷️ {item.Category} &nbsp; 📅 {item.TimeAgo} &nbsp; 👤 {item.Author}
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

        {/* Category Pills */}
        <div className="categories">
          {categoryList.map(cat => (
            <button key={cat} className={`category-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => filterCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Main Layout */}
        <div className="main-layout">
          {/* News Section */}
          <div className="news-section">
            {news.map((item) => (
              <div key={item.Id} className="news-card" onClick={() => router.push(`/user/news/${item.Id}`)}>
                {/* Image Container */}
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
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      📷 छायाचित्र उपलब्ध नाही
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="news-content-area">
                  <div>
                    <span className="news-category">{item.Category}</span>
                    <h3 className="news-title">{item.Title}</h3>
                    <p className="news-excerpt">{truncateText(item.Content, 180)}</p>
                  </div>

                  <div className="news-meta">
                    <span>📅 {getRelativeTime(item.PublishDate)}</span>
                    <span>•</span>
                    <span>👤 {item.Author}</span>
                    <span>•</span>
                   <span 
  style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
  onClick={(e) => {
    e.stopPropagation();   // 🚀 MOST IMPORTANT
    openComments(item.Id, item.Title);
  }}
>
  💬 {item.CommentCount}
</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="widget">
              <h3 className="widget-title">⛰️ सर्वाधिक पाहिलेले</h3>
              {mostViewed.map((item, i) => (
                <div key={i} className="widget-item" onClick={() => router.push(`/user/news/${item.Id}`)}>
                  <div className="widget-item-title">{item.Title}</div>
                  <div className="widget-item-meta">{item.SubTitle}</div>
                </div>
              ))}
            </div>
            <div className="widget">
              <h3 className="widget-title">🎭 सह्याद्रीचे शिलेदार</h3>
              {heroes.map((item, i) => (
                <div key={i} className="widget-item" onClick={() => router.push(`/user/news/${item.Id}`)}>
                  <div className="widget-item-title">{item.Title}</div>
                  <div className="widget-item-meta">{item.SubTitle}</div>
                </div>
              ))}
            </div>
            <div className="widget">
              <h3 className="widget-title">📰 विविध बातम्या</h3>
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

      {/* Footer */}
      <div className="footer">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', padding: '20px 0' }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>आमच्याबद्दल</h3>
              <p>सह्याद्री निसर्ग बातम्या — पर्वत, प्रवास, संस्कृती आणि निसर्गाच्या बातम्या.</p>
            </div>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>संपर्क</h3>
              <p>ईमेल: info@sahyadrinews.com<br />फोन: +91 90000 00000</p>
            </div>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>फीडबॅक</h3>
              <p><a href="/feedback" style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }} onClick={e => { e.preventDefault(); router.push('/feedback'); }}>तुमची प्रतिक्रिया द्या</a></p>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', paddingBottom: '18px' }}>
            © <span id="footerYear"></span> सह्याद्री निसर्ग बातम्या. सर्व हक्क राखीव.
          </div>
        </div>
      </div>

       {/* Comments Modal */}
      {commentsModal && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }} onClick={() => setCommentsModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>प्रतिक्रिया</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{currentNewsTitle}</div>
              </div>
              <button onClick={() => setCommentsModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
              {comments.length === 0 ? (
                <div style={{ color: '#777' }}>अजून कोणतीही प्रतिक्रिया नाही.</div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.CommentId} style={{ marginBottom: '10px', padding: '8px', background: '#f9f9f9', borderRadius: '6px', position: 'relative' }}>
                    <strong>{c.User}</strong>
                    {c.User === 'Admin' && <span style={{ background: '#27A4F3', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>Admin</span>}
                    <div style={{ marginTop: '4px' }}>{c.Text}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{c.Date}</div>
                    <button onClick={() => deleteComment(c.CommentId)} style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: '#ffebee', color: '#e53935', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>🗑 Delete</button>
                  </div>
                ))
              )}
            </div>
            <div style={{ borderTop: '1px solid #eee', padding: '10px 12px', display: 'flex', gap: '8px' }}>
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="तुमची प्रतिक्रिया लिहा..." style={{ flex: 1, padding: '8px 10px', borderRadius: '20px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '13px' }} />
              <button onClick={submitComment} style={{ border: 'none', background: '#27A4F3', color: '#fff', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>पाठवा</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}