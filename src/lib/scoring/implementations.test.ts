import { describe, it, expect } from 'vitest';
import { MultiSourceScoring } from './implementations';
import type { ScoringInput } from './types';

describe('360 Multi-Source Scoring', () => {
  it('calculates averages by source and gaps between self and others', () => {
    const strategy = new MultiSourceScoring();
    
    const input: ScoringInput = {
      templateId: 'tmpl_1',
      questions: [
        { id: 'q1', key: 'q1', traitCategory: 'Communication', weight: 1, correctOptionId: null },
        { id: 'q2', key: 'q2', traitCategory: 'Leadership', weight: 1, correctOptionId: null }
      ],
      responses: [
        // Self responses
        { questionId: 'q1', numericValue: 5, source: 'self' },
        { questionId: 'q2', numericValue: 4, source: 'self' },
        // Manager responses
        { questionId: 'q1', numericValue: 3, source: 'manager' },
        { questionId: 'q2', numericValue: 4, source: 'manager' },
        // Peer responses
        { questionId: 'q1', numericValue: 4, source: 'peer' },
        { questionId: 'q2', numericValue: 5, source: 'peer' }
      ]
    };

    const result = strategy.score(input);

    expect(result.strategy).toBe('MULTI_SOURCE');
    
    if (result.strategy === 'MULTI_SOURCE') {
      expect(result.summary.selfOverall).toBe(4.5); // (5+4)/2
      expect(result.summary.othersOverall).toBe(4); // (3+4+4+5)/4
      expect(result.summary.gapSelfVsOthers).toBe(0.5); // 4.5 - 4

      // Communication competency
      const comm = result.byCompetency.find(c => c.competencyKey === 'Communication');
      expect(comm).toBeDefined();
      expect(comm?.averagesBySource.self).toBe(5);
      expect(comm?.averagesBySource.manager).toBe(3);
      expect(comm?.averagesBySource.peer).toBe(4);
      expect(comm?.othersAverage).toBe(3.5); // (3+4)/2
      expect(comm?.gapSelfVsOthers).toBe(1.5); // 5 - 3.5

      // Leadership competency
      const lead = result.byCompetency.find(c => c.competencyKey === 'Leadership');
      expect(lead).toBeDefined();
      expect(lead?.averagesBySource.self).toBe(4);
      expect(lead?.othersAverage).toBe(4.5); // (4+5)/2
      expect(lead?.gapSelfVsOthers).toBe(-0.5); // 4 - 4.5
      
      // Highest and Lowest gap
      expect(result.gaps.highest.competencyKey).toBe('Communication');
      expect(result.gaps.lowest.competencyKey).toBe('Leadership');
    }
  });
});
