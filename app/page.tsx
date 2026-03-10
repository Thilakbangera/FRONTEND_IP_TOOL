"use client";

import Link from "next/link";
import { Shell } from "../components/Shell";
import { HoverCard } from "../components/Cards";
import { OnboardingModal, useOnboarding } from "../components/Onboarding";
import { AuthGuard } from "../components/AuthGuard";

export default function HomePage() {
  const tour = useOnboarding();

  return (
    <AuthGuard>
    <Shell
      title="Choose your workspace"
      subtitle="A consistent environment for preparing formal responses and submissions. Designed to support structured drafting workflows with clarity, stability, and predictable output."
      active="home"
    >
      <OnboardingModal open={tour.open} onClose={tour.closeTour} />

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/fer" className="group">
          <HoverCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs text-stone-700">
                Response
                </div>
                <h2 className="mt-3 text-xl font-semibold text-stone-900">FER Reply Generator</h2>
                <p className="mt-2 text-sm text-stone-600">
                  Upload FER/CS/claims documents, provide prior-art inputs, and generate a DOCX reply.
                </p>
              </div>
              <div className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow group-hover:shadow">
                Open→
              </div>
            </div>
          </HoverCard>
        </Link>

        <Link href="/ws" className="group">
          <HoverCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs text-stone-700">
                Response
                </div>
                <h2 className="mt-3 text-xl font-semibold text-stone-900">WS Generator</h2>
                <p className="mt-2 text-sm text-stone-600">
                  Upload HN/Specification/Claims documents, add prior arts and diagrams, then generate Written Submission DOCX.
                </p>
              </div>
              <div className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow group-hover:shadow">
                Open→
              </div>
            </div>
          </HoverCard>
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Feature title="Drafting Studio" desc="One clean workspace for two generators—FER Reply and WS—without context switching." />
        <Feature title="A Product of Lextria Research" desc="Where Innovation Meets Legal Excellence" />
        <Feature title="Composed Interface" desc="Uploads, execution, delivery — without clutter." />
      </div>

      <div className="mt-10">
        <button
          onClick={tour.openTour}
          className="rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-sm text-stone-800 shadow-sm backdrop-blur hover:bg-white"
        >
          Open tour
        </button>
      </div>
    </Shell>
    </AuthGuard>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{desc}</p>
    </div>
  );
}
