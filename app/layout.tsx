import type { Metadata } from "next";
import localFont from "next/font/local";
import SmoothScroll from "./components/SmoothScroll";
import "./globals.css";

const roobertSans = localFont({
  src: [
    {
      path: "../public/fonts/6975e9e54e3e3ab9539db790_RoobertMedium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/6975e9e510db29e5670db16e_RoobertSemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-roobert-sans",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

const roobertMono = localFont({
  src: "../public/fonts/6975e9e5b0ff80ea78306fad_RoobertMonoTRIAL-Regular-BF67243fd29a433.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-roobert-mono",
  display: "swap",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: "EverythingMoves",
  description: "We help teams design, develop, and ship robust software at scale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roobertSans.variable} ${roobertMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><SmoothScroll />{children}
      </body>
    </html>
  );
}
