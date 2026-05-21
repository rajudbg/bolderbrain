import { describe, it, expect } from 'vitest';
import { MultiSourceScoring, SumCorrectScoring, TraitAggregateScoring } from './implementations';
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
        { questionId: 'q1', numericValue: 5, source: 'self' },
        { questionId: 'q2', numericValue: 4, source: 'self' },
        { questionId: 'q1', numericValue: 3, source: 'manager' },
        { questionId: 'q2', numericValue: 4, source: 'manager' },
        { questionId: 'q1', numericValue: 4, source: 'peer' },
        { questionId: 'q2', numericValue: 5, source: 'peer' }
      ]
    };

    const result = strategy.score(input);
    expect(result.strategy).toBe('MULTI_SOURCE');

    if (result.strategy === 'MULTI_SOURCE') {
      expect(result.summary.selfOverall).toBe(4.5);
      expect(result.summary.othersOverall).toBe(4);
      expect(result.summary.gapSelfVsOthers).toBe(0.5);

      const comm = result.byCompetency.find(c => c.competencyKey === 'Communication');
      expect(comm).toBeDefined();
      expect(comm?.averagesBySource.self).toBe(5);
      expect(comm?.averagesBySource.manager).toBe(3);
      expect(comm?.averagesBySource.peer).toBe(4);
      expect(comm?.othersAverage).toBe(3.5);
      expect(comm?.gapSelfVsOthers).toBe(1.5);

      const lead = result.byCompetency.find(c => c.competencyKey === 'Leadership');
      expect(lead).toBeDefined();
      expect(lead?.averagesBySource.self).toBe(4);
      expect(lead?.othersAverage).toBe(4.5);
      expect(lead?.gapSelfVsOthers).toBe(-0.5);

      expect(result.gaps.highest.competencyKey).toBe('Communication');
      expect(result.gaps.lowest.competencyKey).toBe('Leadership');
    }
  });

  it('handles empty responses gracefully', () => {
    const strategy = new MultiSourceScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_1',
      questions: [
        { id: 'q1', key: 'q1', traitCategory: 'Communication', weight: 1 }
      ],
      responses: []
    };
    const result = strategy.score(input);
    if (result.strategy === 'MULTI_SOURCE') {
      expect(result.byCompetency).toEqual([]);
      expect(result.summary.selfOverall).toBe(0);
      expect(result.summary.othersOverall).toBe(0);
    }
  });

  it('skips NaN numeric values', () => {
    const strategy = new MultiSourceScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_1',
      questions: [
        { id: 'q1', key: 'q1', traitCategory: 'Focus', weight: 1 }
      ],
      responses: [
        { questionId: 'q1', numericValue: NaN, source: 'self' },
        { questionId: 'q1', numericValue: 4, source: 'peer' }
      ]
    };
    const result = strategy.score(input);
    if (result.strategy === 'MULTI_SOURCE') {
      const focus = result.byCompetency.find(c => c.competencyKey === 'Focus');
      expect(focus?.averagesBySource.self).toBeUndefined();
      expect(focus?.averagesBySource.peer).toBe(4);
      expect(focus?.othersAverage).toBe(4);
    }
  });

  it('uses "General" competency when traitCategory is missing', () => {
    const strategy = new MultiSourceScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_1',
      questions: [
        { id: 'q1', key: 'q1', traitCategory: '', weight: 1 }
      ],
      responses: [
        { questionId: 'q1', numericValue: 3, source: 'self' }
      ]
    };
    const result = strategy.score(input);
    if (result.strategy === 'MULTI_SOURCE') {
      expect(result.byCompetency.find(c => c.competencyKey === 'General')).toBeDefined();
    }
  });
});

