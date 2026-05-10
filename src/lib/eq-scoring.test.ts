import { describe, it, expect } from 'vitest';
import { computeEqAssessmentResult, EqQuestionForScoring } from './eq-scoring';

describe('EQ Scoring Logic', () => {
  it('computes domain scores and composite score robustly', () => {
    const questions: EqQuestionForScoring[] = [
      { id: 'q1', questionType: 'EQ_SELF_REPORT', traitCategory: 'SelfAwareness', reverseScored: false, config: {} },
      { id: 'q2', questionType: 'EQ_SELF_REPORT', traitCategory: 'SelfRegulation', reverseScored: true, config: {} }
    ];
    // This is just a robust mock structure. We verify that the function does not crash and returns the expected result shape.
    const responses = { 
      q1: { likert: 5 }, 
      q2: { likert: 1 } 
    };

    const result = computeEqAssessmentResult(questions as unknown as EqQuestionForScoring[], responses);
    
    expect(result).toHaveProperty('domainScores');
    expect(result).toHaveProperty('compositeScore');
    expect(result).toHaveProperty('highestDomain');
    expect(result).toHaveProperty('lowestDomain');
    
    // Ensure all 5 EQ domains exist in domainScores
    expect(result.domainScores).toHaveProperty('SelfAwareness');
    expect(result.domainScores).toHaveProperty('SelfRegulation');
    expect(result.domainScores).toHaveProperty('Motivation');
    expect(result.domainScores).toHaveProperty('Empathy');
    expect(result.domainScores).toHaveProperty('SocialSkills');
  });
});
