import type { EqDomainKey } from "./eq-domains";

/** Expandable development tips (rule-based; no AI). */
export const EQ_DOMAIN_RESOURCES: Record<
  EqDomainKey,
  { summary: string; books: string[]; exercises: string[] }
> = {
  SelfAwareness: {
    summary: "Noticing emotions as they arise is the foundation for every other EQ skill.",
    books: ["Emotional Intelligence — Daniel Goleman", "The Language of Emotions — Karla McLaren"],
    exercises: ["Name three feelings you had today and what triggered them.", "Journal for 5 minutes after key meetings."],
  },
  SelfRegulation: {
    summary: "Self-regulation is about response flexibility — especially under pressure.",
    books: ["The Chimp Paradox — Steve Peters", "Search Inside Yourself — Chade-Meng Tan"],
    exercises: ["Practice a 6-second pause before replying when you feel heated.", "Box breathing: 4-4-4-4 for two minutes."],
  },
  Motivation: {
    summary: "Intrinsic motivation connects daily work to values and purpose.",
    books: ["Drive — Daniel Pink", "Mindset — Carol Dweck"],
    exercises: ["Write one sentence on why your current project matters to you.", "Set a weekly ‘growth goal’ separate from performance metrics."],
  },
  Empathy: {
    summary: "Empathy combines perspective-taking with genuine curiosity about others’ experience.",
    books: ["Mindsight — Daniel Siegel", "Nonviolent Communication — Marshall Rosenberg"],
    exercises: ["In your next 1:1, ask ‘What would make this easier for you?’", "Reflect: what might someone else be feeling in a recent conflict?"],
  },
  SocialSkills: {
    summary: "Social skills turn insight into influence: clarity, feedback, and collaboration.",
    books: ["Influence — Robert Cialdini", "Thanks for the Feedback — Stone & Heen"],
    exercises: ["Give one piece of specific positive feedback this week.", "Before a difficult message, outline intent vs impact in two bullets."],
  },
};
