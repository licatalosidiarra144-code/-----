import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "麻将抽卡器 · 4 人一桌",
  description: "4 人一桌 · 只抽技能卡 · 白银/棱彩/黄金三局型",
  // 避免被微信/系统当成纯图片预览
  other: {
    "format-detection": "telephone=no",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="relative z-0 min-h-full flex flex-col touch-manipulation">
        {children}
      </body>
    </html>
  );
}
