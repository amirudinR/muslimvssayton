import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const fredoka = Fredoka({
  variable: "--font-round",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Penjaga Masjid — Anak Sholeh vs Setan Jahil 🕌",
  description:
    "Game tower defense 3D ramah anak bertema islami-ceria: jaga masjid bersama anak-anak sholeh, halau setan jahil versi lucu dengan cahaya sajadah, gelembung dzikir, koin sedekah, dan wangi wudhu!",
  keywords: ["game anak", "tower defense", "islami", "3D", "masjid", "edukasi"],
  authors: [{ name: "Penjaga Masjid" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#a9e2ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${fredoka.variable} game-body antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
