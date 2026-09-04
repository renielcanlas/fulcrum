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
  ["board", "Board", "▦"],
  ["initiatives", "Initiatives", "◫"],
  ["evidence", "Evidence & lineage", "⌁"],
  ["controls", "Risk & controls", "◈"],
  ["decisions", "Decisions", "✓"],
  ["jira", "Jira integration", "↗"],
  ["sandbox", "Sandbox", "⚗"],
];
const jiraBoardUrl =
  "https://geniushacks.atlassian.net/jira/software/projects/KAN/boards/2?filter=&groupBy=none&atlOrigin=eyJpIjoiYjY1ZTgwYTY3NWM5NGU3ZWEwMDEyZjZlNmQwODAzMjQiLCJwIjoiaiJ9";
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
  const [activeView, setActiveView] = useState("board");

  function navigateTo(view) {
    if (view === "sandbox") {
      router.push("/sandbox");
      return;
    }
    setActiveView(view);
    if (view !== "initiative-detail") setTrace(null);
    router.replace(view === "board" ? "/demo" : `/demo?view=${view}`);
  }

  useEffect(() => {
    fetch("/api/session")
      .then((response) => response.json())
      .then((data) => {
        if (data.user) setSignedIn(data.user);
        else router.replace("/");
      });
  }, [router]);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view) setActiveView(view);
  }, []);

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
    const data = await response.json();
    setTrace(response.ok && data.committee?.finalDecision ? data : null);
  }

  async function openInitiative() {
    setActiveView("initiative-detail");
    router.replace("/demo?view=initiative-detail&initiative=INIT-2026-0007");
    await loadTrace();
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
      <nav
        className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden"
        aria-label="Mobile demo navigation"
      >
        {navItems.map(([id, label]) => (
          <button
            key={id}
            onClick={() => navigateTo(id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${activeView === id ? "bg-[rgba(9,167,141,0.12)] text-[rgb(25,66,71)]" : "bg-slate-50 text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </nav>
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
            {navItems.map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => navigateTo(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeView === id ? "bg-[rgba(9,167,141,0.11)] text-[rgb(25,66,71)]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-lg text-base ${activeView === id ? "bg-[rgb(9,167,141)] text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {icon}
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
          {activeView === "initiative-detail" && <InitiativeProgress />}
          {activeView === "board" && (
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
          )}
          {activeView === "board" ? (
            <>
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
                          <InitiativeCard onOpen={openInitiative} />
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
            </>
          ) : (
            <WorkspaceScreen
              view={activeView}
              onOpenTrace={loadTrace}
              trace={trace}
            />
          )}
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

function InitiativeProgress() {
  return (
    <section
      className="sticky top-16 z-20 -mt-6 mb-6 -ml-4 -mr-4 border-b border-slate-200 bg-white/95 pb-3 pt-3 shadow-sm backdrop-blur sm:-ml-6 sm:-mr-6 lg:-mt-8 lg:-ml-10 lg:-mr-10"
      aria-label="Initiative progress"
    >
      <div>
        <div className="mb-3 flex flex-col justify-between gap-2 px-4 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">
                Initiative progress
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                Launch U.S.–Philippines Instant Remittance
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Current status:{" "}
            <span className="text-[rgb(9,167,141)]">
              Approved with Conditions
            </span>{" "}
            · Owner: Helen Morgan
          </p>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[920px] items-stretch">
            {workflow.map(([label], index) => (
              <div
                key={label}
                title={label}
                className={`relative min-w-[112px] flex-1 border-y border-r px-2 py-2 ${index === workflow.length - 1 ? "z-10 border-[rgb(82,224,129)] bg-[rgba(82,224,129,0.14)]" : index < workflow.length - 1 ? "border-[rgba(82,224,129,0.45)] bg-[rgba(82,224,129,0.06)]" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index === workflow.length - 1 ? "bg-[rgb(82,224,129)] text-[rgb(12,34,38)]" : index < workflow.length - 1 ? "bg-[rgb(82,224,129)] text-[rgb(12,34,38)]" : "bg-slate-100 text-slate-400"}`}
                  >
                    {index === workflow.length - 1 ? "✓" : index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold leading-3 ${index === workflow.length - 1 ? "text-[rgb(25,66,71)]" : index < workflow.length - 1 ? "text-[rgb(25,66,71)]" : "text-slate-400"}`}
                  >
                    {label}
                  </span>
                </div>
                <p
                  className={`mt-2 text-[10px] font-semibold ${index === workflow.length - 1 ? "text-[rgb(25,66,71)]" : "text-slate-400"}`}
                >
                  {index === workflow.length - 1 ? "Current stage" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InitiativeDetail({ trace }) {
  const risks = [
    [
      "Money laundering",
      "High",
      "Cross-border instant payments and velocity exposure",
    ],
    [
      "Terrorist financing",
      "Medium",
      "Corridor and customer screening dependency",
    ],
    [
      "Sanctions exposure",
      "High",
      "Partner screening and recipient data quality",
    ],
    ["Fraud", "Medium", "Digital channel and account-takeover exposure"],
    [
      "Geographic / customer",
      "Medium",
      "U.S. senders and Philippines recipients",
    ],
    [
      "Third-party / vendor",
      "High",
      "Local payment partner diligence remains conditional",
    ],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <InfoCard title="Business proposal">
            <h1 className="mb-3 text-xl font-bold tracking-tight text-slate-950">
              <span className="font-mono text-sm text-slate-400">
                INIT-2026-0007
              </span>
              <span className="mx-2 text-slate-300">—</span>
              Launch U.S.–Philippines Instant Remittance
            </h1>
            <p className="mb-4 text-sm font-semibold text-[rgb(9,167,141)]">
              New Product Launch + Geographic Expansion
            </p>
            <p className="text-sm leading-6 text-slate-600">
              A large U.S. bank proposes a digital payment service that allows
              U.S. customers to send money to recipients in the Philippines
              through a local payment partner.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Target customers", "Existing U.S. customers"],
                ["Expected volume", "120,000 monthly transactions"],
                ["Monthly value", "$18M projected"],
                ["Initial transaction limit", "$1,000"],
                ["Delivery channel", "Mobile and web"],
                [
                  "Payment flow",
                  "U.S. sender → partner → Philippines recipient",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </InfoCard>
          <InfoCard title="Risk assessment">
            <div className="space-y-2">
              {risks.map(([name, rating, rationale]) => (
                <div
                  key={name}
                  className="flex flex-col gap-1 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="w-40 shrink-0 text-sm font-semibold text-slate-800">
                    {name}
                  </span>
                  <span className="w-fit rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                    {rating}
                  </span>
                  <span className="text-xs leading-5 text-slate-500">
                    {rationale}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-white">
              <span className="text-white/60">
                System-calculated residual risk
              </span>
              <strong className="ml-2 text-[rgb(82,224,129)]">
                {trace?.scoreCalculation?.residualRating ?? "High"} (
                {trace?.scoreCalculation?.residualScore ?? "—"})
              </strong>
            </div>
          </InfoCard>
          <InfoCard title="Evidence and controls">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [
                  "8 source documents",
                  "Product brief, partner pack, control attestations",
                ],
                [
                  "Enhanced monitoring",
                  "Velocity and corridor rules RM-01–RM-05",
                ],
                ["KYC and screening", "Operating with partner dependency"],
                [
                  "Fraud controls",
                  "Step-up authentication and device risk signals",
                ],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
        <div className="space-y-5">
          <InfoCard title="Ownership & participants">
            <div className="space-y-3">
              {[
                ["Product Owner", "Maya Chen"],
                ["FCRM Analyst", "Daniel Reyes"],
                ["Risk Committee", "Helen Morgan"],
                ["Current owner", "Helen Morgan · Committee Review"],
              ].map(([role, name]) => (
                <div
                  key={role}
                  className="flex justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-xs text-slate-500">{role}</span>
                  <span className="text-right text-sm font-semibold text-slate-800">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </InfoCard>
          <InfoCard title="Workflow history">
            <div className="space-y-3">
              {[
                ["Draft", "Sep 1 · 09:00"],
                ["Submitted", "Sep 1 · 09:20"],
                ["Information Gathering", "Sep 1 · 09:25"],
                ["FCRM Assessment", "Sep 2 · 10:00"],
                ["Analyst Review", "Sep 2 · 15:30"],
                ["Decision Ready", "Sep 2 · 16:00"],
                ["Committee Review", "Sep 3 · 09:00"],
                ["Approved with Conditions", "Sep 3 · 14:00"],
              ].map(([stage, time], index) => (
                <div key={stage} className="flex items-center gap-3 text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${index === 7 ? "bg-[rgb(82,224,129)]" : "bg-[rgb(9,167,141)]"}`}
                  />
                  <span className="font-semibold text-slate-700">{stage}</span>
                  <span className="ml-auto text-slate-400">{time}</span>
                </div>
              ))}
            </div>
          </InfoCard>
          <InfoCard title="Decision conditions">
            <div className="space-y-3">
              {[
                "Enhanced transaction monitoring",
                "Lower initial transaction limits",
                "Additional HarborBridge partner due diligence",
                "30-day post-launch FCRM review",
              ].map((condition) => (
                <div
                  key={condition}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="mt-0.5 text-[rgb(9,167,141)]">✓</span>
                  {condition}
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

function WorkspaceScreen({ view, onOpenTrace, trace }) {
  const screens = {
    initiatives: {
      eyebrow: "Portfolio view",
      title: "Initiatives",
      description:
        "Browse the synthetic initiatives connected to FULCRUM assessments.",
    },
    evidence: {
      eyebrow: "Decision lineage",
      title: "Evidence & lineage",
      description:
        "Trace assessment conclusions back to source evidence, extracted facts, controls, and analyst actions.",
    },
    controls: {
      eyebrow: "Risk methodology",
      title: "Risk & controls",
      description:
        "Review the risk domains, control coverage, and residual-risk calculation for the active initiative.",
    },
    decisions: {
      eyebrow: "Human governance",
      title: "Decisions",
      description:
        "See analyst recommendations, overrides, conditions, and the committee outcome.",
    },
    jira: {
      eyebrow: "Connected work system",
      title: "Jira integration",
      description:
        "FULCRUM keeps the initiative context connected to the delivery work that implements the decision.",
    },
  };
  const screen = screens[view] ?? screens.initiatives;

  if (view === "initiative-detail") {
    return <InitiativeDetail trace={trace} />;
  }

  if (view === "jira") {
    const personas = [
      ["Maya Chen", "menebi8777@dd2car.com", "Product Owner"],
      ["Marcus Thompson", "sheelaghyirs@instantbox.live", "Product Owner"],
      ["Daniel Reyes", "danielreye@instantbox.live", "FCRM Analyst"],
      ["Priya Shah", "priyashah@instantbox.live", "FCRM Analyst"],
      ["Helen Morgan", "helenmorga@instantbox.live", "Risk Committee"],
      ["Robert Kim", "RobertKim@instantbox.live", "Risk Committee"],
    ];
    return (
      <div>
        <ScreenHeading {...screen} />
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-900">
              Test Jira account
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-800">
              This hackathon uses a separate synthetic Jira account for
              demonstration only. The board link opens Jira in a new tab;
              FULCRUM does not redirect you away from the demo workspace
              automatically.
            </p>
            <p className="mt-3 text-xs font-semibold text-amber-900">
              Do not use these credentials outside the authorized test account.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-950">
                  Demo persona access
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  All personas use the same synthetic password.
                </p>
              </div>
              <code className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                Genius123!
              </code>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3 font-bold">Persona</th>
                    <th className="px-3 py-3 font-bold">Email</th>
                    <th className="px-3 py-3 font-bold">Role</th>
                    <th className="px-3 py-3 font-bold">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personas.map(([name, email, role]) => (
                    <tr key={email}>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {name}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {email}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{role}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        Genius123!
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl bg-[rgba(12,34,38,0.95)] p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(82,224,129)]">
              Open the delivery board
            </p>
            <h2 className="mt-2 text-xl font-bold">View the test Jira board</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Inspect the linked work items and synthetic implementation
              conditions in the connected Jira project.
            </p>
            <a
              href={jiraBoardUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-lg bg-[rgb(82,224,129)] px-4 py-3 text-sm font-bold text-[rgb(12,34,38)] transition hover:bg-[rgb(110,235,151)]"
            >
              Open Jira board in new tab ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  const content = {
    initiatives: (
      <InfoCard title="Golden Initiative">
        <p className="text-lg font-bold text-slate-950">
          Launch U.S.–Philippines Instant Remittance
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          A synthetic cross-border payment launch with one linked assessment,
          eight lifecycle stages, and explicit Product Owner, Analyst, and
          Committee participants.
        </p>
        <button
          onClick={() => onOpenTrace()}
          className="mt-4 text-sm font-bold text-[rgb(9,167,141)]"
        >
          Open decision trace →
        </button>
      </InfoCard>
    ),
    evidence: (
      <InfoCard title="Evidence coverage">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["8", "Source records"],
            ["18", "Extracted facts"],
            ["11/11", "Risk findings linked"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-950">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => onOpenTrace()}
          className="mt-5 text-sm font-bold text-[rgb(9,167,141)]"
        >
          Inspect source provenance →
        </button>
      </InfoCard>
    ),
    controls: (
      <InfoCard title="Risk and control posture">
        <div className="space-y-3">
          {[
            ["Money laundering", "High", "Enhanced monitoring"],
            ["Sanctions exposure", "High", "KYC and screening"],
            ["Fraud", "Medium", "Step-up authentication"],
            ["Third-party/vendor", "Medium", "Partner due diligence"],
          ].map(([risk, rating, control]) => (
            <div
              key={risk}
              className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
            >
              <span className="font-semibold text-slate-800">{risk}</span>
              <span className="text-xs text-slate-500">{control}</span>
              <span className="w-fit rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                {rating}
              </span>
            </div>
          ))}
        </div>
      </InfoCard>
    ),
    decisions: (
      <InfoCard title="Decision package">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Analyst recommendation
            </p>
            <p className="mt-2 font-bold text-slate-900">
              Medium · Daniel Reyes
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              Bounded launch controls and explicit conditions recommended.
            </p>
          </div>
          <div className="rounded-xl bg-[rgba(82,224,129,0.16)] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[rgb(25,66,71)]">
              Committee outcome
            </p>
            <p className="mt-2 font-bold text-slate-900">
              Approved with Conditions
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              Helen Morgan approved the launch subject to four synthetic
              conditions.
            </p>
          </div>
        </div>
        <button
          onClick={() => onOpenTrace()}
          className="mt-5 text-sm font-bold text-[rgb(9,167,141)]"
        >
          View full decision trace →
        </button>
      </InfoCard>
    ),
  };
  return (
    <div>
      <ScreenHeading {...screen} />
      <div className="space-y-5">{content[view] ?? content.initiatives}</div>
    </div>
  );
}

function ScreenHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-bold text-slate-950">{title}</h2>
      {children}
    </section>
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
