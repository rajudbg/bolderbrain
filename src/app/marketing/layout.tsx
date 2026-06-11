import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FloatingDemoWidget } from "@/components/marketing/floating-demo-widget";

export const metadata: Metadata = {
  title: { default: "BolderBrain — AI-Powered People Intelligence", template: "%s · BolderBrain" },
  description: "360° feedback, cognitive testing, EQ assessments, and AI-powered development insights for modern HR and L&D teams.",
  keywords: ["360 feedback", "employee assessment", "EQ testing", "psychometric tests", "HR analytics", "L&D platform"],
  openGraph: {
    title: "BolderBrain — AI-Powered People Intelligence",
    description: "The only complete assessment intelligence platform connecting 360 feedback, psychometrics, and training impact.",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
      <FloatingDemoWidget />
    </div>
  );
}
