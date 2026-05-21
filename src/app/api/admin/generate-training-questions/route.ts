import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateWithFallback } from "@/lib/ai/resilient-generator";

const SYSTEM_PROMPT = `You are an assessment designer creating training content questions. Output EXACTLY the following JSON format for each question:

For KNOWLEDGE tests:
{
  "text": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOptionIndexes": [0],
  "explanation": "Why this is correct",
  "points": 1
}

For BEHAVIORAL tests:
{
  "text": "I statement here",
  "type": "LIKERT_5_SCALE",
  "competencyKey": "leadership",
  "reverseScored": false,
  "options": ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"]
}

Return a JSON array of question objects. No markdown, no explanation — just valid JSON array.`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isPlatformSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: { templateName?: string; description?: string; kind?: string; count?: number; isKnowledge?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { templateName = "", description = "", kind = "", count = 5, isKnowledge = true } = body;
  if (!templateName.trim()) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  const prompt = isKnowledge
    ? `Create ${count} ${kind.replace(/_/g, " ").toLowerCase()} questions for a training template titled "${templateName}". Description: "${description}". Each question should have exactly 4 options with one clearly correct answer and a brief explanation. Questions should be professional, workplace-relevant, and progressively more challenging. Return as JSON array.`
    : `Create ${count} behavioral self-assessment questions for a training template titled "${templateName}". Description: "${description}". Each question should be an "I" statement using a 5-point Likert scale (Strongly Disagree to Strongly Agree). Tag each with a competency key like "leadership" or "communication". Questions should measure observable workplace behaviors. Return as JSON array.`;

  try {
    const result = await generateWithFallback(prompt, SYSTEM_PROMPT, () => {
      // Fallback: return placeholder questions
      const fallback = Array.from({ length: count }, (_, i) => ({
        text: isKnowledge
          ? `Sample ${templateName} question ${i + 1}`
          : `I demonstrate ${templateName.toLowerCase()} behaviors in my work (${i + 1})`,
        options: isKnowledge
          ? ["Option A", "Option B", "Option C", "Option D"]
          : ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
        correctOptionIndexes: isKnowledge ? [0] : [],
        type: isKnowledge ? undefined : "LIKERT_5_SCALE",
        competencyKey: isKnowledge ? undefined : "general",
        reverseScored: isKnowledge ? undefined : false,
        explanation: isKnowledge ? "Placeholder — replace with reviewed content." : undefined,
        points: 1,
      }));
      return JSON.stringify(fallback);
    }, undefined, 1500);

    let text = result.content.trim();
    // Extract JSON array from markdown code blocks if present
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) text = jsonMatch[0];

    const parsed = JSON.parse(text) as unknown[];
    if (!Array.isArray(parsed)) throw new Error("AI response is not an array");

    const questions = parsed.slice(0, count).map((item: unknown) => {
      const q = item as Record<string, unknown>;
      return {
        text: String(q.text ?? ""),
        options: (Array.isArray(q.options) ? q.options : []).map((o: unknown) => ({
          text: String((o as Record<string, unknown>)?.text ?? o ?? ""),
          value: 0,
        })),
        correctOptionIndexes: Array.isArray(q.correctOptionIndexes) ? q.correctOptionIndexes.map(Number) : [],
        explanation: String(q.explanation ?? ""),
        points: Number(q.points ?? 1),
        type: String(q.type ?? (isKnowledge ? "SINGLE_CHOICE" : "LIKERT_5_SCALE")),
        competencyKey: String(q.competencyKey ?? ""),
        reverseScored: Boolean(q.reverseScored ?? false),
      };
    });

    return NextResponse.json({ questions, source: result.source });
  } catch (e) {
    console.error("[ai] question generation failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI generation failed" },
      { status: 500 },
    );
  }
}
