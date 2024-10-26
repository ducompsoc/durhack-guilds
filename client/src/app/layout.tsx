import "./globals.scss";
import { Audiowide, Inter } from "next/font/google";
import { MegateamsContextProvider } from "@/components/megateams-context-provider";

const headings = Audiowide({
  subsets: ["latin"],
  weight: "400",
  variable: "--durhack-font",
});

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DurHack MegaTeams",
  description: "The UK's largest student hackathon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={inter.className + " h-full dark:bg-neutral-900 " + headings.variable}>
        <MegateamsContextProvider>
          {children}
        </MegateamsContextProvider>
      </body>
    </html>
  );
}
