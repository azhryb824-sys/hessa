import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "حصة | تعلم يناسبك", template: "%s | حصة" },
  description: "منصة تعليمية تجمع المواد والحصص والخطط الشخصية وتحليل التقدم.",
  manifest: "/manifest.webmanifest",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
