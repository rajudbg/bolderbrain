"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                opacity: { duration: 0.2 },
                y: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
              }
        }
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
