'use client';
  import { useState, useEffect, useRef } from 'react';
  import { useRouter } from 'next/navigation';
  import { getCurrentDate, getRelativeTime, formatDate, parseGallery, truncateText, toMarathiDigits } from '@/lib/utils';
  import { useLanguage } from '@/lib/LanguageContext';
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
  interface Category { CategoryId: number; CategoryName: string; NameMr: string; NameEn: string; }

  export default function AdminDashboard() {
    const router = useRouter();
    const [marathiDate, setMarathiDate] = useState('');
    const [breakingNews, setBreakingNews] = useState<string[]>([]);
    const [sliderNews, setSliderNews] = useState<SliderItem[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [mostViewed, setMostViewed] = useState<WidgetItem[]>([]);
    const [heroes, setHeroes] = useState<WidgetItem[]>([]);
    const [vividha, setVividha] = useState<WidgetItem[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [refreshTime, setRefreshTime] = useState(0);
    const [tick, setTick] = useState(0); 
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ headline: '', content: '', categoryId: '0', author: '', date: '', breakingEnd: '', isHero: false });
    const [formMsg, setFormMsg] = useState({ text: '', color: 'green' });
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [commentsModal, setCommentsModal] = useState(false);
    const [currentNewsId, setCurrentNewsId] = useState<number | null>(null);
    const [currentNewsTitle, setCurrentNewsTitle] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [newComment, setNewComment] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const tickerRef = useRef<HTMLDivElement>(null);
    const sliderIntervalRef = useRef<any>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [catDropdownOpen, setCatDropdownOpen] = useState(false);
    const [catMr, setCatMr] = useState('');
    const [catEn, setCatEn] = useState('');
    const [aboutModal, setAboutModal] = useState(false);
    const { language, setLanguage } = useLanguage();
    const [hover, setHover] = useState(false);
    const t = translations[language as 'en' | 'mr'];

    const [editCatId, setEditCatId] = useState<number | null>(null);
    const [editCatMr, setEditCatMr] = useState('');
    const [editCatEn, setEditCatEn] = useState('');

    const categoryMap: Record<string, string> = Object.fromEntries(
    categories.map(c => [
      c.CategoryName,
      language === 'mr' ? c.NameMr : c.NameEn
    ])
  );
  
    // ---- Load all data ----
  useEffect(() => {
   setMarathiDate(getCurrentDate(language));
    fetchAllData(activeCategory);
    const el = document.getElementById('footerYear');
    if (el) el.textContent = toMarathiDigits(new Date().getFullYear().toString());
  }, [language]);

  
    async function fetchAllData(cat: string) {
      try {
        const [newsRes, breakRes, sliderRes, catRes, mvRes, heroRes, vivRes] = await Promise.all([
        fetch(`/api/news?category=${cat === 'all' ? '' : encodeURIComponent(cat)}&lang=${language}`),
         fetch(`/api/news/breaking?lang=${language}`),
          fetch(`/api/news/slider?lang=${language}`),
          fetch('/api/categories'),
          fetch(`/api/news/most-viewed?lang=${language}`),
          fetch('/api/news/heroes'),
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

    // 🔥 AUTO REFRESH TIME (IMPORTANT)
useEffect(() => {
  const interval = setInterval(() => {
    setTick(prev => prev + 1);
  }, 60000); // 1 minute

  return () => clearInterval(interval);
}, []);

    // ---- Breaking ticker (Right to Left) ----
    useEffect(() => {
      const ticker = tickerRef.current;
      if (!ticker || breakingNews.length === 0) return;
      
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
    }, [breakingNews]);

    // ---- Category filter ----
  function filterCategory(cat: string) {
    setActiveCategory(cat);
    const apiCat = cat === 'all' ? '' : cat;

fetch(`/api/news?category=${encodeURIComponent(apiCat)}&lang=${language}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'OK') setNews(d.data);
      });
  }

    // ---- Open modal (Add or Edit) ----
    async function openModal(id?: number) {
      setFormMsg({ text: '', color: 'green' });
      setImages([]); setPreviews([]);
      if (id) {
      setEditId(id);
      const res = await fetch(`/api/news/${id}?admin=1`); // ← ADD ?admin=1
      const d = await res.json();
      console.log('EDIT DATA:', d);
        if (d.status === 'OK') {
          const n = d.data;
          setForm({ headline: n.Title, content: n.Content, categoryId: n.CategoryId ? String(n.CategoryId) : '0', author: n.Author, 
        date: n.PublishDate
  ? new Date(
      new Date(n.PublishDate).getTime() -
      new Date().getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16)
  : '',
     breakingEnd: n.BreakingEndDate 
    ? new Date(n.BreakingEndDate).toISOString().slice(0,16)
    : '' , isHero: n.IsHero || false });
          if (n.Gallery?.length) setFormMsg({ text: 'नोट: सध्याच्या प्रतिमा बदलण्यासाठी नवीन प्रतिमा निवडा', color: 'blue' });
        }
      } else {
        setEditId(null);
        setForm({
          headline: '',
          content: '',
          categoryId: '0',
          author: '',
          date: getLocalDateTime(),
          breakingEnd: '',
          isHero: false
        });
      }
      setModalOpen(true);
    }
function getLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - offset);
  return local.toISOString().slice(0, 16);
}
    // ---- Handle image select ----
    function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
  
    // ✅ 300KB size check
    const maxSize = 300 * 1024; // 300KB
    const oversized = files.filter(f => f.size > maxSize);
  
    if (oversized.length > 0) {
      alert(`❌ Image size shold be less than 300 KB!:\n${oversized.map(f => `• ${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join('\n')}`);
      e.target.value = ''; // input reset
      return;
    }

    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

    // ---- Submit news ----
    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!form.headline.trim()) { setFormMsg({ text: 'कृपया शीर्षक भरा', color: 'red' }); return; }
      if (!form.content.trim()) { setFormMsg({ text: 'कृपया माहिती भरा', color: 'red' }); return; }
      if (form.categoryId === '0') { setFormMsg({ text: 'कृपया श्रेणी निवडा', color: 'red' }); return; }
      if (!form.author.trim()) { setFormMsg({ text: 'कृपया लेखकाचे नाव भरा', color: 'red' }); return; }

      const fd = new FormData();
      fd.append('headline', form.headline);
     fd.append('content', form.content);
      fd.append('categoryId', form.categoryId);
      fd.append('author', form.author);
      fd.append('date', form.date);
      fd.append('breakingEnd', form.breakingEnd);
      fd.append('isHero', form.isHero ? '1' : '0');
      if (editId) fd.append('editId', String(editId));
      images.forEach(img => fd.append('images', img));

      const res = await fetch('/api/news', { method: editId ? 'PUT' : 'POST', body: fd });
      const d = await res.json();
      if (d.status === 'OK') {
        setFormMsg({ text: editId ? '✔ बातमी यशस्वीरित्या अपडेट झाली!' : '✔ बातमी यशस्वीरित्या प्रकाशित झाली!', color: 'green' });
        setTimeout(() => { setModalOpen(false); fetchAllData(activeCategory); }, 1500);
      } else {
        setFormMsg({ text: 'त्रुटी: ' + d.message, color: 'red' });
      }
    }

    // ---- Delete news ----
    async function handleDelete(id: number) {
      if (!confirm('ही बातमी delete करायची खात्री आहे का?')) return;
      await fetch(`/api/news/${id}`, { method: 'DELETE' });
      fetchAllData(activeCategory);
    }

    async function handleAddCategory() {
    if (!catMr.trim()) {
      alert('Marathi नाव भरा');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameMr: catMr,
          nameEn: catEn
        })
      });

      const data = await res.json();

      if (data.status === 'OK') {
        alert('Category added successfully');

        setShowCategoryModal(false);
        setCatMr('');
        setCatEn('');

        // 🔥 UI refresh
        fetchAllData(activeCategory);
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.error(err);
      alert('Error occurred');
    }
  }

  async function handleDeleteCategory(id: number) {
    console.log("DELETE CLICKED:", id); // 👈 ADD THIS
    if (!confirm('ही category delete करायची का?')) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      console.log("DELETE RESPONSE:", data); // 👈 ADD THIS
      if (data.status === 'OK') {
        alert('Deleted successfully');
        fetchAllData(activeCategory);
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.error(err);
      alert('Error occurred');
    }
  }
  async function handleEditCategory(id: number) {
  if (!editCatMr.trim()) { alert('Marathi नाव भरा'); return; }
  try {
    const res = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nameMr: editCatMr, nameEn: editCatEn })
    });
    const data = await res.json();
    if (data.status === 'OK') {
      setEditCatId(null);
      fetchAllData(activeCategory);
    } else { alert(data.message); }
  } catch (err) { alert('Error occurred'); }
}
    // ---- Comments ----
    async function openComments(id: number, title: string) {
      setCurrentNewsId(id); setCurrentNewsTitle(title); setCommentsModal(true);
      const res = await fetch(`/api/comments?newsId=${id}`);
      const d = await res.json();
      if (d.status === 'OK') setComments(d.comments);
    }

    async function submitComment() {
      if (!newComment.trim()) { alert('कृपया तुमची प्रतिक्रिया लिहा.'); return; }
      const res = await fetch(`/api/comments?newsId=${currentNewsId}&commentText=${encodeURIComponent(newComment)}`, { method: 'POST' });
      const d = await res.json();
      if (d.status === 'OK') {
        setNewComment('');
        const r = await fetch(`/api/comments?newsId=${currentNewsId}`);
        const rd = await r.json();
        if (rd.status === 'OK') setComments(rd.comments);
      }
    }

    async function submitReply(parentId: number) {
  if (!replyText.trim()) {
    alert('कृपया उत्तर लिहा');
    return;
  }

  const res = await fetch(
    `/api/comments?newsId=${currentNewsId}&commentText=${encodeURIComponent(replyText)}&parentId=${parentId}`,
    { method: 'POST' }
  );

  const d = await res.json();

  if (d.status === 'OK') {
    setReplyText('');
    setReplyTo(null);

    const r = await fetch(`/api/comments?newsId=${currentNewsId}`);
    const rd = await r.json();
    if (rd.status === 'OK') setComments(rd.comments);
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

    // const categoryList = ['सर्व बातम्या', 'किल्ले', 'घाटवाटा', 'मंदिरे', 'वनसंपदा', 'पशुपक्षी', 'विविध'];

  return (
      <>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html { overflow-x: hidden; width: 100%; }
          body { font-family: 'Noto Sans Devanagari', 'Poppins', sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%); color: #333; font-size: 14px; overflow-x: hidden; }
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap');
          .container { max-width: 1400px; margin: 0 auto; padding: 0 12px; width: 100%; }
       
.top-header { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 4px 16px 6px; box-shadow: 0 2px 10px rgba(39,164,243,0.3); }
.header-content { display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%; gap: 8px; padding: 0; margin: 0; }          .site-title { font-size: 18px; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 0px; }

          .site-logo:hover { transform: scale(1.05); }
          /* ✅ ADD this line after .site-title rule: */
.       site-logo { height: 70px; width: auto; transition: transform 0.3s ease; }
.breaking-news { background: rgba(255,255,255,0.15); padding: 8px 20px; border-radius: 8px; overflow: hidden; position: relative; backdrop-filter: blur(6px); margin-top: 10px; font-size: 15px; width: 100%; margin-left: 0; }          .breaking-label { font-weight: 600; margin-right: 8px; display: inline-block; color: #fff; min-width: 120px; }
          .news-ticker-wrapper { overflow: hidden; display: inline-block; width: calc(100% - 0px); vertical-align: middle; }
          .news-ticker { display: inline-flex; gap: 40px; white-space: nowrap; will-change: transform; }
          .news-ticker span { display: inline-block; font-weight: 500; color: #fff;  font-size: 15px; }
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
          .control-bar { display: flex; justify-content: space-between; align-items: center; margin: 10px 0 16px; gap: 8px; flex-wrap: wrap; }
          .btn-add-news { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; border: none; padding: 10px 18px; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(39,164,243,0.35); white-space: nowrap; }
          .categories { display: flex; overflow-x: auto; flex-wrap: nowrap; gap: 8px; padding: 6px 0 4px; margin: 4px 0 10px; -webkit-overflow-scrolling: touch; width: 100%; }
          .category-pill { flex: 0 0 auto; padding: 7px 14px; border-radius: 999px; background: #fff; color: #666; font-weight: 500; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); cursor: pointer; font-size: 13px; text-decoration: none; }
          .category-pill.active { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: #fff; border-color: #27A4F3; box-shadow: 0 4px 12px rgba(39,164,243,0.3); }
          .main-layout { display: grid; grid-template-columns: 1fr; gap: 18px; margin: 16px 0 24px; width: 100%; align-items: start; }
          .news-section { display: flex; flex-direction: column; gap: 14px; width: 100%; }
          .news-card { background: white; border-radius: 16px; box-shadow: 0 4px 25px rgba(0,0,0,0.1); display: grid; grid-template-columns: 320px 1fr; gap: 20px; padding: 20px; width: 100%; transition: transform 0.3s, box-shadow 0.3s; overflow: hidden; }
          .news-card:hover { transform: translateY(-4px); box-shadow: 0 8px 35px rgba(0,0,0,0.15); }
          .news-image-container { width: 100%; height: 240px; overflow: hidden; border-radius: 12px; background: #f0f0f0; position: relative; }
          .news-main-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
          .news-card:hover .news-main-image { transform: scale(1.05); }
          .news-content-area { display: flex; flex-direction: column; justify-content: space-between; min-height: 240px; }
          .news-category { display: inline-block; background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 10px; width: fit-content; }
          .news-title { font-size: 24px; font-weight: 700; margin-bottom: 10px; color: #111; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .news-title a { text-decoration: none; color: inherit; transition: color 0.3s; }
          .news-title a:hover { color: #27A4F3; }
          .news-excerpt { color: #555; line-height: 1.6; margin-bottom: 12px; font-size: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .news-meta { display: flex; flex-wrap: wrap; gap: 12px; color: #888; font-size: 14px; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f0f0; }
          .meta-actions { margin-top: 12px; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
          .btn-edit { font-size: 12px; padding: 5px 12px; border-radius: 999px; text-decoration: none; border: 2px solid #d4dde4; cursor: pointer; font-weight: 500; transition: all 0.3s; display: inline-flex; align-items: center; gap: 6px; background: #e3f2fd; color: #4a5f6f; }
          .btn-edit:hover { background: #5a6c7d; color: #fff; border-color: #5a6c7d; }
          .btn-delete { font-size: 12px; padding: 5px 12px; border-radius: 999px; text-decoration: none; border: 2px solid #ffcdd2; cursor: pointer; font-weight: 500; transition: all 0.3s; display: inline-flex; align-items: center; gap: 6px; background: #ffecec; color: #e53935; }
          .btn-delete:hover { background: #e53935; color: #fff; border-color: #e53935; }
          .sidebar { display: flex; flex-direction: column; gap: 14px; width: 100%; }
          .widget { background: white; border-radius: 12px; padding: 14px; box-shadow: 0 4px 18px rgba(0,0,0,0.08); }
          .widget-title { font-size: 16px; font-weight: 700; color: #27A4F3; margin-bottom: 8px; }
          .widget-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
          .widget-item:last-child { border-bottom: none; }
          .widget-item-title { font-weight: 600; color: #222; }
          .widget-item-meta { font-size: 12px; color: #888; }
          .footer { background: linear-gradient(135deg, #1d74bb 0%, #1665a8 100%); color: white; padding: 24px 0 18px; margin-top: 24px; font-size: 13px; }
          .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; justify-content: center; align-items: center; }
          .modal-overlay.active { display: flex; }
          .modal-content { background: #fff; border-radius: 0; width: 100%; height: 100vh; max-width: 100%; overflow-y: auto; display: flex; flex-direction: column; }
          .modal-header { background: linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%); color: #fff; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
          .modal-body { padding: 14px 16px 10px; flex: 1; overflow-y: auto; }
          .form-group { margin-bottom: 14px; }
          .form-label { font-weight: 700; margin-bottom: 6px; display: block; font-size: 13px; }
          .form-control { width: 100%; padding: 9px 10px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 13px; font-family: inherit; }
          .form-control:focus { outline: none; border-color: #27A4F3; box-shadow: 0 0 0 2px rgba(39,164,243,0.15); }
          .file-upload-label { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border: 2px dashed #27A4F3; border-radius: 8px; cursor: pointer; color: #27A4F3; font-weight: 600; font-size: 13px; }
          .image-preview { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
          .image-preview img { width: 70px; height: 70px; border-radius: 6px; object-fit: cover; }
          @media (min-width: 768px) {
           .site-title { font-size: 22px; justify-content: flex-start; }
            .hero-slider { margin: 20px 0 24px; aspect-ratio: 16/8; }
            .categories { overflow-x: visible; flex-wrap: wrap; }
            .main-layout { grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr); gap: 24px; }
            .modal-content { border-radius: 16px; width: 94%; max-width: 720px; height: auto; max-height: 90vh; }
          }
          @media (max-width: 768px) {
            .news-card { grid-template-columns: 1fr; }
            .news-image-container { height: 200px; }
          }
        `}</style>
        {/* Header */}
        <div className="top-header">
        <div className="header-content"> 
            <div className="site-title" onClick={() => router.push('/user/dashboard')}>
  <img 
    src="/images/Mahasahyadri.png" 
    alt="MahaSahyadri" 
    className="site-logo"
    style={{ height: '90px', width: 'auto', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }}
    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
  />
  <span style={{ fontSize: '28px', fontWeight: 800, marginLeft: '-6px' }}>MahaSahyadri</span>
</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>

  {/* Date */}
  <div style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
    {language === 'mr'
      ? marathiDate
      : new Date().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric'
        })}
  </div>

  {/* Language */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <span style={{ fontSize: '13px', fontWeight: 500 }}>
      {language === 'mr' ? 'भाषा:' : 'Language:'}
    </span>
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as 'en' | 'mr')}
      style={{
        borderRadius: '6px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        color: '#000',
        cursor: 'pointer',
        outline: 'none'
      }}
    >
      <option value="en">English</option>
      <option value="mr">मराठी</option>
    </select>
  </div>
</div>
            </div>
            <div className="breaking-news" style={{ marginTop: '14px' }}>
              <span className="breaking-label">🔴 {t.breaking}</span>
              <div className="news-ticker-wrapper">
                <div className="news-ticker" ref={tickerRef}>
                  {breakingNews.map((title, i) => <span key={i}>{title} &nbsp;&nbsp;&nbsp;</span>)}
                </div>
              </div>
            </div>
          </div>
        
        <div className="container">
          {/* Hero Slider */}
          <div className="hero-slider">
            {sliderNews.map((item, i) => (
              <div key={item.Id} className={`slide ${i === currentSlide ? 'active' : ''}`}
                onClick={() => router.push(`/admin/news/${item.Id}?admin=1`)} style={{ cursor: 'pointer' }}>
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

          {/* Control Bar */}
          <div className="control-bar">
            <button className="btn-add-news" onClick={() => openModal()}>➕ {t.addNews}</button>
          </div>

          {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

    <div className="categories" style={{ flex: 1 }}>
      {[
  { label: t.allNews, value: 'all' },
  ...categories
    .filter(c => c.NameEn !== 'All News') // ✅ fix
    .map(c => ({
      label:
        language === 'mr'
          ? (c.NameMr || c.CategoryName)
          : (c.NameEn || c.CategoryName),
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

    <button
      onClick={() => setShowCategoryModal(true)}
      style={{
        background: '#27A4F3',
        color: '#fff',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      + Add
    </button>

  </div>

          {/* Main Layout */}
          <div className="main-layout">
            {/* News Section */}
            <div className="news-section">
              {news.map((item) => (
                <div key={item.Id} className="news-card">
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
                      <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: hover
                ? 'linear-gradient(135deg, #dfe9f3 0%, #a6bcd6 100%)'   // 🔥 DARK
                : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // normal
              color: '#666',
              fontSize: '14px',
              transition: '0.3s ease'
            }}
          >
                        {language === 'mr' ? '📷 छायाचित्र उपलब्ध नाही' : '📷 No Image Available'}
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="news-content-area">
                    <div>
                     <span className="news-category">
                      {categoryMap[item.Category] || item.Category}
                    </span>
                      <h3 className="news-title">
                        <a href={`/admin/news/${item.Id}?admin=1`} onClick={e => { e.preventDefault(); router.push(`/admin/news/${item.Id}?admin=1`); }}>
                        {item.Title}
                        </a>
                      </h3>
                      <p className="news-excerpt">{truncateText(item.Content, 180)}</p>
                    </div>

                    <div>
                      <div className="news-meta">
                       <span key={tick}>📅 {getRelativeTime(item.PublishDate, language)}</span>
                        <span>•</span>
                        <span>👤 {item.Author}</span>
                        <span>•</span>
                        <span 
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} 
                          onClick={() => openComments(item.Id, item.Title)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27A4F3" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                         {language === 'mr' ? toMarathiDigits(item.CommentCount) : item.CommentCount}
                        </span>
                        <span 
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
                          onClick={e => shareNews(e, item.Id)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27A4F3" strokeWidth="2">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        </span>
                      </div>

                      <div className="meta-actions">
                        <button className="btn-edit" onClick={() => openModal(item.Id)}>
                          ✏️ {t.edit}
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(item.Id)}>
                          🗑️ {t.delete}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              <div className="widget">
                <h3 className="widget-title">⛰️ {t.mostViewed}</h3>
                {mostViewed.map((item, i) => (
                  <div key={i} className="widget-item">
                    <a href={item.Url || `/user/news/${item.Id}?admin=1`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="widget-item-title">{item.Title}</div>
                        <div className="widget-item-meta">{item.SubTitle}</div>
                    </a>
                  </div>
                ))}
              </div>
              <div className="widget">
                <h3 className="widget-title">🎭 {t.heroes}</h3>
                {heroes.map((item, i) => (
                  <div key={i} className="widget-item">
                    <a href={`/user/news/${item.Id}?admin=1`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="widget-item-title">{item.Title}</div>
                      <div className="widget-item-meta">{item.SubTitle}</div>
                    </a>
                  </div>
                ))}
              </div>
              <div className="widget">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="widget-title">📰 {t.vividha}</h3>

              </div>
                {vividha.map((item, i) => (
                  <div key={i} className="widget-item">
                    <a href={`/user/news/${item.Id}?admin=1`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="widget-item-title">{item.Title}</div>
                      <div className="widget-item-meta">{item.SubTitle}</div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', padding: '20px 0' }}>
             <div>
                <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>
                  {t.about}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: '1.6' }}>
                  सह्याद्रीचा अतिविशाल वारसा आणि समृद्ध निसर्ग संस्कृतीचा विचार करता तमाम सह्यप्रेमींकरीता एक समर्पित डिजिटल मंचची गरज होती...
                </p>
                <span
                  onClick={() => setAboutModal(true)}
                  style={{
                    color: '#90caf9',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginTop: '6px',
                    display: 'inline-block'
                  }}
                >
                  अधिक वाचा...
                </span>
              </div>

              <div>
                <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>
                  {t.contact}
                </h3>
                <p>
                  {t.email}: mahasahyadri.press@gmail.com <br />
                </p>
              </div>

<div>
  <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '14px' }}>
    {t.follow}
  </h3>
  <p>
    <a href="#" style={{ color: '#fff' }}>{t.facebook}</a> • 
    <a href="#" style={{ color: '#fff' }}>{t.instagram}</a> • 
    <a href="#" style={{ color: '#fff' }}>{t.twitter}</a>
  </p>
</div>
            </div>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', paddingBottom: '18px' }}>
             © <span id="footerYear">
          {language === 'mr'
            ? toMarathiDigits(new Date().getFullYear().toString())
            : new Date().getFullYear()}
        </span> {t.title}. {t.copyright}
            </div>
          </div>
        </div>
        {/* Add/Edit News Modal */}
        <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{editId 
    ? (language === 'mr' ? 'बातमी संपादित करा' : 'Edit News') 
    : (language === 'mr' ? 'नवीन बातमी जोडा' : 'Add News')}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body">
              {formMsg.text && (
                <div style={{ padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', background: formMsg.color === 'green' ? '#d4edda' : formMsg.color === 'red' ? '#f8d7da' : '#d1ecf1', color: formMsg.color === 'green' ? '#155724' : formMsg.color === 'red' ? '#721c24' : '#0c5460', border: `1px solid ${formMsg.color === 'green' ? '#c3e6cb' : formMsg.color === 'red' ? '#f5c6cb' : '#bee5eb'}` }}>
                  {formMsg.text}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                <label className="form-label">
    {language === 'mr' ? 'शीर्षक' : 'Title'}
  </label>
                  <input type="text" className="form-control" value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="बातमीचे शीर्षक लिहा" />
                </div>
                <div className="form-group">
                  <label className="form-label">{language === 'mr' ? 'माहिती' : 'Content'}</label>
                  <textarea className="form-control" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="बातमीची संपूर्ण माहिती लिहा" />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
<label className="form-label">{t.category}</label>
    <div
      onClick={() => setCatDropdownOpen(o => !o)}
      style={{
        width: '100%', padding: '9px 10px', border: '1px solid #e0e0e0',
        borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
        background: '#fff', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', userSelect: 'none',
        boxShadow: catDropdownOpen ? '0 0 0 2px rgba(39,164,243,0.15)' : 'none',
        borderColor: catDropdownOpen ? '#27A4F3' : '#e0e0e0'
      }}
    >
      <span style={{ color: form.categoryId === '0' ? '#aaa' : '#333' }}>
       {form.categoryId === '0'
  ? t.selectCategory
  : (() => {
      const selectedCat = categories.find(c => String(c.CategoryId) === form.categoryId);
      return language === 'mr'
        ? selectedCat?.NameMr
        : selectedCat?.NameEn;
    })()}
      </span>
      <span style={{ fontSize: '11px', color: '#888' }}>{catDropdownOpen ? '▲' : '▼'}</span>
    </div>

    {catDropdownOpen && (
      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: '220px',
        overflowY: 'auto', marginTop: '4px'
      }}>
        <div
          onClick={() => { setForm({ ...form, categoryId: '0' }); setCatDropdownOpen(false); }}
          style={{
            padding: '9px 12px', fontSize: '13px', color: '#aaa',
            cursor: 'pointer', borderBottom: '1px solid #f0f0f0'
          }}
        >
{t.selectCategory}
        </div>

       {categories.map(c => (
  <div
    key={c.CategoryId}
    style={{
      padding: '6px 12px', fontSize: '13px',
      background: String(c.CategoryId) === form.categoryId ? '#e3f2fd' : 'transparent',
      transition: 'background 0.15s', borderBottom: '1px solid #f5f5f5'
    }}
  >
    {editCatId === c.CategoryId ? (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          value={editCatMr}
          onChange={e => setEditCatMr(e.target.value)}
          placeholder="Marathi"
          style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #27A4F3', fontSize: '13px' }}
          onClick={e => e.stopPropagation()}
        />
        <input
          value={editCatEn}
          onChange={e => setEditCatEn(e.target.value)}
          placeholder="English"
          style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #27A4F3', fontSize: '13px' }}
          onClick={e => e.stopPropagation()}
        />
        <span
          onClick={e => { e.stopPropagation(); handleEditCategory(c.CategoryId); }}
          title="Save"
          style={{ color: '#27A4F3', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
        >✔</span>
        <span
          onClick={e => { e.stopPropagation(); setEditCatId(null); }}
          title="Cancel"
          style={{ color: '#999', cursor: 'pointer', fontSize: '16px' }}
        >✕</span>
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          onClick={() => { setForm({ ...form, categoryId: String(c.CategoryId) }); setCatDropdownOpen(false); }}
          style={{ flex: 1, color: '#333', cursor: 'pointer', padding: '3px 0' }}
        >
          {language === 'mr' ? c.NameMr : c.NameEn}
        </span>
        {/* ✏️ Edit */}
        <span
          onClick={e => {
            e.stopPropagation();
            setEditCatId(c.CategoryId);
            setEditCatMr(c.NameMr);
            setEditCatEn(c.NameEn);
          }}
          title="Edit"
          style={{
            marginLeft: '8px', color: '#1976d2', fontSize: '13px',
            padding: '2px 6px', borderRadius: '4px', cursor: 'pointer'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.background = '#e3f2fd'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.background = 'transparent'; }}
        >✏️</span>
        {/* ✕ Delete */}
        <span
          onClick={async e => {
            e.stopPropagation();
            if (!window.confirm(`"${c.CategoryName}" delete करायची का?`)) return;
            if (String(c.CategoryId) === form.categoryId) setForm(f => ({ ...f, categoryId: '0' }));
            await handleDeleteCategory(c.CategoryId);
          }}
          title="Delete"
          style={{
            marginLeft: '4px', color: '#e53935', fontSize: '15px',
            padding: '2px 4px', borderRadius: '4px', cursor: 'pointer'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.background = '#ffecec'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.background = 'transparent'; }}
        >✕</span>
      </div>
    )}
  </div>
))}
      </div>
    )}
  </div>
                <div className="form-group">
                  <label className="form-label">{t.image}</label>
                  <input type="file" id="imageInput" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />
                  <label htmlFor="imageInput" className="file-upload-label">
                    📷 {t.selectImage}
                  </label>
                  {previews.length > 0 && (
                    <div className="image-preview">
                      {previews.map((src, i) => <img key={i} src={src} alt="" />)}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">{language === 'mr' ? 'लेखकाचे नाव' : 'Author'}</label>
                  <input type="text" className="form-control" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="लेखकाचे नाव" />
                </div>
                <div className="form-group">
                  <label className="form-label">{language === 'mr' ? 'प्रकाशन दिनांक' : 'Publish Date'}</label>
                  <input type="datetime-local" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                <label className="form-label">{t.breakingEnd}</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.breakingEnd}
                    onChange={e => setForm({ ...form, breakingEnd: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  cursor: 'pointer',
                  padding: '14px',
                  background: form.isHero ? '#fff3e0' : '#f8f9fa',
                  borderRadius: '10px',
                  border: form.isHero ? '2px solid #ff9800' : '2px solid #e0e0e0',
                  transition: 'all 0.3s'
                }}>
              <input 
                type="checkbox" 
                checked={form.isHero}
                onChange={e => setForm({ ...form, isHero: e.target.checked })}
                style={{ 
                  width: '22px', 
                  height: '22px', 
                  cursor: 'pointer',
                  accentColor: '#ff9800'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: form.isHero ? '#e65100' : '#333' }}>
                  {language === 'mr' ? '🎭 सह्याद्रीचे शिलेदार' : '🎭 Sahyadri Heroes'}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  महत्वाच्या व्यक्तींशी संबंधित बातमी
                </div>
              </div>
            </label>
          </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
                  {editId ? `✔ ${t.update}` : `✔ ${t.publish}`}
                </button>
              </form>
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
            <div key={c.CommentId} style={{ marginBottom: '12px', padding: '10px', background: '#f9f9f9', borderRadius: '8px' }}>
              
              <strong>{c.User}</strong>
              {c.User === 'Admin' && (
                <span style={{ background: '#27A4F3', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>
                  Admin
                </span>
              )}

              <div style={{ marginTop: '4px' }}>{c.Text}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                {getRelativeTime(c.Date, language)}
              </div>

              {/* 🔥 Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                
                {/* Reply */}
                <button
                  onClick={() => setReplyTo(replyTo === c.CommentId ? null : c.CommentId)}
                  style={{
                    border: 'none',
                    background: '#e3f2fd',
                    color: '#1976d2',
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  💬 उत्तर द्या
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteComment(c.CommentId)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#e53935', fontSize: '12px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                  Delete
                </button>

              </div>

              {/* 🔥 Reply Input */}
              {replyTo === c.CommentId && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="उत्तर लिहा..."
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '20px', border: '1px solid #ccc' }}
                  />
                  <button
                    onClick={() => submitReply(c.CommentId)}
                    style={{ border: 'none', background: '#27A4F3', color: '#fff', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer' }}
                  >
                    पाठवा
                  </button>
                </div>
              )}

              {/* Replies */}
              {c.Replies && c.Replies.length > 0 && (
                <div style={{ marginLeft: '25px', marginTop: '10px' }}>
                  {c.Replies.map((r: any) => (
                    <div key={r.CommentId} style={{ background: '#eef6ff', padding: '6px', borderRadius: '5px', marginBottom: '6px' }}>
                      <strong>{r.User}</strong>
                      <div>{r.Text}</div>
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        {getRelativeTime(r.Date, language)}
                      </div>

                      {/* Delete reply */}
                      <button
                        onClick={() => deleteComment(r.CommentId)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', marginTop: '4px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>

                    </div>
                  ))}
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Bottom input same as it is */}
      <div style={{ borderTop: '1px solid #eee', padding: '10px 12px', display: 'flex', gap: '8px' }}>
        <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Admin प्रतिक्रिया लिहा..." style={{ flex: 1, padding: '8px 10px', borderRadius: '20px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '13px' }} />
        <button onClick={submitComment} style={{ border: 'none', background: '#27A4F3', color: '#fff', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          पाठवा
        </button>
      </div>

    </div>
  </div>
)}
        {/* Category Add Modal */}
  {showCategoryModal && (
    <div className="modal-overlay active" onClick={() => setShowCategoryModal(false)}>
      <div
        className="modal-content"
        style={{ maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Add Category</h3>
          <button onClick={() => setShowCategoryModal(false)}>×</button>
        </div>

        <div className="modal-body">

          <div className="form-group">
            <label className="form-label">Marathi Name</label>
            <input
              type="text"
              className="form-control"
              value={catMr}
              onChange={(e) => setCatMr(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">English Name</label>
            <input
              type="text"
              className="form-control"
              value={catEn}
              onChange={(e) => setCatEn(e.target.value)}
            />
          </div>

          <button
            onClick={handleAddCategory}
            style={{
              width: '100%',
              padding: '10px',
              background: '#27A4F3',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>

        </div>
      </div>
    </div>
  )}

  {/* About Modal */}
{aboutModal && (
  <div
    style={{
      display: 'flex', position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 9999,
      justifyContent: 'center', alignItems: 'center'
    }}
    onClick={() => setAboutModal(false)}
  >
    <div
      style={{
        background: '#fff', borderRadius: '16px', width: '90%',
        maxWidth: '650px', maxHeight: '85vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div style={{
        background: 'linear-gradient(135deg, #27A4F3 0%, #1e88d4 100%)',
        color: '#fff', padding: '14px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>महासह्याद्री विषयी…</h3>
        <button
          onClick={() => setAboutModal(false)}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
        >×</button>
      </div>

      {/* Modal Body */}
      <div style={{ padding: '20px', overflowY: 'auto', lineHeight: '1.8', fontSize: '14px', color: '#333' }}>
        <p>
          सह्याद्रीचा अतिविशाल वारसा आणि समृद्ध निसर्ग संस्कृतीचा विचार करता तमाम सह्यप्रेमींकरीता एक समर्पित डिजिटल मंचची गरज होती. त्यातूनच 'महासह्याद्री'चा उदय झालाय. राज्यातील सह्याद्रीप्रेमी, दुर्गप्रेमी, पर्यावरणमित्र, निसर्गप्रेमी आणि ट्रेकर्स मंडळींचं हक्काचं डिजिटल व्यासपीठ म्हणजे 'महासह्याद्री' न्यूजपोर्टल.
        </p>
        <br />
        <p>
          सह्याद्री केवळ दगडधोंड्यांची एक पर्वतरांग नाही. महाराष्ट्राची ती जाज्वल्य अस्मिता आणि एक अमीट अशी समृध्द संस्कृती आहे. पश्चिम घाटातून उगम पावलेल्या सह्यरांगा म्हणजे मराठी इतिहासाचा कणा आहे. या विस्तीर्ण सह्यरांगांमधील घडामोडींची माहिती 'महासह्याद्री'च्या माध्यमातून एकाच छताखाली उपलब्ध होईल.
        </p>
        <br />
        <p>
          गडकिल्ले, घाटवाटा, जंगले, स्थापत्यशिल्पे, निसर्ग आणि पर्यावरणविषयक घडामोडी जाणून घेण्यासाठी 'महासह्याद्री' हे एक हक्काचे विश्वासू माध्यम ठरावे, असे आमुचे प्रयत्न नव्हे; तर ध्येय आहे.
        </p>
        <br />
        <p>
          हिंदवी स्वराज्याचे संस्थापक छत्रपती शिवाजी महाराज आणि मावळ्यांच्या पराक्रमांचा साक्षीदार असलेला, संतांची भूमी असलेला सह्याद्रीमधील इतिहास, वर्तमानातील भूगोल आणि या सह्याद्रीच्या कुशीत वसलेल्या मानवी संस्कृतीमधील घडामोडी सहज सोप्या भाषेत सह्यप्रेमींसमोर आणण्याचा आमचा संकल्प आहे.
        </p>
        <br />
        <p>
          'महासह्याद्री' वेबसाईट म्हणजे केवळ माहितीचे भांडार न राहता सह्याद्रीचे संवर्धन, कला, इतिहास आणि येथील साहसाला वाहिलेली एक अखंड चळवळ ठरेल. वाचक, लेखक आणि दाते म्हणून तुम्ही महासह्याद्री परिवारात हक्काने सामील व्हावे, हेच विनम्र आवाहन.
        </p>
      </div>
    </div>
  </div>
)}
      </>
    );
  }