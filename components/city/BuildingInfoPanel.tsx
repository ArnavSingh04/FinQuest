"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

import type { CityStructureInfo } from "@/types";

interface BuildingInfoPanelProps {
  selectedBuilding: CityStructureInfo | null;
  onClose: () => void;
}

export function BuildingInfoPanel({
  selectedBuilding,
  onClose,
}: BuildingInfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedBuilding) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      onClose();
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [onClose, selectedBuilding]);

  if (!selectedBuilding) {
    return null;
  }

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card pointer-events-auto absolute bottom-4 right-4 z-20 w-full max-w-sm rounded-2xl p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{selectedBuilding.title}</p>
          <p className="mt-1 text-sm text-sky-300">
            {selectedBuilding.category} · score {selectedBuilding.metricValue}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white"
        >
          Close
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {selectedBuilding.description}
      </p>
    </motion.div>
  );
}
