import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebAR App',
  description: 'A simple WebAR application using Three.js and WebXR',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
