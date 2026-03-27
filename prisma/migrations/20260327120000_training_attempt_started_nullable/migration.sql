-- Timer should start when the learner opens the attempt, not when the cohort is launched.
ALTER TABLE "TrainingAttempt" ALTER COLUMN "startedAt" DROP NOT NULL;
ALTER TABLE "TrainingAttempt" ALTER COLUMN "startedAt" DROP DEFAULT;
