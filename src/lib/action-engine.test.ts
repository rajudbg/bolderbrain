import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserActionStatus } from '@/generated/prisma/enums';

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockFindFirst = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockCreateMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    competencyScoreSnapshot: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    userAction: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    competency: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    action: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    userDevelopmentStreak: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
    organizationMember: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import { getCompetencyTrendsForUser, maybeUpdateStreakAfterUserActionChange } from './action-engine';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockReset();
  mockFindUnique.mockReset();
  mockUpsert.mockReset();
  mockFindFirst.mockReset();
  mockCount.mockReset();
  mockCreate.mockReset();
  mockCreateMany.mockReset();
});

describe('getCompetencyTrendsForUser', () => {
  it('computes delta from previous snapshots', async () => {
    mockFindMany
      .mockResolvedValueOnce([
        // current snapshots
        { competencyKey: 'Communication', othersAverage: 3.5 },
        { competencyKey: 'Leadership', othersAverage: 4.0 },
      ])
      .mockResolvedValueOnce([
        // previous snapshots (most recent first)
        { competencyKey: 'Communication', othersAverage: 3.0, assessmentId: 'old' },
        { competencyKey: 'Communication', othersAverage: 2.8, assessmentId: 'older' },
        { competencyKey: 'Leadership', othersAverage: 4.2, assessmentId: 'old' },
      ]);

    const trends = await getCompetencyTrendsForUser('user1', 'currentAssess1');

    expect(mockFindMany).toHaveBeenCalledTimes(2);
    expect(trends).toHaveLength(2);

    // Communication: 3.5 - 3.0 = 0.5 (takes first previous)
    const comm = trends.find(t => t.competencyKey === 'Communication');
    expect(comm?.othersAverage).toBe(3.5);
    expect(comm?.deltaFromPrevious).toBe(0.5);

    // Leadership: 4.0 - 4.2 = -0.2
    const lead = trends.find(t => t.competencyKey === 'Leadership');
    expect(lead?.othersAverage).toBe(4.0);
    expect(lead?.deltaFromPrevious).toBeCloseTo(-0.2, 5);
  });

  it('returns empty array when no current snapshots exist', async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const trends = await getCompetencyTrendsForUser('user1', 'currentAssess1');

    expect(trends).toEqual([]);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it('returns null delta when no previous snapshots for a competency', async () => {
    mockFindMany
      .mockResolvedValueOnce([
        { competencyKey: 'NewCompetency', othersAverage: 3.0 },
      ])
      .mockResolvedValueOnce([]);

    const trends = await getCompetencyTrendsForUser('user1', 'currentAssess1');

    expect(trends[0]?.deltaFromPrevious).toBeNull();
    expect(trends[0]?.othersAverage).toBe(3.0);
  });
});

describe('maybeUpdateStreakAfterUserActionChange', () => {
  it('does nothing when user has no actions for the week', async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await maybeUpdateStreakAfterUserActionChange('user1', '2026-W20');

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('does nothing when not all actions are completed/dismissed', async () => {
    mockFindMany.mockResolvedValueOnce([
      { status: UserActionStatus.COMPLETED },
      { status: UserActionStatus.ASSIGNED },
    ]);

    await maybeUpdateStreakAfterUserActionChange('user1', '2026-W20');

    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('creates a new streak when all actions are done and no prior streak', async () => {
    mockFindMany.mockResolvedValueOnce([
      { status: UserActionStatus.COMPLETED },
      { status: UserActionStatus.DISMISSED },
    ]);
    mockFindUnique.mockResolvedValueOnce(null);
    mockUpsert.mockResolvedValueOnce({});

    await maybeUpdateStreakAfterUserActionChange('user1', '2026-W20');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user1' },
        create: expect.objectContaining({
          userId: 'user1',
          consecutiveWeeksCompleted: 1,
          lastCountedWeekKey: '2026-W20',
        }),
      })
    );
  });

  it('increments streak when previous week was counted', async () => {
    mockFindMany.mockResolvedValueOnce([
      { status: UserActionStatus.COMPLETED },
    ]);
    mockFindUnique.mockResolvedValueOnce({
      userId: 'user1',
      consecutiveWeeksCompleted: 3,
      lastCountedWeekKey: '2026-W19',
    });
    mockUpsert.mockResolvedValueOnce({});

    await maybeUpdateStreakAfterUserActionChange('user1', '2026-W20');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          consecutiveWeeksCompleted: 4,
        }),
      })
    );
  });

  it('resets streak to 1 when gap in weeks', async () => {
    mockFindMany.mockResolvedValueOnce([
      { status: UserActionStatus.COMPLETED },
    ]);
    mockFindUnique.mockResolvedValueOnce({
      userId: 'user1',
      consecutiveWeeksCompleted: 5,
      lastCountedWeekKey: '2026-W18', // gap
    });
    mockUpsert.mockResolvedValueOnce({});

    await maybeUpdateStreakAfterUserActionChange('user1', '2026-W20');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          consecutiveWeeksCompleted: 1,
        }),
      })
    );
  });

  it('skips when this week was already counted', async () => {
    mockFindMany.mockResolvedValueOnce([
      { status: UserActionStatus.COMPLETED },
    ]);
    mockFindUnique.mockResolvedValueOnce({
      userId: 'user1',
      consecutiveWeeksCompleted: 3,
      lastCountedWeekKey: '2026-W20',
    });

    await maybeUpdateStreakAfterUserActionChange('user1', '2026-W20');

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
