import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'महासह्याद्री',
  description: 'सह्याद्री निसर्ग बातम्या — पर्वत, प्रवास, संस्कृती आणि निसर्गाच्या बातम्या.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}