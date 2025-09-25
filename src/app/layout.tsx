import type { Metadata, Viewport } from 'next';
import Layout from '@/components/Layout';
import { ThemeColorProvider } from '@/lib/ThemeColorProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tesla Show - 行程数据可视化',
  description: '基于Next.js的Tesla行程数据展示系统，连接Teslamate数据库，提供行程轨迹和数据可视化功能',
  keywords: ['Tesla', 'Teslamate', '行程', '数据可视化', 'Next.js'],
  authors: [{ name: 'Tesla Show Team' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    shortcut: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1976d2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.svg" sizes="16x16" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.svg" sizes="32x32" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body>
        <ThemeColorProvider>
          <Layout>{children}</Layout>
        </ThemeColorProvider>
      </body>
    </html>
  );
}