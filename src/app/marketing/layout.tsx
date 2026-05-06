import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: { default: "BolderBrain — AI-Powered People Intelligence", template: "%s · BolderBrain" },
  description: "360° feedback, cognitive testing, EQ assessments, and AI-powered development insights for modern HR and L&D teams.",
  keywords: ["360 feedback", "employee assessment", "EQ testing", "psychometric tests", "HR analytics", "L&D platform"],
  openGraph: {
    title: "BolderBrain — AI-Powered People Intelligence",
    description: "Transform how you understand and develop your people with comprehensive behavioral analytics.",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f11]">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
