"use client";

import { TrainingContentQuestionType } from "@/generated/prisma/enums";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type OptionRow = { id: string; text: string; value: number };

export function TrainingQuestionCard({
  index,
  total,
  text,
  type,
  options,
  selectedIds,
  onChangeSelected,
  flagged,
  onFlag,
}: {
  index: number;
  total: number;
  text: string;
  type: TrainingContentQuestionType;
  options: OptionRow[];
  selectedIds: string[];
  onChangeSelected: (ids: string[]) => void;
  flagged?: boolean;
  onFlag?: (v: boolean) => void;
}) {
  const isKnowledge =
    type === TrainingContentQuestionType.SINGLE_CHOICE || type === TrainingContentQuestionType.MULTIPLE_CHOICE;
  const isMulti = type === TrainingContentQuestionType.MULTIPLE_CHOICE;
  const isLikert =
    type === TrainingContentQuestionType.LIKERT_5_SCALE ||
    type === TrainingContentQuestionType.LIKERT_FREQUENCY;

  function toggle(id: string) {
    if (isMulti) {
      const set = new Set(selectedIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      onChangeSelected([...set]);
    } else {
      onChangeSelected([id]);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className="text-caption-cerebral text-[10px] text-white/40">
        Question {index + 1} of {total}
      </p>
      <p className="mt-3 text-base leading-relaxed text-white/90">{text}</p>

      {isKnowledge && (
        <div className="mt-6 space-y-2">
          {isMulti && <p className="text-xs text-white/45">Select all that apply.</p>}
          {options.map((o) => (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]",
                selectedIds.includes(o.id) && "border-indigo-400/40 bg-indigo-500/10",
              )}
            >
              {isMulti ? (
                <Checkbox
                  checked={selectedIds.includes(o.id)}
                  onCheckedChange={() => toggle(o.id)}
                  className="mt-0.5"
                />
              ) : (
                <input
                  type="radio"
                  name={`q-${index}`}
                  checked={selectedIds.includes(o.id)}
                  onChange={() => toggle(o.id)}
                  className="mt-1 size-4 accent-indigo-500"
                />
              )}
              <span className="text-sm text-white/85">{o.text}</span>
            </label>
          ))}
        </div>
      )}

      {isLikert && (
        <div className="mt-6 flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onChangeSelected([o.id])}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                selectedIds.includes(o.id)
                  ? "border-amber-400/50 bg-amber-500/15 text-amber-50"
                  : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]",
              )}
            >
              {o.text}
            </button>
          ))}
        </div>
      )}

      {type === TrainingContentQuestionType.SEMANTIC_DIFFERENTIAL && (
        <p className="mt-4 text-xs text-white/45">Semantic scale — use Likert options for now.</p>
      )}

      {onFlag && (
        <label className="mt-6 flex cursor-pointer items-center gap-2 text-xs text-white/45">
          <Checkbox checked={flagged} onCheckedChange={(v) => onFlag(v === true)} />
          Flag for review
        </label>
      )}
    </div>
  );
}
