import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AmbientBackground } from "@/components/cerebral-glass/ambient-background";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "BolderBrain", template: "%s · BolderBrain" },
  description: "Multi-tenant assessment platform for 360 feedback, cognitive, and EQ programs.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "BolderBrain — AI-Powered People Intelligence",
    description: "The only complete assessment intelligence platform for modern L&D teams.",
    url: "https://bolderbrain.com",
    siteName: "BolderBrain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <body className="relative min-h-screen font-sans antialiased noise-overlay">
        <AmbientBackground />
        <div className="relative z-10">
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </div>
        <GoogleAnalytics gaId="G-1GYMXFBE4E" />
      </body>
    </html>
  );
}
