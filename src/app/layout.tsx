import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Saisakthi Publications | Book Newspaper Advertisements Online",
    template: "%s | Saisakthi Publications",
  },
  description:
    "Choose your neighbourhood, select your newspaper, and book your advertisement publication date online.",
  openGraph: {
    title: "Saisakthi Publications | Your Local Newspaper Ad, Made Simple.",
    description:
      "Choose your neighbourhood, select your newspaper, and book your advertisement publication date online.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-navy"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}