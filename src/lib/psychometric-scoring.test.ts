import { describe, it, expect } from 'vitest';
import { computePsychometricResult } from './psychometric-scoring';

function makeSemanticQuestion(
  id: string,
  trait: string,
  opts: { reverseScored?: boolean; steps?: number },
) {
  return {
    id,
    questionType: 'SEMANTIC_DIFFERENTIAL' as const,
    traitCategory: trait,
    reverseScored: opts.reverseScored ?? false,
    config: { steps: opts.steps ?? 5 },
  };
}

describe('Psychometric Scoring Logic', () => {
  it('computes OCEAN trait percentiles from semantic differential responses', () => {
    const questions = [
      makeSemanticQuestion('q1', 'Openness', {}),
      makeSemanticQuestion('q2', 'Conscientiousness', {}),
      makeSemanticQuestion('q3', 'Extraversion', {}),
      makeSemanticQuestion('q4', 'Agreeableness', {}),
      makeSemanticQuestion('q5', 'Neuroticism', {}),
    ];
    // All high scores (5 on 1-5 scale)
    const responses: Record<string, { value: number }> = {
      q1: { value: 5 },
      q2: { value: 5 },
      q3: { value: 5 },
      q4: { value: 5 },
      q5: { value: 5 },
    };

    const result = computePsychometricResult(questions, responses, {}, {});

    // All 5 OCEAN traits present
    expect(result.traitPercentiles).toHaveProperty('Openness');
    expect(result.traitPercentiles).toHaveProperty('Conscientiousness');
    expect(result.traitPercentiles).toHaveProperty('Extraversion');
    expect(result.traitPercentiles).toHaveProperty('Agreeableness');
    expect(result.traitPercentiles).toHaveProperty('Neuroticism');

    // Percentiles are within 0-100 range
    for (const t of ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism']) {
      expect(result.traitPercentiles[t]).toBeGreaterThanOrEqual(0);
      expect(result.traitPercentiles[t]).toBeLessThanOrEqual(100);
    }

    // Radar payload
    expect(result.radarPayload.traits.length).toBe(5);
    expect(result.radarPayload.user.length).toBe(5);
    expect(result.radarPayload.population.length).toBe(5);

    // Validity flags present
    expect(result.validityFlags).toHaveProperty('inconsistencyWarning');
    expect(result.validityFlags).toHaveProperty('socialDesirabilityWarning');
    expect(result.validityFlags).toHaveProperty('speedWarning');

    // Text outputs present
    expect(result.summaryLine).toBeTruthy();
    expect(result.teamDynamicsText).toBeTruthy();
    expect(result.careerInsightsText).toBeTruthy();
  });

  it('reverse-scored items flip direction', () => {
    const questions = [
      makeSemanticQuestion('q1', 'Extraversion', { reverseScored: true }),
    ];
    // Low value + reverse scored = high trait
    const highExtra = computePsychometricResult(questions, { q1: { value: 1 } }, {}, {});
    // Low value + NOT reversed = low trait
    const direct = makeSemanticQuestion('q1', 'Neuroticism', { reverseScored: false });
    const low = computePsychometricResult([direct], { q1: { value: 1 } }, {}, {});

    // Reverse-scored Extraversion (1=high) should be higher than non-reversed Neuroticism (1=low)
    expect(highExtra.traitPercentiles.Extraversion).toBeGreaterThan(low.traitPercentiles.Neuroticism);
  });

  it('role profiles produce match scores', () => {
    const questions = [
      makeSemanticQuestion('q1', 'Conscientiousness', {}),
    ];
    const responses = { q1: { value: 5 } };
    const roleProfiles = {
      leadership: { Conscientiousness: 0.9 },
    };

    const result = computePsychometricResult(questions, responses, {}, roleProfiles);
    expect(result.roleMatches.leadership).toBeGreaterThan(0);
  });

  it('speed warning triggers for fast responses', () => {
    const questions = [
      makeSemanticQuestion('q1', 'Openness', {}),
    ];
    const responses = { q1: { value: 3 } };
    // Very fast responses (under 2s avg = 2000ms)
    const fast = computePsychometricResult(questions, responses, { q1: 500 }, {});
    const slow = computePsychometricResult(questions, responses, { q1: 5000 }, {});

    expect(fast.validityFlags.speedWarning).toBe(true);
    expect(slow.validityFlags.speedWarning).toBe(false);
  });

  it('handles empty questions gracefully', () => {
    const result = computePsychometricResult([], {}, {}, {});
    expect(result.traitPercentiles.Openness).toBeGreaterThanOrEqual(0);
    expect(result.radarPayload.traits.length).toBe(5);
  });
});
