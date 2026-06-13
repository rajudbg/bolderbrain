import { AiCoachChat } from "@/components/ai/ai-coach-chat";

export default function AiCoachPage() {
  return (
    <div className="ai-aurora-mesh relative min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_40px_rgba(6,182,212,0.35)]">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="ai-text-gradient mb-2 text-4xl font-bold tracking-tight sm:text-5xl">AI Coach</h1>
          <p className="mx-auto max-w-xl text-sm text-white/50">
            Your personal development coach, powered by your assessment data. Ask questions, get insights, and discover
            your next growth opportunity.
          </p>
        </header>

        <AiCoachChat variant="page" />
      </div>
    </div>
  );
}
