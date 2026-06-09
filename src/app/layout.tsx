import type { Metadata } from "next";
import { AmbientBackground } from "@/components/cerebral-glass/ambient-background";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BolderBrain", template: "%s · BolderBrain" },
  description: "Multi-tenant assessment platform for 360 feedback, cognitive, and EQ programs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative min-h-screen font-sans antialiased">
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
