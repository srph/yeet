import type { ReactNode } from "react";
import { motion } from "motion/react";

function EnterFadeUp({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0, delay }}
    >
      {children}
    </motion.div>
  );
}

export { EnterFadeUp };
