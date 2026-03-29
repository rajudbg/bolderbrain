import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  Flame,
  Heart,
  Leaf,
  Search,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  UserCog,
  Users,
  XCircle,
  Gauge,
} from "lucide-react";

// Status labels with icons and colors
export type StatusConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "outline" | "destructive";
};

export const statusLabels: Record<string, StatusConfig> = {
  // Training need statuses
  OPEN: {
    label: "Open",
    color: "text-amber-400",
    icon: Circle,
    variant: "outline",
  },
  ASSIGNED: {
    label: "Assigned",
    color: "text-blue-400",
    icon: UserCheck,
    variant: "secondary",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-indigo-400",
    icon: Clock,
    variant: "secondary",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-emerald-400",
    icon: CheckCircle,
    variant: "default",
  },
  // User action statuses
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-400",
    icon: CheckCircle2,
    variant: "default",
  },
  DISMISSED: {
    label: "Dismissed",
    color: "text-slate-400",
    icon: XCircle,
    variant: "outline",
  },
  INVITED: {
    label: "Invited",
    color: "text-blue-400",
    icon: User,
    variant: "outline",
  },
  PRE_COMPLETED: {
    label: "Pre Completed",
    color: "text-indigo-400",
    icon: CheckCircle,
    variant: "secondary",
  },
  TRAINING_COMPLETED: {
    label: "Training Done",
    color: "text-emerald-400",
    icon: CheckCircle,
    variant: "secondary",
  },
  POST_COMPLETED: {
    label: "Post Completed",
    color: "text-emerald-500",
    icon: CheckCircle2,
    variant: "default",
  },
};

export function getStatusConfig(status: string): StatusConfig {
  return (
    statusLabels[status] ?? {
      label: status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "text-slate-400",
      icon: Circle,
      variant: "outline",
    }
  );
}

// Source labels
export type SourceConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
};

export const sourceLabels: Record<string, SourceConfig> = {
  TNA_ASSESSMENT: {
    label: "TNA Assessment",
    color: "text-purple-400",
    icon: ClipboardList,
  },
  MANAGER_NOMINATION: {
    label: "Manager Nomination",
    color: "text-amber-400",
    icon: UserCog,
  },
  SELF_IDENTIFIED: {
    label: "Self-Identified",
    color: "text-cyan-400",
    icon: User,
  },
};

export function getSourceLabel(source: string): SourceConfig {
  return (
    sourceLabels[source] ?? {
      label: source.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "text-slate-400",
      icon: ClipboardList,
    }
  );
}

// Difficulty labels
export type DifficultyConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "outline" | "destructive";
};

export const difficultyLabels: Record<string, DifficultyConfig> = {
  HARD: {
    label: "Hard",
    color: "text-rose-400",
    icon: Flame,
    variant: "destructive",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-amber-400",
    icon: Gauge,
    variant: "secondary",
  },
  EASY: {
    label: "Easy",
    color: "text-emerald-400",
    icon: Leaf,
    variant: "outline",
  },
};

export function getDifficultyConfig(difficulty: string): DifficultyConfig {
  return (
    difficultyLabels[difficulty] ?? {
      label: difficulty.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "text-slate-400",
      icon: Gauge,
      variant: "outline",
    }
  );
}

// Template type labels
export type TemplateTypeConfig = {
  label: string;
  icon: LucideIcon;
  description?: string;
};

export const templateTypeLabels: Record<string, TemplateTypeConfig> = {
  BEHAVIORAL_360: {
    label: "Behavioral 360°",
    icon: Users,
    description: "Multi-rater feedback assessment",
  },
  IQ_COGNITIVE: {
    label: "IQ Cognitive",
    icon: Brain,
    description: "Cognitive ability testing",
  },
  EQ_ASSESSMENT: {
    label: "EQ Assessment",
    icon: Heart,
    description: "Emotional intelligence evaluation",
  },
  PSYCHOMETRIC: {
    label: "Psychometric",
    icon: BarChart3,
    description: "Personality trait assessment",
  },
  TNA_DIAGNOSTIC: {
    label: "TNA Diagnostic",
    icon: Search,
    description: "Training needs analysis",
  },
};

export function getTemplateTypeLabel(type: string): TemplateTypeConfig {
  return (
    templateTypeLabels[type] ?? {
      label: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      icon: ClipboardList,
    }
  );
}

// Gap severity
export type SeverityConfig = {
  label: string;
  bgColor: string;
  textColor: string;
  icon: LucideIcon;
};

export const severityLabels: Record<string, SeverityConfig> = {
  CRITICAL: {
    label: "Critical",
    bgColor: "bg-rose-500/75",
    textColor: "text-white",
    icon: AlertCircle,
  },
  HIGH: {
    label: "High",
    bgColor: "bg-amber-500/65",
    textColor: "text-black",
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: "Medium",
    bgColor: "bg-white/10",
    textColor: "text-white/80",
    icon: Gauge,
  },
  LOW: {
    label: "Low",
    bgColor: "bg-white/10",
    textColor: "text-white/80",
    icon: Circle,
  },
  MET: {
    label: "Met",
    bgColor: "bg-emerald-500/50",
    textColor: "text-black",
    icon: CheckCircle,
  },
  EXCEEDS: {
    label: "Exceeds",
    bgColor: "bg-sky-500/55",
    textColor: "text-white",
    icon: TrendingUp,
  },
};

export function getSeverityConfig(severity: string): SeverityConfig {
  return (
    severityLabels[severity] ?? {
      label: severity.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      bgColor: "bg-white/10",
      textColor: "text-white/80",
      icon: Circle,
    }
  );
}

// Question type labels
export const questionTypeLabels: Record<string, string> = {
  LIKERT_360: "Likert Scale (360)",
  SINGLE_CHOICE_IQ: "Single Choice",
  MULTI_CHOICE_IQ: "Multiple Choice",
  FREE_TEXT: "Free Text",
  TEXT_SHORT: "Short Text",
  EQ_SELF_REPORT: "EQ Self-Report",
  EQ_SCENARIO: "EQ Scenario",
  PSYCHOMETRIC_LIKERT: "Psychometric Likert",
  FORCED_CHOICE_IPSATIVE: "Forced Choice (Ipsative)",
  SEMANTIC_DIFFERENTIAL: "Semantic Differential",
  NUMERICAL_SEQUENCE: "Numerical Sequence",
  VERBAL_ANALOGY: "Verbal Analogy",
  LOGICAL_PATTERN: "Logical Pattern",
  SPATIAL_REASONING: "Spatial Reasoning",
};

export function getQuestionTypeLabel(type: string): string {
  return questionTypeLabels[type] ?? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}
