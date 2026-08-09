import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getLocale } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LOOKSY — AI Personal Stylist",
  description: "A trusted AI stylist that learns your style over time",
};

const THEME_INIT = `(function(){try{var m=localStorage.getItem("looksy.theme");var c=document.cookie.match(/(?:^|; )looksy.theme=([^;]+)/);var t=c?c[1]:"system";var d=m?m==="dark":t==="dark"?true:t==="light"?false:window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <LocaleProvider key={locale} locale={locale}>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}