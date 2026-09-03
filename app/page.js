"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(() => {
    fetch("/api/demo-users")
      .then((r) => r.json())
      .then(setUsers);
  }, []);
  async function startDemo() {
    if (!userId) return;
    const r = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const d = await r.json();
    if (d.user) router.push("/demo");
  }
  return (
    <main className="min-h-screen bg-[#f5f7f7] text-[rgb(25,66,71)]">
      <nav className="sticky top-0 z-40 border-b border-[#d8e1e1]/80 bg-[#f5f7f7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a href="#top" className="text-lg font-bold tracking-[0.18em]">
            FULCRUM
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
            <a className="transition hover:text-[rgb(25,66,71)]" href="#about">
              About
            </a>
            <a
              className="transition hover:text-[rgb(25,66,71)]"
              href="#how-it-works"
            >
              How it works
            </a>
            <a
              className="transition hover:text-[rgb(25,66,71)]"
              href="#principles"
            >
              Principles
            </a>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className="rounded-full bg-[rgb(82,224,129)] px-4 py-2 text-sm font-bold text-[rgb(12,34,38)] transition hover:bg-[rgb(110,235,151)]"
          >
            Start demo
          </button>
        </div>
      </nav>
      <section
        id="top"
        className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20"
      >
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(9,167,141)]">
            Hackathon entry · Financial crime risk assessment
          </p>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-[rgb(25,66,71)] sm:text-6xl">
            Make every initiative decision-ready.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            FULCRUM brings Jira context, evidence, risk analysis, and human
            governance into one traceable FCRM workbench.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-full bg-[rgb(82,224,129)] px-6 py-3 text-center text-sm font-bold text-[rgb(12,34,38)] transition hover:bg-[rgb(110,235,151)]"
            >
              Start the demo
            </button>
            <a
              href="#how-it-works"
              className="rounded-full border border-[#b8c7c9] px-6 py-3 text-center text-sm font-semibold text-[rgb(25,66,71)] transition hover:border-[rgb(9,167,141)]"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            AI prepares. Deterministic systems explain. Humans decide.
          </p>
        </div>
        <div
          aria-label="Future FULCRUM system diagram or vector video placeholder"
          className="flex min-h-[340px] items-center justify-center rounded-[2rem] border border-dashed border-[#6e888b] bg-[rgba(12,34,38,0.95)] p-8 shadow-2xl shadow-[#0c2226]/15 sm:min-h-[440px]"
        >
          <span className="sr-only">Diagram or vector video placeholder</span>
        </div>
      </section>
      <section
        id="about"
        className="scroll-mt-20 border-y border-[#d8e1e1] bg-white px-6 py-20 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">
              Why FULCRUM
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              A little leverage goes a long way.
            </h2>
          </div>
          <div className="max-w-3xl space-y-5 text-base leading-8 text-slate-600">
            <p>
              A <em>fulcrum</em> is the pivot point of a lever: the place where
              a well-positioned, measured force can move something much larger.
              The name is a wink to the work itself. FCRM teams carry decisions
              with serious weight; FULCRUM helps them move that work with less
              friction and more confidence.
            </p>
            <p>
              By bringing initiative context, evidence, policy, deterministic
              scoring, and human review into one place, FULCRUM multiplies the
              effort of the people accountable for the outcome. It does not take
              the decision away from them—it gives their judgment better
              leverage.
            </p>
            <p className="font-semibold text-[rgb(25,66,71)]">
              In short: the best tool in the room is not the loudest voice. It
              is the one that makes good judgment easier to apply.
            </p>
            <aside className="rounded-xl border-l-4 border-[rgb(82,224,129)] bg-[#f5f7f7] px-4 py-3 text-sm italic leading-6 text-[rgb(25,66,71)]">
              A small side note from the build: <strong>FULCRUM</strong> was the first word I thought of when I saw FCRM—a fitting name for a tool designed to make difficult work easier to move.
            </aside>
          </div>
        </div>
      </section>
      <section
        id="how-it-works"
        className="scroll-mt-20 border-b border-[#d8e1e1] bg-white px-6 py-16 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">
              A governed path from change to decision
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Clarity across the entire assessment lifecycle.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              [
                "01",
                "Understand",
                "Connect the initiative to its authorized Jira context.",
              ],
              ["02", "Ground", "Trace facts, evidence, policy, and controls."],
              [
                "03",
                "Assess",
                "Use AI assistance around deterministic risk scoring.",
              ],
              ["04", "Decide", "Keep analysts and committees accountable."],
            ].map(([number, title, body]) => (
              <article
                key={number}
                className="rounded-2xl border border-[#d8e1e1] p-5"
              >
                <span className="text-xs font-bold text-[rgb(9,167,141)]">
                  {number}
                </span>
                <h3 className="mt-8 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="principles"
        className="scroll-mt-20 mx-auto max-w-7xl px-6 py-16 lg:px-10"
      >
        <div className="grid gap-8 rounded-[2rem] bg-[rgba(12,34,38,0.95)] p-8 text-[rgba(255,255,255,0.85)] sm:p-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[rgb(82,224,129)]">
              Built for accountable decisions
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
              The system prepares. People remain responsible.
            </h2>
          </div>
          <div className="grid gap-4 text-sm leading-6 sm:grid-cols-3">
            <p>
              <strong className="block text-white">Evidence first</strong>Every
              material conclusion has a source and a trace.
            </p>
            <p>
              <strong className="block text-white">AI bounded</strong>Models
              assist with interpretation, never approval.
            </p>
            <p>
              <strong className="block text-white">Human governed</strong>
              Analysts and committees own the outcome.
            </p>
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-7xl px-6 pb-8 text-xs text-slate-500 lg:px-10">
        FULCRUM · Hackathon demonstration · All data is synthetic.
      </footer>
      {loginOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,34,38,0.72)] px-4 py-8"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLoginOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-login-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">
                  Hackathon demo access
                </p>
                <h2
                  id="demo-login-title"
                  className="mt-2 text-2xl font-bold text-[rgb(25,66,71)]"
                >
                  Choose a persona
                </h2>
              </div>
              <button
                aria-label="Close demo login"
                onClick={() => setLoginOpen(false)}
                className="text-2xl leading-none text-slate-400 hover:text-[rgb(25,66,71)]"
              >
                ×
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              This is a synthetic demonstration environment. Select a persona to
              explore the role-based FULCRUM journey. No password or real
              customer data is used.
            </p>
            <label
              className="mt-6 block text-sm font-semibold text-[rgb(25,66,71)]"
              htmlFor="modal-persona"
            >
              Demo persona
              <select
                id="modal-persona"
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 shadow-sm"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Select a persona</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} — {u.role}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={startDemo}
              disabled={!userId}
              className="mt-6 min-h-11 w-full rounded-lg bg-[rgb(82,224,129)] px-4 text-sm font-bold text-[rgb(12,34,38)] transition hover:bg-[rgb(110,235,151)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enter the synthetic demo
            </button>
            <p className="mt-4 text-center text-xs text-slate-500">
              AI assists with explanation and drafting. Humans retain decision
              authority.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
