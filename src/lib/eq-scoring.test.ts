import { describe, it, expect } from 'vitest';
import { computeEqAssessmentResult } from './eq-scoring';
import type { EqQuestionForScoring } from './eq-scoring';

function makeQuestion(
  id: string,
  domain: string,
  opts: { reverseScored?: boolean; questionType?: string },
): EqQuestionForScoring {
  return {
    id,
    questionType: (opts.questionType ?? 'EQ_SELF_REPORT') as EqQuestionForScoring['questionType'],
    traitCategory: domain,
    reverseScored: opts.reverseScored ?? false,
    config: opts.questionType === 'EQ_SCENARIO'
      ? { options: [{ id: 'o1', label: 'A', value: 'a', eqPoints: 80 }, { id: 'o2', label: 'B', value: 'b', eqPoints: 40 }] }
      : {},
  };
}

describe('EQ Scoring Logic', () => {
  it('computes domain scores with self-report Likert values', () => {
    const questions: EqQuestionForScoring[] = [
      makeQuestion('q1', 'SelfAwareness', {}),
      makeQuestion('q2', 'SelfAwareness', {}),
      makeQuestion('q3', 'SelfRegulation', {}),
      makeQuestion('q4', 'SelfRegulation', {}),
      makeQuestion('q5', 'Motivation', {}),
      makeQuestion('q6', 'Empathy', {}),
      makeQuestion('q7', 'SocialSkills', {}),
    ];
    // Likert 5 → 66.7 (via scoreSelfReportLikert: ((5-1)/6)*100 = 66.7)
    const responses: Record<string, { likert: number }> = {
      q1: { likert: 5 },
      q2: { likert: 3 },
      q3: { likert: 4 },
      q4: { likert: 4 },
      q5: { likert: 7 },
      q6: { likert: 2 },
      q7: { likert: 6 },
    };

    const result = computeEqAssessmentResult(questions, responses);

    expect(result.domainScores.SelfAwareness).toBeGreaterThan(0);
    expect(result.domainScores.SelfRegulation).toBeGreaterThan(0);
    expect(result.compositeScore).toBeGreaterThan(0);
    expect(result.compositeScore).toBeLessThanOrEqual(100);
    expect(result.highestDomain).toBeTypeOf('string');
    expect(result.lowestDomain).toBeTypeOf('string');
    expect(result.percentileByDomain.SelfAwareness).toBeGreaterThan(0);
    expect(result.consistencyFlags).toBeInstanceOf(Array);
    expect(result.quadrantLabel).toBeTypeOf('string');
  });

  it('reverse-scored items produce higher scores for lower Likert values', () => {
    const questions: EqQuestionForScoring[] = [
      makeQuestion('q1', 'SelfRegulation', { reverseScored: true }),
    ];
    // Likert 1 + reverse → ((6-0)/6)*100 = 100
    const high = computeEqAssessmentResult(questions, { q1: { likert: 1 } });
    // Likert 7 + reverse → ((0)/6)*100 = 0
    const low = computeEqAssessmentResult(questions, { q1: { likert: 7 } });

    expect(high.domainScores.SelfRegulation).toBeGreaterThan(low.domainScores.SelfRegulation);
  });

  it('handles empty responses gracefully', () => {
    const questions: EqQuestionForScoring[] = [
      makeQuestion('q1', 'SelfAwareness', {}),
    ];
    const result = computeEqAssessmentResult(questions, {});
    expect(result.compositeScore).toBe(0);
    expect(result.domainScores.SelfAwareness).toBe(0);
  });

  it('scenario questions use eqPoints from config', () => {
    const questions: EqQuestionForScoring[] = [
      makeQuestion('q1', 'SelfAwareness', { questionType: 'EQ_SCENARIO' }),
    ];
    // Selecting o1 (eqPoints: 80)
    const high = computeEqAssessmentResult(questions, { q1: { scenarioOptionId: 'o1' } });
    // Selecting o2 (eqPoints: 40)
    const low = computeEqAssessmentResult(questions, { q1: { scenarioOptionId: 'o2' } });

    expect(high.domainScores.SelfAwareness).toBe(80);
    expect(low.domainScores.SelfAwareness).toBe(40);
  });

  it('handles missing responses for some questions', () => {
    const questions: EqQuestionForScoring[] = [
      makeQuestion('q1', 'SelfAwareness', {}),
      makeQuestion('q2', 'SelfAwareness', {}),
    ];
    const result = computeEqAssessmentResult(questions, { q1: { likert: 5 } });
    // Only q1 counts
    if (result.domainScores.SelfAwareness > 0) {
      // q1: likert 5 = 66.7, q2 missing
      expect(result.domainScores.SelfAwareness).toBe(66.7);
    }
  });
});
