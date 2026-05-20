"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Cpu, Loader2 } from "lucide-react";
import { setAiModel } from "../../actions";
import { modelDisplayName, type OPENROUTER_MODEL_OPTIONS } from "@/lib/ai/model-options";
import { cn } from "@/lib/utils";

type ModelOption = (typeof OPENROUTER_MODEL_OPTIONS)[number];

export function ModelSelector({
  currentModelId,
  options,
}: {
  currentModelId: string;
  options: readonly ModelOption[];
}) {
  const [pending, startTransition] = useTransition();
  const currentDisplay = modelDisplayName(currentModelId);

  function handleChange(value: string) {
    if (value === currentModelId) return;
    startTransition(async () => {
      try {
        await setAiModel(value);
        toast.success(`Switched to ${modelDisplayName(value)}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to switch model");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-cyan-500/15 bg-[#0A0A0C] p-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
          <Cpu className="size-5 text-cyan-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white">{currentDisplay}</div>
          <div className="truncate font-mono text-xs text-white/50">{currentModelId}</div>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          Operational
        </span>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-xs text-white/40 transition-colors hover:text-white/60">
          Change model
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0A0A0C] p-1">
          {options.map((model) => {
            const active = model.value === currentModelId;
            return (
              <button
                key={model.value}
                type="button"
                disabled={pending}
                onClick={() => handleChange(model.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-cyan-500/10 text-cyan-200"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/80",
                  pending && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex-1 truncate">{model.label}</span>
                <span className="shrink-0 font-mono text-[10px] text-white/30">
                  {model.value.split("/").pop()}
                </span>
                {active && <Check className="size-3.5 shrink-0 text-cyan-400" />}
                {pending && <Loader2 className="size-3.5 shrink-0 animate-spin text-white/40" />}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
