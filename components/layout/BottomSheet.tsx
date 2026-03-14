"use client";

import { useCallback } from "react";
import { motion, PanInfo } from "framer-motion";

import { useUIStore } from "@/store/useUIStore";

const OVERLAY_OPACITY = 0.3;

export const LOG_SHEET_TRANSITION = {
  type: "tween" as const,
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1] as const,
};

interface BottomSheetProps {
  children: React.ReactNode;
  title?: string;
  /** Max height of the sheet panel (default 85vh). Overlay matches this so city remains visible above. */
  maxHeight?: string;
  /** Optional transition override (e.g. for Log sheet: 300ms cubic-bezier). */
  transition?: { type: "tween"; duration: number; ease: readonly [number, number, number, number] };
}

export function BottomSheet({
  children,
  title,
  maxHeight = "85vh",
  transition: transitionOverride,
}: BottomSheetProps) {
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);

  const close = useCallback(() => {
    setActiveSheet(null);
  }, [setActiveSheet]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.velocity.y > 300 || info.offset.y > 80) {
        close();
      }
    },
    [close]
  );

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Overlay only behind sheet (bottom 85vh) so city stays visible at top */}
      <div
        role="presentation"
        className="absolute left-0 right-0 bottom-0"
        style={{ height: maxHeight }}
        onClick={close}
        aria-hidden
      >
        <div
          className="h-full w-full"
          style={{
            backgroundColor: `rgba(44, 36, 22, ${OVERLAY_OPACITY})`,
          }}
        />
      </div>
      <motion.div
        role="dialog"
        aria-modal
        aria-label={title ?? "Panel"}
        className="relative z-50 flex max-h-[85vh] flex-col rounded-t-[24px] shadow-card"
        style={{
          maxHeight,
          paddingBottom: "env(safe-area-inset-bottom)",
          backgroundColor: "#FFFFFF",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%", transition: { duration: 0.25, ease: "easeIn" } }}
        transition={
          transitionOverride ?? {
            type: "tween" as const,
            duration: 0.3,
            ease: [0.32, 0.72, 0, 1] as const,
          }
        }
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-2">
          <div className="h-1 w-9 rounded-full" style={{ backgroundColor: "#C8BFA8" }} aria-hidden />
        </div>
        {title != null && title !== "" && (
          <h2 className="px-4 pb-2 font-heading text-lg font-normal" style={{ color: "#1C3A2E" }}>
            {title}
          </h2>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
