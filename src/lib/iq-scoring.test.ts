import { describe, it, expect } from 'vitest';
import { computeIqScores, IqQuestionForScoring } from './iq-scoring';

describe('IQ Scoring Logic', () => {
  it('computes scores correctly for a set of answers', () => {
    const questions: IqQuestionForScoring[] = [
      { id: 'q1', questionType: 'NUMERICAL_SEQUENCE', correctOptionId: 'opt1', weight: 1 },
      { id: 'q2', questionType: 'VERBAL_ANALOGY', correctOptionId: 'opt2', weight: 1 },
      { id: 'q3', questionType: 'LOGICAL_PATTERN', correctOptionId: 'opt3', weight: 2 },
    ];
    
    // q1 is correct, q2 is wrong, q3 is correct
    const responses = { q1: 'opt1', q2: 'wrong', q3: 'opt3' };

    const result = computeIqScores(questions, responses);
    
    expect(result.rawCorrectCount).toBe(2);
    expect(result.weightedScore).toBe(3); // 1 + 2
    expect(result.maxWeighted).toBe(4); // 1 + 1 + 2
    
    // 3/4 proportion is above mean, standard score should be higher than 100
    expect(result.standardScore).toBeGreaterThan(100);
    expect(result.percentile).toBeGreaterThan(50);
    expect(result.categoryLabel).toBeTypeOf('string');
  });
});
