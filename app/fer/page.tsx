"use client";

import { useMemo, useState } from "react";
import { Shell } from "../../components/Shell";
import { Card, Label, Hint, PrimaryButton, SecondaryButton } from "../../components/Cards";
import { UploadOne } from "../../components/Upload";
import { responseToDownload } from "../../lib/download";

type GenState = "idle" | "parsing" | "generating" | "done" | "error";

const DEFAULT_OFFICE_ADDRESS =
  "THE PATENT OFFICE\nI.P.O BUILDING\nG.S.T.Road, Guindy\nChennai - [PIN]";

export default function FerPage() {
  const [ferPdf, setFerPdf] = useState<File | null>(null);
  const [csPdf, setCsPdf] = useState<File | null>(null);
  const [amendedClaimsPdf, setAmendedClaimsPdf] = useState<File | null>(null);

  const [agent, setAgent] = useState("");
  const [officeAddress, setOfficeAddress] = useState(DEFAULT_OFFICE_ADDRESS);
  const [dxRange, setDxRange] = useState("D1-Dn");
  const [dxDisclosedFeatures, setDxDisclosedFeatures] = useState("");

  const [state, setState] = useState<GenState>("idle");
  const [error, setError] = useState("");
  const [parseJson, setParseJson] = useState<any>(null);
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);

  const canParse = useMemo(() => !!ferPdf && (state === "idle" || state === "error"), [ferPdf, state]);
  const canGenerate = useMemo(
    () => !!ferPdf && !!csPdf && !!amendedClaimsPdf && (state === "idle" || state === "error"),
    [ferPdf, csPdf, amendedClaimsPdf, state]
  );

  async function parseFer() {
    setError("");
    setParseJson(null);
    setDownload(null);
    setState("parsing");
    try {
      const form = new FormData();
      // Keys must match your backend (from your earlier Streamlit app)
      form.append("fer_pdf", ferPdf!);

      const res = await fetch("/api/fer/api/parse_fer", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text().catch(() => `Parse failed (${res.status})`));
      const json = await res.json();
      setParseJson(json);
      setState("idle");
    } catch (e: any) {
      setError(e?.message || "Parse failed");
      setState("error");
    }
  }

  async function generate() {
    setError("");
    setDownload(null);
    setState("generating");
    try {
      const form = new FormData();
      // Files
      form.append("fer_pdf", ferPdf!);
      form.append("cs_pdf", csPdf!);
      form.append("amended_claims_pdf", amendedClaimsPdf!);

      // Text fields (match earlier UI)
      form.append("title", "");
      form.append("agent", agent || "");
      form.append("office_address", officeAddress);
      form.append("dx_range", dxRange);
      form.append("dx_disclosed_features", dxDisclosedFeatures);

      const res = await fetch("/api/fer/api/generate_reply", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text().catch(() => `Generate failed (${res.status})`));

      const dl = await responseToDownload(res, "FER_Reply_Draft.docx");
      setDownload({ url: dl.url, filename: dl.filename });
      setState("done");
    } catch (e: any) {
      setError(e?.message || "Generate failed");
      setState("error");
    }
  }

  const checklist = [
    { k: "FER PDF", ok: !!ferPdf },
    { k: "CS PDF", ok: !!csPdf },
    { k: "Amended Claims PDF", ok: !!amendedClaimsPdf },
  ];

  return (
    <Shell
      title="FER Reply Generator"
      subtitle="Review the extracted content before generating the FER reply document."
      active="fer"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <UploadOne
          label="FER PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={ferPdf}
          onFile={setFerPdf}
          helper="Backend key: fer_pdf"
        />
        <UploadOne
          label="Complete Specification (CS) PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={csPdf}
          onFile={setCsPdf}
          helper="Backend key: cs_pdf"
        />
        <UploadOne
          label="Amended Claims PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={amendedClaimsPdf}
          onFile={setAmendedClaimsPdf}
          helper="Backend key: amended_claims_pdf"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-stone-900">Checklist</div>
              <div className="mt-1 text-sm text-stone-600">Required items must be present to generate.</div>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700">
              {checklist.filter((c) => c.ok).length}/{checklist.length} ready
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {checklist.map((c) => (
              <div key={c.k} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3">
                <div className="text-sm text-stone-700">{c.k}</div>
                <div className={["text-xs font-medium", c.ok ? "text-emerald-700" : "text-amber-700"].join(" ")}>
                  {c.ok ? "Ready" : "Missing"}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <SecondaryButton disabled={!canParse} onClick={parseFer}>
              {state === "parsing" ? "Parsing…" : "Parse FER (Preview JSON)"} 
            </SecondaryButton>
            <PrimaryButton disabled={!canGenerate} onClick={generate}>
              {state === "generating" ? "Generating…" : "Generate FER Reply DOCX"}
            </PrimaryButton>

            {download && (
              <a
                href={download.url}
                download={download.filename}
                className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-900 shadow-sm hover:bg-stone-50"
              >
                Download
              </a>
            )}
          </div>

          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
          {state === "generating" ? <div className="mt-4 text-xs text-stone-500 shimmer">Working…</div> : null}
        </Card>

        <Card>
          <div className="text-sm font-semibold text-stone-900">Extra Required Fields</div>
          <Hint>These map 1:1 to your backend form fields.</Hint>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Patent agent name</Label>
              <input
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
                placeholder="Agent"
              />
            </div>
            <div>
              <Label>Dx range</Label>
              <input
                value={dxRange}
                onChange={(e) => setDxRange(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Dx disclosed features</Label>
            <textarea
              value={dxDisclosedFeatures}
              onChange={(e) => setDxDisclosedFeatures(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
              rows={6}
              placeholder="Paste disclosed features text…"
            />
          </div>

          <div className="mt-4">
            <Label>Patent office address</Label>
            <textarea
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
              rows={6}
            />
          </div>
        </Card>
      </div>

      {parseJson ? (
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-stone-900">Parsed JSON Preview</div>
              <div className="mt-1 text-sm text-stone-600">From /api/fer/api/parse_fer</div>
            </div>
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-800">
{JSON.stringify(parseJson, null, 2)}
          </pre>
        </div>
      ) : null}
    </Shell>
  );
}
