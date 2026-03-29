import { NeuralNexusLanding } from "@/components/neural-nexus-landing";

/** Avoid serving stale prerendered HTML for the marketing shell (client-only session / motion). */
export const dynamic = "force-dynamic";

export default function Home() {
  return <NeuralNexusLanding />;
}
