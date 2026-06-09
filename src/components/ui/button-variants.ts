import { cva, type VariantProps } from "class-variance-authority";

/** Shared CVA styles — Cerebral Glass "Neural Node" primary + glass outlines. Safe for Server Components. */
export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-600 text-white shadow-[0_0_18px_rgba(99,102,241,0.25)] hover:brightness-110 hover:shadow-[0_0_24px_rgba(168,85,247,0.35)] active:brightness-95 dark:from-indigo-500 dark:via-purple-600 dark:to-pink-500 [a]:hover:opacity-95",
        outline:
          "rounded-2xl border-white/20 bg-white/[0.06] text-foreground backdrop-blur-xl hover:border-white/30 hover:bg-white/[0.10] dark:border-white/20 dark:bg-white/[0.06]",
        secondary:
          "rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "rounded-2xl hover:bg-white/[0.08] hover:text-foreground aria-expanded:bg-white/[0.10] dark:hover:bg-white/[0.08]",
        destructive:
          "rounded-2xl bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "rounded-md text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-xl px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-xl has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10 rounded-2xl",
        "icon-xs":
          "size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-xl in-data-[slot=button-group]:rounded-xl",
        "icon-lg": "size-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

