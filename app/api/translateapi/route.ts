import { NextRequest, NextResponse } from 'next/server';

async function translateText(text: string): Promise<string> {
  const urls = [
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=mr&tl=en&dt=t&q=${encodeURIComponent(text)}`,
    `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=mr&tl=en&q=${encodeURIComponent(text)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) continue;

      const data = await res.json();
      const translated = data[0]
        ?.map((item: any) => item[0])
        .filter(Boolean)
        .join('');
      if (translated) return translated;
    } catch { continue; }
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { texts } = await req.json();
    const results = await Promise.all(texts.map(translateText));
    return NextResponse.json({ status: 'OK', results });
  } catch (err) {
    console.error('Translate error:', err);
    return NextResponse.json({ status: 'ERROR', message: String(err) }, { status: 500 });
  }
}