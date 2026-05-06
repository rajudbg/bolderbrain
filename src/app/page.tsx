import { HomeContent } from "@/components/marketing/home-content";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BolderBrain — AI-Powered People Intelligence",
  description: "360° feedback, cognitive testing, EQ assessments, and AI-powered development insights for modern HR and L&D teams.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f11]">
      <MarketingNav />
      <main>
        <HomeContent />
      </main>
      <MarketingFooter />
    </div>
  );
}
