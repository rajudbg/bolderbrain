import { PageTransition } from "@/components/cerebral-glass/page-transition";

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
