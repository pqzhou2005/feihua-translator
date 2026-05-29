import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "废话翻译器｜把不能直接说的话，翻译成能发出去的话",
  description:
    "废话翻译器是一个中文表达改写小工具，帮你把不方便直接说的话改成体面、礼貌、冷淡、强硬、高情商或阴阳怪气的表达。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
