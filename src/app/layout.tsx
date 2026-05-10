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
      <body className="relative min-h-screen font-sans antialiased">
        <AmbientBackground />
        <div className="relative z-10">
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </div>
        <GoogleAnalytics gaId="396634216" />
      </body>
    </html>
  );
}
