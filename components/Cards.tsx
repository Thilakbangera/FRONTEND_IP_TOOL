"use client";

import { motion } from "framer-motion";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">{children}</div>;
}

export function HoverCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="rounded-3xl border border-stone-200 bg-white/70 p-7 shadow-soft backdrop-blur"
    >
      {children}
    </motion.div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-stone-900">{children}</div>;
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-xs text-stone-500">{children}</div>;
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-900 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
