"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const LS_ONBOARD = "iptools_hasSeenOnboarding_v1";

export function useOnboarding() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const seen = localStorage.getItem(LS_ONBOARD) === "true";
    setOpen(!seen);
  }, []);
  return {
    open,
    openTour: () => setOpen(true),
    closeTour: () => {
      localStorage.setItem(LS_ONBOARD, "true");
      setOpen(false);
    },
  };
}

export function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    { t: "Pick a tool", d: "Select FER or WS from the Home page (or the top pills)." },
    { t: "Upload documents", d: "Use drag & drop. Files show name + size immediately." },
    { t: "Live checklist", d: "Required fields turn ready before you can generate." },
    { t: "Generate", d: "Clear status indicators: parsing / generating / done." },
    { t: "Download", d: "A download button appears instantly when output is ready." },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-6 shadow-xl"
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.985, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-stone-500">First-time guide</div>
                <h3 className="mt-1 text-lg font-semibold text-stone-900">How it works</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-stone-200 px-3 py-1 text-sm text-stone-700 hover:bg-stone-50"
              >
                Done
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="text-sm font-medium text-stone-900">
                    {i + 1}. {s.t}
                  </div>
                  <div className="mt-1 text-sm text-stone-600">{s.d}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