describe('SUM_CORRECT — IQ / cognitive scoring', () => {
  it('counts correct answers and computes weighted score', () => {
    const strategy = new SumCorrectScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_iq',
      questions: [
        { id: 'q1', key: 'q_num', weight: 1, traitCategory: 'numerical', correctOptionId: 'opt_a' },
        { id: 'q2', key: 'q_verb', weight: 2, traitCategory: 'verbal', correctOptionId: 'opt_b' },
        { id: 'q3', key: 'q_logic', weight: 1.5, traitCategory: 'logical', correctOptionId: 'opt_c' },
      ],
      responses: [
        { questionId: 'q1', selectedOptionIds: ['opt_a'] },
        { questionId: 'q2', selectedOptionIds: ['wrong'] },
        { questionId: 'q3', selectedOptionIds: ['opt_c'] },
      ]
    };

    const result = strategy.score(input);
    expect(result.strategy).toBe('SUM_CORRECT');
    if (result.strategy === 'SUM_CORRECT') {
      expect(result.correctCount).toBe(2);
      expect(result.totalGraded).toBe(3);
      expect(result.weightedScore).toBe(2.5); // 1 + 1.5
    }
  });

  it('skips questions without correctOptionId', () => {
    const strategy = new SumCorrectScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_iq',
      questions: [
        { id: 'q1', key: 'q_nograd', weight: 1, traitCategory: 'general' }, // no correctOptionId
        { id: 'q2', key: 'q_graded', weight: 2, traitCategory: 'verbal', correctOptionId: 'opt_x' },
      ],
      responses: [
        { questionId: 'q1', selectedOptionIds: ['opt_a'] },
        { questionId: 'q2', selectedOptionIds: ['opt_x'] },
      ]
    };

    const result = strategy.score(input);
    if (result.strategy === 'SUM_CORRECT') {
      expect(result.totalGraded).toBe(1);
      expect(result.correctCount).toBe(1);
      expect(result.weightedScore).toBe(2);
    }
  });

  it('returns zero when all answers are wrong', () => {
    const strategy = new SumCorrectScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_iq',
      questions: [
        { id: 'q1', key: 'q1', weight: 1, traitCategory: 'general', correctOptionId: 'opt_correct' },
      ],
      responses: [
        { questionId: 'q1', selectedOptionIds: ['opt_wrong'] },
      ]
    };

    const result = strategy.score(input);
    if (result.strategy === 'SUM_CORRECT') {
      expect(result.correctCount).toBe(0);
      expect(result.totalGraded).toBe(1);
      expect(result.weightedScore).toBe(0);
    }
  });
});

describe('TRAIT_AGGREGATE — EQ / psychometric / TNA scoring', () => {
  it('aggregates numeric scores by trait category', () => {
    const strategy = new TraitAggregateScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_eq',
      questions: [
        { id: 'q1', key: 'q_sa', weight: 1, traitCategory: 'SelfAwareness' },
        { id: 'q2', key: 'q_sa2', weight: 1, traitCategory: 'SelfAwareness' },
        { id: 'q3', key: 'q_sr', weight: 1, traitCategory: 'SelfRegulation' },
      ],
      responses: [
        { questionId: 'q1', numericValue: 80 },
        { questionId: 'q2', numericValue: 60 },
        { questionId: 'q3', numericValue: 40 },
      ]
    };

    const result = strategy.score(input);
    expect(result.strategy).toBe('TRAIT_AGGREGATE');
    if (result.strategy === 'TRAIT_AGGREGATE') {
      expect(result.byTrait['SelfAwareness']).toBe(70); // (80+60)/2
      expect(result.byTrait['SelfRegulation']).toBe(40);
      expect(result.overall).toBe(60); // (80+60+40)/3
    }
  });

  it('uses "General" trait when traitCategory is empty', () => {
    const strategy = new TraitAggregateScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_tna',
      questions: [
        { id: 'q1', key: 'q1', weight: 1, traitCategory: '' },
      ],
      responses: [
        { questionId: 'q1', numericValue: 42 },
      ]
    };

    const result = strategy.score(input);
    if (result.strategy === 'TRAIT_AGGREGATE') {
      expect(result.byTrait['General']).toBe(42);
      expect(result.overall).toBe(42);
    }
  });

  it('skips NaN and undefined numericValues', () => {
    const strategy = new TraitAggregateScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_tna',
      questions: [
        { id: 'q1', key: 'q1', weight: 1, traitCategory: 'Leadership' },
        { id: 'q2', key: 'q2', weight: 1, traitCategory: 'Leadership' },
      ],
      responses: [
        { questionId: 'q1', numericValue: NaN },
        { questionId: 'q2', numericValue: 60 },
      ]
    };

    const result = strategy.score(input);
    if (result.strategy === 'TRAIT_AGGREGATE') {
      expect(result.byTrait['Leadership']).toBe(60);
      expect(result.overall).toBe(60);
    }
  });

  it('returns zero overall for empty responses', () => {
    const strategy = new TraitAggregateScoring();
    const input: ScoringInput = {
      templateId: 'tmpl_tna',
      questions: [
        { id: 'q1', key: 'q1', weight: 1, traitCategory: 'Communication' },
      ],
      responses: []
    };

    const result = strategy.score(input);
    if (result.strategy === 'TRAIT_AGGREGATE') {
      expect(Object.keys(result.byTrait).length).toBe(0);
      expect(result.overall).toBe(0);
    }
  });
});
