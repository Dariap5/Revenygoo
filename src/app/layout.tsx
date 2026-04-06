import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revenygo — AI Workspace",
  description: "Корпоративное рабочее место для безопасной работы с LLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-accent="violet" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Script id="revenygo-theme-init" strategy="beforeInteractive">
          {`(function(){try{var a=localStorage.getItem("accent_theme")||"violet";document.documentElement.setAttribute("data-accent",a);if(localStorage.getItem("theme_dark")==="true")document.documentElement.classList.add("dark");}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
