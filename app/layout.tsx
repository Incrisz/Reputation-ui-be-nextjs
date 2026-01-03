import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "./context/ThemeContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizReputation AI",
  description: "Business Reputation Audit Platform",
  icons: {
    icon: "/images/brand-logos/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" data-nav-layout="vertical" data-theme-mode="light" data-header-styles="transparent" data-width="fullwidth" data-menu-styles="transparent" data-page-style="flat">
      <head>
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="stylesheet" href="/css/icons.css" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script src="/js/defaultmenu.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
