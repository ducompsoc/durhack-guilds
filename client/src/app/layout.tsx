import { Audiowide, Inter } from "next/font/google";

import { siteConfig } from "@/config/site"
import { GuildsContextProvider } from "@/components/guilds-context-provider";
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
    icon: ["/icon/favicon.svg", "/icon/favicon.ico", "/icon/favicon-16x16.png", "/icon/favicon-32x32.png"],
    shortcut: ["/icon/favicon-16x16.png", "/icon/favicon-32x32.png"],
    apple: "/icon/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/icon/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
    ],
  },
  other: {
    "msapplication-TileColor": "#008987",
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
        <GuildsContextProvider>
          {children}
        </GuildsContextProvider>
      </body>
    </html>
  );
}
