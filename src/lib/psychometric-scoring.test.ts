import { describe, it, expect } from 'vitest';
import { computePsychometricResult } from './psychometric-scoring';

describe('Psychometric Scoring Logic', () => {
  it('computes OCEAN traits successfully', () => {
    const questions = [
      { 
        id: 'q1', 
        questionType: 'SEMANTIC_DIFFERENTIAL' as any, 
        traitCategory: 'Openness', 
        reverseScored: false, 
        config: { steps: 5 } 
      },
      { 
        id: 'q2', 
        questionType: 'SEMANTIC_DIFFERENTIAL' as any, 
        traitCategory: 'Extraversion', 
        reverseScored: true, 
        config: { steps: 5 } 
      }
    ];
    const responses = {
      q1: { value: 5 }, // High Openness
      q2: { value: 1 }  // High Extraversion (since reverseScored is true, value 1 means high)
    };
    
    const roleProfiles = {
      leadership: { Openness: 0.8, Extraversion: 0.8 }
    };

    const result = computePsychometricResult(questions, responses, {}, roleProfiles);
    
    expect(result.traitPercentiles).toHaveProperty('Openness');
    expect(result.traitPercentiles).toHaveProperty('Extraversion');
    expect(result.traitPercentiles).toHaveProperty('Conscientiousness');
    expect(result.traitPercentiles).toHaveProperty('Agreeableness');
    expect(result.traitPercentiles).toHaveProperty('Neuroticism');

    expect(result.radarPayload.traits.length).toBe(5);
  });
});
