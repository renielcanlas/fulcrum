"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const workflow = [
  ["Draft", "slate"],
  ["Submitted", "blue"],
  ["Information Gathering", "amber"],
  ["FCRM Assessment", "teal"],
  ["Analyst Review", "purple"],
  ["Decision Ready", "indigo"],
  ["Committee Review", "orange"],
  ["Approved with Conditions", "green"],
];

const navItems = [
  "Board",
  "Initiatives",
  "Evidence & lineage",
  "Risk & controls",
  "Decisions",
];
const tones = {
  slate: "bg-slate-400",
  blue: "bg-blue-400",
  amber: "bg-amber-400",
  teal: "bg-[rgb(9,167,141)]",
  purple: "bg-purple-400",
  indigo: "bg-indigo-400",
  orange: "bg-orange-400",
  green: "bg-[rgb(82,224,129)]",
};

export default function DemoPage() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    "Hi, I’m Ciel. I can help you understand this initiative and its decision trail.",
  ]);
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((response) => response.json())
      .then((data) => {
        if (data.user) setSignedIn(data.user);
        else router.replace("/");
      });
  }, [router]);

  async function ask(event) {
    event.preventDefault();
    if (!question.trim() || !signedIn || busy) return;
    const text = question;
    setQuestion("");
    setMessages((current) => [...current, `You: ${text}`]);
    setBusy(true);
    try {
      const response = await fetch("/api/copilot/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assessmentId: "FA-2026-00124", message: text }),
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        `Ciel: ${data.answer ?? data.error}`,
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function loadTrace() {
    const response = await fetch("/api/initiatives/INIT-2026-0007/trace");
    setTrace(await response.json());
  }

  if (!signedIn)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f7] text-sm text-slate-500">
        Preparing the synthetic demo…
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f5f7f7] text-[rgb(25,66,71)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(12,34,38,0.97)] text-white shadow-lg shadow-slate-900/10 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-base font-bold tracking-[0.2em]"
            >
              FULCRUM
            </button>
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <span className="hidden text-sm text-white/60 sm:block">
              FCRM workbench
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden rounded-full bg-white/10 px-3 py-1.5 text-white/75 sm:inline">
              Synthetic demo
            </span>
            <span className="hidden text-white/70 md:inline">
              {signedIn.displayName}
            </span>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg border border-white/25 px-3 py-2 font-semibold transition hover:border-[rgb(82,224,129)] hover:text-[rgb(82,224,129)]"
            >
              Exit
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
          <div className="mb-7 px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">
              Workspace
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Risk operations
            </p>
          </div>
          <nav className="space-y-1" aria-label="Demo navigation">
            {navItems.map((label, index) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${index === 0 ? "bg-[rgba(9,167,141,0.11)] text-[rgb(25,66,71)]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-lg text-base ${index === 0 ? "bg-[rgb(9,167,141)] text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {["▦", "◫", "⌁", "◈", "✓"][index]}
                </span>
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-[rgba(12,34,38,0.95)] p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(82,224,129)]">
              Guided demo
            </p>
            <p className="mt-2 text-sm leading-5 text-white/70">
              Follow the initiative from intake to a governed committee
              decision.
            </p>
          </div>
        </aside>
        <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">
                Interactive synthetic workspace
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Initiative board
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                See how FULCRUM coordinates Product, FCRM and Committee Review
                across a traceable lifecycle.
              </p>
            </div>
            <button
              onClick={() => setChatOpen(true)}
              className="hidden rounded-lg bg-[rgb(82,224,129)] px-4 py-2.5 text-sm font-bold text-[rgb(12,34,38)] shadow-sm transition hover:bg-[rgb(110,235,151)] sm:block"
            >
              Ask Ciel
            </button>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["1", "Active initiative"],
              ["8", "Workflow stages"],
              ["11", "Risk areas"],
              ["100%", "Human decision gate"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-2xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <section
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            aria-label="Initiative board"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-950">
                  All initiatives{" "}
                  <span className="ml-1 text-sm font-medium text-slate-400">
                    1
                  </span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Canonical Golden Initiative demo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  All owners
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  All risk levels
                </span>
              </div>
            </div>
            <div className="overflow-x-auto p-4">
              <div className="flex min-w-[1500px] gap-3">
                {workflow.map(([label, tone]) => (
                  <div
                    key={label}
                    className="w-[178px] shrink-0 rounded-xl bg-slate-50 p-2.5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2 px-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`mt-0.5 h-2 w-2 rounded-full ${tones[tone]}`}
                        />
                        <h3 className="text-xs font-bold leading-4 text-slate-700">
                          {label}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        {label === "Approved with Conditions" ? 1 : 0}
                      </span>
                    </div>
                    {label === "Approved with Conditions" ? (
                      <InitiativeCard onOpen={loadTrace} />
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-[11px] text-slate-400">
                        No initiatives
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
          {trace && <TracePanel trace={trace} />}
        </section>
      </div>
      <button
        onClick={() => setChatOpen(true)}
        aria-label="Open AI chat"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[rgb(82,224,129)] text-xl font-bold text-[rgb(12,34,38)] shadow-xl shadow-[rgba(9,167,141,0.3)] transition hover:scale-105 hover:bg-[rgb(110,235,151)]"
      >
        ✦
      </button>
      {chatOpen && (
        <ChatPanel
          question={question}
          setQuestion={setQuestion}
          messages={messages}
          busy={busy}
          ask={ask}
          onClose={() => setChatOpen(false)}
        />
      )}
    </main>
  );
}

function InitiativeCard({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[rgb(9,167,141)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] font-bold text-slate-400">
          INIT-2026-0007
        </span>
        <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
          High
        </span>
      </div>
      <h4 className="mt-2 text-sm font-bold leading-5 text-slate-900 group-hover:text-[rgb(9,167,141)]">
        Launch U.S.–Philippines Instant Remittance
      </h4>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">
        New Product Launch + Geographic Expansion
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        <span className="rounded bg-slate-100 px-1.5 py-1 text-[10px] font-medium text-slate-500">
          Cross-border
        </span>
        <span className="rounded bg-slate-100 px-1.5 py-1 text-[10px] font-medium text-slate-500">
          Payments
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[rgba(9,167,141,0.15)] text-[9px] text-[rgb(25,66,71)]">
            DR
          </span>
          Daniel Reyes
        </span>
        <span className="text-[10px] text-slate-400">Today</span>
      </div>
    </button>
  );
}

function ChatPanel({ question, setQuestion, messages, busy, ask, onClose }) {
  return (
    <div className="fixed inset-x-4 bottom-24 z-50 flex max-h-[min(620px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[390px]">
      <div className="flex items-center justify-between bg-[rgba(12,34,38,0.95)] px-5 py-4 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(82,224,129)]">
            Ciel · AI copilot
          </p>
          <h2 className="mt-1 font-bold">Initiative-aware chat</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close AI chat"
          className="text-xl text-white/60 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="min-h-40 flex-1 space-y-2 overflow-y-auto bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {messages.map((message, index) => (
          <p
            key={index}
            className={
              index === 0
                ? "text-slate-400"
                : "border-b border-slate-800 pb-2 last:border-0"
            }
          >
            {message}
          </p>
        ))}
      </div>
      <form
        onSubmit={ask}
        className="flex gap-2 border-t border-slate-200 bg-white p-3"
      >
        <label className="sr-only" htmlFor="question">
          Ask Ciel
        </label>
        <input
          id="question"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm shadow-sm placeholder:text-slate-400"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this initiative…"
        />
        <button
          className="min-h-11 rounded-lg bg-[rgb(82,224,129)] px-3 text-xs font-bold text-[rgb(12,34,38)] disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={busy}
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

function TracePanel({ trace }) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(9,167,141)]">
            Selected initiative
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Decision trace
          </h2>
        </div>
        <span className="rounded-full bg-[rgba(82,224,129,0.25)] px-3 py-1 text-xs font-bold text-[rgb(25,66,71)]">
          {trace.committee.finalDecision.outcome}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        <strong className="text-slate-900">{trace.lifecycle.assessment}</strong>{" "}
        · {trace.traceability.length} risk findings linked
      </p>
      <p className="mt-2 text-sm text-slate-600">
        System calculation:{" "}
        <strong className="text-slate-900">
          {trace.scoreCalculation.residualRating} (
          {trace.scoreCalculation.residualScore})
        </strong>
        ; human dispositions:{" "}
        {trace.humanDispositions
          .map((item) => `${item.observationId} ${item.action}`)
          .join(", ")}
      </p>
      <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Inspect provenance records
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto text-xs leading-5 text-slate-600">
          {JSON.stringify(
            {
              sourceDocuments: trace.sourceDocuments,
              facts: trace.facts.slice(0, 4),
              traceability: trace.traceability.slice(0, 3),
            },
            null,
            2,
          )}
        </pre>
      </details>
    </section>
  );
}
