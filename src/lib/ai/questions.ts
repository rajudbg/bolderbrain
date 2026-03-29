import { generateWithFallback } from "./resilient-generator";

const QUESTION_SYSTEM_PROMPT = `You are an industrial-organizational psychologist creating assessment questions.

For KNOWLEDGE tests: Scenario + 4 options with 1 clearly correct answer. Include brief explanation of why correct.
For BEHAVIORAL tests: "I" statement + 5-point Likert scale (Strongly Disagree to Strongly Agree).

All questions must be:
- Specific and observable (not abstract)
- Free of bias (gender, cultural, age neutral)
- Relevant to workplace performance

Format: 
Q: [Question text]
Options: A) [option] B) [option] C) [option] D) [option]
Correct: [A/B/C/D]
Explanation: [why correct]
Competency: [which skill being measured]`;

export type ParsedGeneratedQuestion = {
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  competency?: string;
};

export function parseGeneratedQuestions(content: string): ParsedGeneratedQuestion[] {
  const questions: ParsedGeneratedQuestion[] = [];
  const blocks = content.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const qLine = lines.find((l) => l.startsWith("Q:"));
    const optionsLine = lines.find((l) => l.startsWith("Options:"));
    const correctLine = lines.find((l) => l.startsWith("Correct:"));

    if (qLine && optionsLine) {
      const rawOpts = optionsLine.replace(/^Options:\s*/i, "");
      const options = rawOpts
        .split(/\s+(?=[A-D]\)\s)/)
        .map((o) => o.replace(/^[A-D]\)\s*/, "").trim())
        .filter(Boolean);

      questions.push({
        text: qLine.replace(/^Q:\s*/i, "").trim(),
        options,
        correctAnswer: correctLine?.replace(/^Correct:\s*/i, "").trim() || "A",
        explanation: lines.find((l) => l.startsWith("Explanation:"))?.replace(/^Explanation:\s*/i, "").trim(),
        competency: lines.find((l) => l.startsWith("Competency:"))?.replace(/^Competency:\s*/i, "").trim(),
      });
    }
  }

  return questions;
}

export async function generateAssessmentQuestions(
  competency: string,
  level: "junior" | "mid" | "senior",
  type: "knowledge" | "behavioral",
  count: number = 5,
): Promise<{ content: string; questions: ParsedGeneratedQuestion[]; source: string; error?: string }> {
  const prompt = `Generate ${count} ${type} assessment questions for ${competency} at ${level} level.

Context: Professional services firm, client-facing roles.

Output ${count} complete questions in the specified format.`;

  const fallback = () =>
    Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      if (type === "behavioral") {
        return `Q: I demonstrate ${competency} effectively in client situations (${n}).\nOptions: Strongly Disagree Disagree Neutral Agree Strongly Agree\nCorrect: A\nExplanation: Behavioral items use a Likert scale; map to your platform.\nCompetency: ${competency}`;
      }
      return `Q: Sample ${competency} question ${n}\nOptions: A) Option 1 B) Option 2 C) Option 3 D) Option 4\nCorrect: A\nExplanation: Placeholder — replace with reviewed content.\nCompetency: ${competency}`;
    }).join("\n\n");

  const result = await generateWithFallback(prompt, QUESTION_SYSTEM_PROMPT, fallback, undefined, 800);

  const text =
    result.success && result.content.trim().length > 0 ? result.content : fallback();

  return {
    content: text,
    questions: parseGeneratedQuestions(text),
    source: result.source,
    error: result.error,
  };
}
