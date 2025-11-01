import { Audiowide, Inter } from "next/font/google";
import type * as React from "react";

import { siteConfig } from "@/config/site";
import "./globals.scss";

const headings = Audiowide({
  subsets: ["latin"],
  weight: "400",
  variable: "--durhack-font",
});

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "dark light",
}

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  icons: {
    icon: ["/icon/favicon.svg", "/icon/favicon.ico", "/icon/favicon.png"],
    apple: "/icon/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en-GB",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.openGraphImage }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={inter.className + " h-full dark:bg-neutral-900 " + headings.variable}>
        {children}
      </body>
    </html>
  );
}
