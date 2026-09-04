"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  JiraUpdateDialog,
  renderCielMessage,
} from "../../src/components/ciel-chat.js";
import guidedDemos from "../../data/config/guided-demos.json" with { type: "json" };

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
const cielStorageKey = "fulcrum-ciel-chat";
const cielResponseStorageKey = "fulcrum-ciel-response-id";
const jiraWorkflowStatuses = [
  "Intake",
  "Context and Research",
  "Risk Assessment",
  "Review",
  "Decision",
];
const demoTourSteps = guidedDemos[0]?.steps ?? [];

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
  const [chatReady, setChatReady] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState("");
  const [boardItems, setBoardItems] = useState(null);
  const [boardError, setBoardError] = useState("");
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [activeIssueKey, setActiveIssueKey] = useState("");
  const [chatContextCleared, setChatContextCleared] = useState(false);
  const [jiraUpdateRequest, setJiraUpdateRequest] = useState(null);
  const [jiraUserConnected, setJiraUserConnected] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [pendingCielAction, setPendingCielAction] = useState(null);
  const [intakeAssessment, setIntakeAssessment] = useState(null);
  const [assessmentBusy, setAssessmentBusy] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [transitionOffer, setTransitionOffer] = useState(false);
  const [tourStep, setTourStep] = useState(null);
  const [tourRect, setTourRect] = useState(null);

  useEffect(() => {
    if (tourStep === null) return;
    const updateTourTarget = () => {
      const target = document.querySelector(
        `[data-tour="${demoTourSteps[tourStep].target}"]`,
      );
      setTourRect(target?.getBoundingClientRect() ?? null);
    };
    updateTourTarget();
    window.addEventListener("resize", updateTourTarget);
    window.addEventListener("scroll", updateTourTarget, true);
    return () => {
      window.removeEventListener("resize", updateTourTarget);
      window.removeEventListener("scroll", updateTourTarget, true);
    };
  }, [tourStep]);

  function navigateTo(view) {
    if (view === "sandbox") {
      window.open("/sandbox", "_blank", "noopener,noreferrer");
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
    try {
      const saved = JSON.parse(localStorage.getItem(cielStorageKey) ?? "null");
      if (Array.isArray(saved) && saved.length) setMessages(saved);
      setPreviousResponseId(localStorage.getItem(cielResponseStorageKey) ?? "");
    } catch {}
    setChatReady(true);
  }, []);

  useEffect(() => {
    if (chatReady)
      localStorage.setItem(cielStorageKey, JSON.stringify(messages));
  }, [messages, chatReady]);

  useEffect(() => {
    if (chatReady) {
      if (previousResponseId)
        localStorage.setItem(cielResponseStorageKey, previousResponseId);
      else localStorage.removeItem(cielResponseStorageKey);
    }
  }, [previousResponseId, chatReady]);

  useEffect(() => {
    fetch("/api/jira")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? "jira_board_load_failed");
        setBoardItems(data.items ?? []);
      })
      .catch((error) => {
        setBoardItems([]);
        setBoardError(error.message ?? "jira_board_load_failed");
      });
  }, []);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view) setActiveView(view);
  }, []);

  useEffect(() => {
    const issueKey = new URLSearchParams(window.location.search).get("issue");
    setActiveIssueKey(issueKey ?? "");
    if (activeView !== "work-item" || !issueKey) return;
    setIntakeAssessment(null);
    setAssessmentError("");
    fetch(`/api/jira?issue=${encodeURIComponent(issueKey)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? "jira_work_item_load_failed");
        if (!data.item) throw new Error("work_item_not_found");
        setSelectedWorkItem(data.item);
        const assessmentResponse = await fetch(
          `/api/jira/assessment?issue=${encodeURIComponent(issueKey)}`,
        );
        const assessmentData = await assessmentResponse.json();
        if (assessmentResponse.ok) setIntakeAssessment(assessmentData);
      })
      .catch((error) =>
        setSelectedWorkItem({
          error: error.message ?? "jira_work_item_load_failed",
        }),
      );
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "work-item") return;
    fetch("/api/jira/user-status")
      .then((response) => response.json())
      .then((data) => setJiraUserConnected(Boolean(data.connected)))
      .catch(() => setJiraUserConnected(false));
  }, [activeView]);

  async function addComment() {
    if (!selectedWorkItem?.key || !commentText.trim() || commentBusy) return;
    setCommentBusy(true);
    setCommentError("");
    try {
      const response = await fetch("/api/jira/comment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          issueKey: selectedWorkItem.key,
          body: commentText.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "jira_comment_failed");
      setSelectedWorkItem((current) => ({
        ...current,
        comments: [
          ...(current.comments ?? []),
          {
            id: data.commentId ?? `local-${Date.now()}`,
            author: signedIn?.displayName ?? "Current user",
            body: commentText.trim(),
            created: new Date().toISOString(),
          },
        ],
      }));
      setCommentText("");
    } catch (error) {
      setCommentError(error.message ?? "jira_comment_failed");
    } finally {
      setCommentBusy(false);
    }
  }

  async function assessIntakeStage() {
    if (!activeIssueKey || assessmentBusy) return;
    setAssessmentBusy(true);
    setAssessmentError("");
    setTransitionOffer(false);
    try {
      const response = await fetch("/api/jira/assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "assess",
          issueKey: activeIssueKey,
          stage: selectedWorkItem?.statusName,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "intake_assessment_failed");
      setIntakeAssessment((current) => ({
        ...(current ?? {}),
        issueKey: activeIssueKey,
        stage: selectedWorkItem?.statusName,
        assessment: data.assessment,
      }));
    } catch (error) {
      setAssessmentError(error.message ?? "intake_assessment_failed");
    } finally {
      setAssessmentBusy(false);
    }
  }

  async function publishIntakeAssessment() {
    if (!intakeAssessment?.assessment || assessmentBusy) return;
    setAssessmentBusy(true);
    setAssessmentError("");
    try {
      const response = await fetch("/api/jira/assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          issueKey: activeIssueKey,
          stage: selectedWorkItem?.statusName,
          assessment: intakeAssessment.assessment,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "intake_assessment_publish_failed");
      await refreshWorkItem(activeIssueKey);
      if (data.assessment.recommendation === "Proceed")
        setTransitionOffer(true);
    } catch (error) {
      setAssessmentError(error.message ?? "intake_assessment_publish_failed");
    } finally {
      setAssessmentBusy(false);
    }
  }

  async function moveToNextStage() {
    if (assessmentBusy) return;
    setAssessmentBusy(true);
    setAssessmentError("");
    try {
      const response = await fetch("/api/jira/assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "transition",
          issueKey: activeIssueKey,
          stage: selectedWorkItem?.statusName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "jira_transition_failed");
      setTransitionOffer(false);
      await refreshWorkItem(activeIssueKey);
      const boardResponse = await fetch("/api/jira");
      const boardData = await boardResponse.json();
      if (boardResponse.ok) setBoardItems(boardData.items ?? []);
    } catch (error) {
      setAssessmentError(error.message ?? "jira_transition_failed");
    } finally {
      setAssessmentBusy(false);
    }
  }

  async function refreshWorkItem(issueKey) {
    const response = await fetch(
      `/api/jira?issue=${encodeURIComponent(issueKey)}`,
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "jira_work_item_load_failed");
    setSelectedWorkItem(data.item);
    const assessmentResponse = await fetch(
      `/api/jira/assessment?issue=${encodeURIComponent(issueKey)}`,
    );
    const assessmentData = await assessmentResponse.json();
    if (assessmentResponse.ok) setIntakeAssessment(assessmentData);
  }

  async function sendCielMessage(text, applyJiraUpdate = false) {
    if (applyJiraUpdate) setPendingCielAction(null);
    setChatContextCleared(false);
    setQuestion("");
    setMessages((current) => [...current, `You: ${text}`]);
    setBusy(true);
    try {
      const response = await fetch("/api/ciel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          previousResponseId,
          applyJiraUpdate,
          conversation: messages.slice(-12),
          currentUrl: window.location.href,
          context: buildCielContext(
            text,
            activeView,
            boardItems,
            selectedWorkItem,
          ),
        }),
      });
      const data = await response.json();
      if (data.responseId) setPreviousResponseId(data.responseId);
      setMessages((current) => [
        ...current,
        `Ciel: ${data.answer ?? data.error}`,
      ]);
      const answer = String(data.answer ?? "");
      const inferredPendingAction =
        data.pendingAction ??
        (applyJiraUpdate
          ? null
          : /(?:reply with|confirm by replying|confirm|reply)[\s\S]*(?:yes,?\s*assign|assign)[\s\S]*(?:confirm|reply)/i.test(
                answer,
              )
            ? { kind: "assignment", issueKey: activeIssueKey, message: text }
            : /(?:reply with|confirm by replying|confirm|reply)[\s\S]*(?:yes,?\s*(?:change|transition)|status|transition|move)/i.test(
                  answer,
                )
              ? { kind: "transition", issueKey: activeIssueKey, message: text }
              : null);
      if (inferredPendingAction) setPendingCielAction(inferredPendingAction);
      else if (applyJiraUpdate) setPendingCielAction(null);
      if (applyJiraUpdate && activeView === "work-item" && activeIssueKey)
        await refreshWorkItem(activeIssueKey);
    } finally {
      setBusy(false);
    }
  }

  async function ask(event) {
    event.preventDefault();
    if (!question.trim() || !signedIn || busy) return;
    const text = question.trim();
    if (
      pendingCielAction &&
      /^(?:yes(?:\s+(?:please|assign|transition|status|change status))?|do it|proceed|apply|confirm(?: assignment| transition)?|go ahead|okay|ok)[,.! ]*$/i.test(
        text,
      )
    ) {
      const action = pendingCielAction;
      setPendingCielAction(null);
      await sendCielMessage(action.message, true);
      return;
    }
    if (
      /\b(update|edit|improve|rewrite|populate|enhance)\b/i.test(text) &&
      /\b(story|work item|jira item|details?|description|summary)\b/i.test(
        text,
      ) &&
      (activeIssueKey || text.match(/\bFCRM-[1-9][0-9]*\b/i))
    ) {
      const issueKey =
        activeIssueKey || text.match(/\bFCRM-[1-9][0-9]*\b/i)[0].toUpperCase();
      setJiraUpdateRequest({ issueKey, message: text });
      return;
    }
    if (
      /\b(assign|reassign|set|change)\b/i.test(text) &&
      /\b(assignee|owner|ticket|issue|work item|jira)\b/i.test(text) &&
      (activeIssueKey || text.match(/\bFCRM-[1-9][0-9]*\b/i))
    ) {
      const issueKey =
        activeIssueKey || text.match(/\bFCRM-[1-9][0-9]*\b/i)[0].toUpperCase();
      setJiraUpdateRequest({ issueKey, message: text, kind: "assignment" });
      return;
    }
    if (
      /\b(move|transition|change|set|advance)\b/i.test(text) &&
      /\b(status|stage|workflow|intake|research|risk assessment|review|decision)\b/i.test(
        text,
      ) &&
      (activeIssueKey || text.match(/\bFCRM-[1-9][0-9]*\b/i))
    ) {
      const issueKey =
        activeIssueKey || text.match(/\bFCRM-[1-9][0-9]*\b/i)[0].toUpperCase();
      setJiraUpdateRequest({ issueKey, message: text, kind: "transition" });
      return;
    }
    await sendCielMessage(text);
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
              <Fragment key={id}>
                <button
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
                {id === "initiatives" && (
                  <button
                    type="button"
                    onClick={() => navigateTo("guided-demos")}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-base text-slate-500">
                      ▷
                    </span>
                    Guided demos
                  </button>
                )}
              </Fragment>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {activeView === "initiative-detail" && <InitiativeProgress />}
          {activeView === "work-item" && (
            <JiraWorkItemProgress
              item={selectedWorkItem}
              currentUser={signedIn}
              onAssigned={async () => {
                await refreshWorkItem(activeIssueKey);
                const boardResponse = await fetch("/api/jira");
                const boardData = await boardResponse.json();
                if (boardResponse.ok) setBoardItems(boardData.items ?? []);
              }}
            />
          )}
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
              <button
                type="button"
                onClick={() => setTourStep(0)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Welcome tour
              </button>
            </div>
          )}
          {activeView === "guided-demos" ? (
            <GuidedDemosScreen
              demos={guidedDemos}
              onStart={(demo) => {
                if (demo.id === "welcome-tour") {
                  setActiveView("board");
                  setTourStep(0);
                  router.replace("/demo");
                }
              }}
            />
          ) : activeView === "board" ? (
            <>
              <div
                data-tour="metrics"
                className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4"
              >
                {[
                  [
                    boardItems === null ? "—" : boardItems.length,
                    "Jira work items",
                  ],
                  [
                    boardItems === null
                      ? "—"
                      : new Set([
                          ...jiraWorkflowStatuses,
                          ...boardItems.map(
                            (item) => item.statusName ?? item.status,
                          ),
                        ]).size,
                    "Jira statuses",
                  ],
                  ["FCRM", "Connected project"],
                  [boardItems === null ? "—" : "Live", "Board source"],
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
                data-tour="board"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                aria-label="Initiative board"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Jira work items{" "}
                      <span className="ml-1 text-sm font-medium text-slate-400">
                        {boardItems === null ? "—" : boardItems.length}
                      </span>
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Live status and work-item view from Jira project FCRM
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      Service account data
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto p-4">
                  <div className="flex min-w-[900px] gap-3">
                    {(boardItems === null
                      ? []
                      : [
                          ...new Set([
                            ...jiraWorkflowStatuses,
                            ...boardItems.map(
                              (item) =>
                                item.statusName ?? item.status ?? "Unknown",
                            ),
                          ]),
                        ]
                    ).map((label, index) => (
                      <div
                        key={label}
                        className="min-w-[178px] flex-1 rounded-xl bg-slate-50 p-2.5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-2 px-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`mt-0.5 h-2 w-2 rounded-full ${Object.values(tones)[index % Object.values(tones).length]}`}
                            />
                            <h3 className="text-xs font-bold leading-4 text-slate-700">
                              {label}
                            </h3>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">
                            {boardItems?.filter(
                              (item) =>
                                (item.statusName ??
                                  item.status ??
                                  "Unknown") === label,
                            ).length ?? "—"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {boardItems
                            ?.filter(
                              (item) =>
                                (item.statusName ??
                                  item.status ??
                                  "Unknown") === label,
                            )
                            .map((item) => (
                              <JiraBoardCard
                                key={item.id ?? item.key}
                                item={item}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                    {boardItems?.length === 0 && (
                      <div className="flex min-h-40 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 text-center text-sm text-slate-500">
                        {boardError
                          ? `Unable to load Jira board: ${boardError}`
                          : "No work items found in Jira project FCRM."}
                      </div>
                    )}
                  </div>
                </div>
              </section>
              {trace && <TracePanel trace={trace} />}
            </>
          ) : activeView === "work-item" ? (
            <JiraWorkItemView
              item={selectedWorkItem}
              currentUser={signedIn}
              userJiraConnected={jiraUserConnected}
              commentText={commentText}
              setCommentText={setCommentText}
              commentBusy={commentBusy}
              commentError={commentError}
              onAddComment={addComment}
              intakeAssessment={intakeAssessment}
              assessmentBusy={assessmentBusy}
              assessmentError={assessmentError}
              transitionOffer={transitionOffer}
              onAssessIntake={assessIntakeStage}
              onPublishIntake={publishIntakeAssessment}
              onRequestMove={() => setTransitionOffer(true)}
              onMoveToNextStage={moveToNextStage}
              onDismissTransition={() => setTransitionOffer(false)}
              onBack={() => {
                setSelectedWorkItem(null);
                setActiveView("board");
                router.push("/demo");
              }}
            />
          ) : (
            <WorkspaceScreen
              view={activeView}
              onOpenTrace={loadTrace}
              trace={trace}
              currentUser={signedIn}
            />
          )}
        </section>
      </div>
      {tourStep !== null && (
        <GuidedDemoTour
          step={demoTourSteps[tourStep]}
          index={tourStep}
          total={demoTourSteps.length}
          rect={tourRect}
          onBack={() => setTourStep((current) => Math.max(0, current - 1))}
          onNext={() =>
            setTourStep((current) =>
              current + 1 >= demoTourSteps.length ? null : current + 1,
            )
          }
          onClose={() => setTourStep(null)}
        />
      )}
      <button
        onClick={() => setChatOpen(true)}
        aria-label="Open AI chat"
        data-tour="ciel"
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
          pendingCielAction={pendingCielAction}
          onConfirmPendingAction={() => {
            const action = pendingCielAction;
            setPendingCielAction(null);
            if (action) sendCielMessage(action.message, true);
          }}
          onCancelPendingAction={() => setPendingCielAction(null)}
          onClose={() => setChatOpen(false)}
          jiraIssueKey={chatContextCleared ? "" : activeIssueKey}
          jiraUpdateRequest={jiraUpdateRequest}
          onConfirmJiraUpdate={() => {
            const request = jiraUpdateRequest;
            setJiraUpdateRequest(null);
            sendCielMessage(request.message, true);
          }}
          onCancelJiraUpdate={() => setJiraUpdateRequest(null)}
          onClear={() => {
            setMessages([
              "Hi, I’m Ciel. I can help you understand this initiative and its decision trail.",
            ]);
            setPendingCielAction(null);
            setPreviousResponseId("");
            setChatContextCleared(true);
          }}
        />
      )}
    </main>
  );
}

function buildCielContext(message, view, items, selectedItem) {
  if (
    !/(jira|board|work item|issue|status|assignee|fcrm|delivery|linked|current|this|here)/i.test(
      message,
    )
  )
    return "";
  if (view === "work-item" && selectedItem)
    return `Current FULCRUM work item context:\n- ${selectedItem.key}: ${selectedItem.summary}\n- Status: ${selectedItem.statusName ?? selectedItem.status ?? "Unknown"}\n- Assignee: ${selectedItem.assignee ?? "Unassigned"}\n- FULCRUM view: /demo?view=work-item&issue=${selectedItem.key}\n- Jira item: ${selectedItem.url ?? "unavailable"}`;
  if (view === "board" && Array.isArray(items))
    return `Current FULCRUM Jira board context (use only if relevant):\n${items.map((item) => `- ${item.key} | ${item.statusName ?? item.status ?? "Unknown"} | ${item.summary} | assignee: ${item.assignee ?? "Unassigned"} | FULCRUM: /demo?view=work-item&issue=${item.key} | Jira: ${item.url ?? "unavailable"}`).join("\n")}`.slice(
      0,
      5000,
    );
  return "";
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

function InitiativeForm({ onOpenTrace, currentUser }) {
  const [form, setForm] = useState({
    summary: "",
    problem: "",
    outcome: "",
    scope: "",
    users: "",
    risk: "",
    success: "",
    labels: "",
    priority: "Medium",
    owner: "",
  });
  const [prepared, setPrepared] = useState(false);
  const [createConfirm, setCreateConfirm] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);
  const [createError, setCreateError] = useState("");
  const [personas, setPersonas] = useState([]);
  useEffect(() => {
    fetch("/api/demo-users")
      .then((response) => response.json())
      .then(setPersonas)
      .catch(() => setPersonas([]));
  }, []);
  function update(field, value) {
    setPrepared(false);
    setForm((current) => ({ ...current, [field]: value }));
  }
  const description = [
    form.owner && `Accountable owner\n${form.owner}`,
    form.problem && `Problem / opportunity\n${form.problem}`,
    form.outcome && `Intended outcome\n${form.outcome}`,
    form.scope && `Scope and constraints\n${form.scope}`,
    form.users && `Affected users, markets, or data\n${form.users}`,
    form.risk && `Risk and compliance considerations\n${form.risk}`,
    form.success && `Success criteria\n${form.success}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  async function createInJira() {
    if (createBusy) return;
    setCreateBusy(true);
    setCreateError("");
    try {
      const response = await fetch("/api/jira/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          summary: form.summary.trim(),
          description,
          issueType: "Task",
          labels: form.labels
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.hint || data.error || "jira_creation_failed");
      setCreatedItem(data);
      setCreateConfirm(false);
    } catch (error) {
      setCreateError(error.message || "jira_creation_failed");
    } finally {
      setCreateBusy(false);
    }
  }
  return (
    <div>
      <ScreenHeading
        eyebrow="Initiative formulation"
        title="Shape a decision-ready Jira initiative"
        description="Capture the business context FULCRUM needs before the work item enters the governed workflow. This form prepares the minimum Jira story structure; it does not create a Jira item yet."
      />
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPrepared(true);
          }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="border-b border-slate-100 pb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#087f70]">
              Jira story basics
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              What is changing?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These fields map to the core Jira initiative context and the first
              Intake evaluation checks.
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Summary <span className="text-red-600">*</span>
              </span>
              <input
                required
                value={form.summary}
                onChange={(event) => update("summary", event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
                placeholder="e.g. Add real-time fraud controls for card payments"
              />
            </label>
            <label>
              <span className="flex min-h-4 items-center text-xs font-bold uppercase tracking-wide text-slate-500">
                Priority
              </span>
              <select
                value={form.priority}
                onChange={(event) => update("priority", event.target.value)}
                className="mt-2 h-[47px] w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
              >
                <option>Highest</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label>
              <span className="flex min-h-4 items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <span>Accountable owner</span>
                <button
                  type="button"
                  onClick={() =>
                    update("owner", currentUser?.displayName ?? "")
                  }
                  disabled={!currentUser}
                  className="cursor-pointer normal-case tracking-normal text-[#087f70] transition hover:text-[#102f33] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Assign to me
                </button>
              </span>
              <input
                list="initiative-personas"
                value={form.owner}
                onChange={(event) => update("owner", event.target.value)}
                className="mt-2 h-[47px] w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
                placeholder="Start typing a persona or team"
              />
              <datalist id="initiative-personas">
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.displayName}>
                    {persona.role}
                  </option>
                ))}
              </datalist>
            </label>
            {["problem", "outcome", "scope", "users", "risk", "success"].map(
              (field) => (
                <label key={field} className="sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {
                      {
                        problem: "Problem or opportunity",
                        outcome: "Intended outcome",
                        scope: "Scope and constraints",
                        users: "Affected users, markets, or data",
                        risk: "Risk and compliance considerations",
                        success: "Success criteria",
                      }[field]
                    }
                  </span>
                  <textarea
                    value={form[field]}
                    onChange={(event) => update(field, event.target.value)}
                    className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
                    placeholder="Add enough detail for another person to understand the request."
                  />
                </label>
              ),
            )}
            <label className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Classification labels
              </span>
              <input
                value={form.labels}
                onChange={(event) => update("labels", event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
                placeholder="payments, fraud, customer-impact (comma separated)"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">Project:</span> FCRM ·{" "}
              <span className="font-bold text-slate-700">Issue type:</span> Task
            </p>
            <button
              type="submit"
              className="rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d]"
            >
              Prepare Jira story
            </button>
          </div>
          {prepared && (
            <p
              className="mt-4 rounded-lg bg-[#dcefe7] px-3 py-2 text-xs font-semibold text-[#197443]"
              role="status"
            >
              Story draft prepared for review. Confirm below when you are ready
              to create it in Jira.
            </p>
          )}
          {prepared && !createdItem && (
            <button
              type="button"
              onClick={() => setCreateConfirm(true)}
              className="mt-3 rounded-lg border border-[#087f70] px-4 py-2.5 text-sm font-bold text-[#087f70] transition hover:bg-[#eef8f2]"
            >
              Create initiative in Jira
            </button>
          )}
          {createdItem && (
            <p
              className="mt-4 rounded-lg bg-[#dcefe7] px-3 py-2 text-xs font-semibold text-[#197443]"
              role="status"
            >
              Created {createdItem.key} in Jira.{" "}
              <a
                href={`/demo?view=work-item&issue=${encodeURIComponent(createdItem.key)}`}
                className="ml-1 underline"
              >
                Open in FULCRUM
              </a>
            </p>
          )}
          {createError && (
            <p className="mt-4 text-xs font-semibold text-red-700" role="alert">
              {createError}
            </p>
          )}
        </form>
        <aside className="h-fit rounded-2xl border border-[#cfe3d8] bg-[#f7fbf8] p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-[#087f70]">
            Decision context preview
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#102f33]">
            What FULCRUM will evaluate
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
            <li>
              <strong className="text-slate-800">Business context:</strong> why
              the change is needed and what outcome it should produce.
            </li>
            <li>
              <strong className="text-slate-800">Delivery scope:</strong>{" "}
              affected users, markets, data, constraints, and success criteria.
            </li>
            <li>
              <strong className="text-slate-800">Accountability:</strong> a
              named owner and useful classification labels.
            </li>
            <li>
              <strong className="text-slate-800">Governance:</strong> risk and
              compliance considerations that can guide later evaluation.
            </li>
          </ul>
          {form.summary && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Draft preview
              </p>
              <h3 className="mt-2 font-bold text-slate-900">{form.summary}</h3>
              <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                {description || "Add context to preview the Jira description."}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenTrace}
            className="mt-6 text-sm font-bold text-[#087f70] transition hover:text-[#102f33]"
          >
            View the golden decision trace →
          </button>
        </aside>
      </div>
      {createConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,34,38,0.7)] p-5"
          role="presentation"
        >
          <section
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-initiative-title"
          >
            <h2
              id="create-initiative-title"
              className="text-xl font-bold text-[#102f33]"
            >
              Create this Jira initiative?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will create a Task in the FCRM project using the FULCRUM
              service account. Review the prepared story before confirming.
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-bold text-slate-900">{form.summary}</p>
              <p className="mt-1 text-xs text-slate-500">
                FCRM · Task · {form.priority}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateConfirm(false)}
                disabled={createBusy}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createInJira}
                disabled={createBusy}
                className="rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {createBusy ? "Creating…" : "Confirm and create"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function WorkspaceScreen({ view, onOpenTrace, trace, currentUser }) {
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
      <InitiativeForm onOpenTrace={onOpenTrace} currentUser={currentUser} />
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
      {view !== "initiatives" && <ScreenHeading {...screen} />}
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

function GuidedDemosScreen({ demos, onStart }) {
  return (
    <div>
      <ScreenHeading
        eyebrow="Guided demos"
        title="Explore the FULCRUM workbench"
        description="Choose a guided tour to learn the main parts of the demo at your own pace."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => (
          <article
            key={demo.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087f70]">
                  Guided tour
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {demo.name}
                </h2>
              </div>
              <span className="rounded-full bg-[#dcefe7] px-2.5 py-1 text-xs font-bold text-[#197443]">
                {demo.steps?.length ?? 0} steps
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {demo.description}
            </p>
            <button
              type="button"
              onClick={() => onStart(demo)}
              className="mt-5 cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] focus:outline-none focus:ring-2 focus:ring-[#52e081]"
            >
              Start tour
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function GuidedDemoTour({ step, index, total, rect, onBack, onNext, onClose }) {
  const tooltipStyle = rect
    ? {
        top:
          rect.bottom + 220 <= window.innerHeight
            ? rect.bottom + 16
            : Math.max(20, rect.top - 220),
        left: Math.min(window.innerWidth - 340, Math.max(20, rect.left)),
      }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-tour-title"
    >
      {rect && (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-[#52e081] shadow-[0_0_0_9999px_rgba(12,34,38,0.58)]"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <section
        className="absolute max-h-[calc(100vh-40px)] w-[min(320px,calc(100vw-40px))] overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#087f70]">
              Demo guide · {index + 1}/{total}
            </p>
            <h2
              id="demo-tour-title"
              className="mt-2 text-lg font-bold text-[#102f33]"
            >
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guided tour"
            className="cursor-pointer text-xl leading-none text-slate-400 transition hover:text-slate-800"
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={index === 0}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="cursor-pointer rounded-lg bg-[#102f33] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#17494d]"
          >
            {index + 1 === total ? "Finish" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}

function JiraWorkItemProgress({ item, currentUser, onAssigned }) {
  const statuses = [
    "Intake",
    "Context and Research",
    "Risk Assessment",
    "Review",
    "Decision",
  ];
  const current = item?.statusName ?? "";
  const currentIndex = statuses.indexOf(current);
  const [assignOpen, setAssignOpen] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    fetch("/api/demo-users")
      .then((response) => response.json())
      .then(setPersonas)
      .catch(() => setPersonas([]));
  }, []);

  function openAssignment() {
    const currentPersona = personas.find(
      (persona) =>
        persona.jiraIdentity?.jiraAccountId === item?.assigneeAccountId,
    );
    setSelectedPersonaId(currentPersona?.id ?? currentUser?.id ?? "");
    setAssignError("");
    setAssignOpen(true);
  }

  async function confirmAssignment() {
    if (!item?.key || !selectedPersonaId || assignBusy) return;
    setAssignBusy(true);
    setAssignError("");
    try {
      const response = await fetch("/api/jira/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          issueKey: item.key,
          personaId: selectedPersonaId,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.hint || data.error || "jira_assignment_failed");
      setAssignOpen(false);
      await onAssigned?.();
    } catch (error) {
      setAssignError(error.message || "jira_assignment_failed");
    } finally {
      setAssignBusy(false);
    }
  }
  return (
    <>
      <section
        className="sticky top-16 z-20 -mt-6 mb-6 -ml-4 -mr-4 border-b border-slate-200 bg-white/95 pb-3 pt-3 shadow-sm backdrop-blur sm:-ml-6 sm:-mr-6 lg:-mt-8 lg:-ml-10 lg:-mr-10"
        aria-label="Jira work item progress"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="shrink-0 font-mono text-sm font-bold text-[rgb(9,167,141)]">
                {item?.key ?? "Loading work item…"}
              </span>
              <span className="min-w-0 text-sm font-bold text-slate-950">
                {item?.summary ?? ""}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                Assignee:{" "}
                <strong className="text-slate-700">
                  {item?.assignee ?? "Unassigned"}
                </strong>
                <button
                  type="button"
                  onClick={openAssignment}
                  className="cursor-pointer text-xs font-semibold text-[#087f70] transition hover:text-[#102f33] hover:underline focus:outline-none focus:ring-2 focus:ring-[#b9e4d1]"
                >
                  Assign
                </button>
              </span>
            </div>
          </div>
          {item?.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 cursor-pointer rounded px-1 text-xs font-semibold text-slate-500 transition hover:bg-[#eef8f2] hover:text-[#087f70] hover:underline focus:outline-none focus:ring-2 focus:ring-[#b9e4d1]"
            >
              Open in Jira ↗
            </a>
          )}
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[760px] items-stretch">
            {statuses.map((status, index) => (
              <div
                key={status}
                className={`min-w-[150px] flex-1 border-y border-r px-2 py-2 ${currentIndex >= index && currentIndex >= 0 ? "border-[rgba(82,224,129,0.45)] bg-[rgba(82,224,129,0.06)]" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${currentIndex >= index && currentIndex >= 0 ? "bg-[rgb(82,224,129)] text-[rgb(12,34,38)]" : "bg-slate-100 text-slate-400"}`}
                  >
                    {currentIndex >= index && currentIndex >= 0
                      ? "✓"
                      : index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold leading-3 ${currentIndex >= index && currentIndex >= 0 ? "text-[rgb(25,66,71)]" : "text-slate-400"}`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <JiraAssignmentDialog
        open={assignOpen}
        item={item}
        currentUser={currentUser}
        personas={personas}
        selectedPersonaId={selectedPersonaId}
        setSelectedPersonaId={setSelectedPersonaId}
        assignBusy={assignBusy}
        assignError={assignError}
        onClose={() => setAssignOpen(false)}
        onConfirm={confirmAssignment}
      />
    </>
  );
}

function JiraAssignmentDialog({
  open,
  item,
  currentUser,
  personas,
  selectedPersonaId,
  setSelectedPersonaId,
  assignBusy,
  assignError,
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#102f33]/55 p-5"
      role="presentation"
    >
      <section
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-work-item-title"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087f70]">
          Jira assignment
        </p>
        <h2
          id="assign-work-item-title"
          className="mt-2 text-xl font-bold text-[#102f33]"
        >
          Assign {item?.key}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose a verified Fulcrum persona. The change will be applied by the
          FULCRUM service account and verified in Jira.
        </p>
        <label
          htmlFor="work-item-assignee"
          className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          New assignee
        </label>
        <select
          id="work-item-assignee"
          value={selectedPersonaId}
          onChange={(event) => setSelectedPersonaId(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
        >
          <option value="">Select a persona</option>
          {personas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.displayName} · {persona.role}
            </option>
          ))}
        </select>
        {currentUser && (
          <button
            type="button"
            onClick={() => setSelectedPersonaId(currentUser.id)}
            className="mt-2 cursor-pointer text-xs font-semibold text-[#087f70] hover:text-[#102f33] hover:underline"
          >
            Assign to me ({currentUser.displayName})
          </button>
        )}
        {assignError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">
            {assignError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={assignBusy}
            className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selectedPersonaId || assignBusy}
            className="cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {assignBusy ? "Assigning…" : "Confirm assignment"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CommentComposer({
  item,
  userJiraConnected,
  jiraUserName,
  commentText,
  setCommentText,
  commentBusy,
  commentError,
  onAddComment,
}) {
  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
        Add comment
      </h3>
      {userJiraConnected ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onAddComment();
          }}
          className="mt-3"
        >
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            disabled={commentBusy}
            className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
            placeholder="Write a comment to add to Jira…"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Posting to Jira as{" "}
              <span className="font-semibold text-slate-700">
                {jiraUserName || "your authorized Jira user"}
              </span>
              .
            </p>
            <button
              type="submit"
              disabled={commentBusy || !commentText.trim()}
              className="rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {commentBusy ? "Posting…" : "Post comment"}
            </button>
          </div>
          {commentError && (
            <p className="mt-3 text-xs font-semibold text-red-700" role="alert">
              {commentError}
            </p>
          )}
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-600">
            Connect your Jira account before adding a comment.
          </p>
          <a
            href={`/api/jira/user-connect?returnTo=${encodeURIComponent(`/demo?view=work-item&issue=${item.key}`)}`}
            className="cursor-pointer rounded-lg border border-[#087f70] px-4 py-2.5 text-sm font-bold text-[#087f70] transition hover:bg-[#eef8f2] focus:outline-none focus:ring-2 focus:ring-[#b9e4d1]"
          >
            Add comment
          </a>
        </div>
      )}
    </div>
  );
}

function IntakeAssessmentPanel({
  item,
  currentUser,
  intakeAssessment,
  assessmentBusy,
  assessmentError,
  transitionOffer,
  onAssessIntake,
  onPublishIntake,
  onRequestMove,
  onMoveToNextStage,
  onDismissTransition,
}) {
  const [selectedVersion, setSelectedVersion] = useState(0);
  useEffect(() => setSelectedVersion(0), [item?.key]);
  const nextStages = {
    Intake: "Context and Research",
    "Context and Research": "Risk Assessment",
    "Risk Assessment": "Review",
    Review: "Decision",
  };
  const stage = item?.statusName;
  if (!stage || !nextStages[stage]) return null;
  const canAdvance = Boolean(
    item.assigneeAccountId &&
    currentUser?.jiraIdentity?.jiraAccountId === item.assigneeAccountId,
  );
  const history = intakeAssessment?.history ?? [];
  const published = history[selectedVersion] ?? intakeAssessment?.published;
  const assessment = intakeAssessment?.assessment ?? published;
  const draft = Boolean(intakeAssessment?.assessment);
  const canMove =
    canAdvance && !draft && assessment?.recommendation === "Proceed";
  return (
    <>
      <section
        className="mt-8 rounded-xl border border-[#cfe3d8] bg-[#f7fbf8] p-5"
        aria-label="FULCRUM Intake evaluation"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#087f70]">
              FULCRUM evaluation
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#102f33]">{stage}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Evaluate whether this Jira item is ready to proceed to the next
              stage.
            </p>
          </div>
          {published && !draft && (
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-[#dcefe7] px-3 py-1 text-xs font-bold text-[#197443]">
                Published by Fulcrum
              </span>
              {published.publishedAt && (
                <time
                  dateTime={published.publishedAt}
                  className="text-[11px] text-slate-500"
                >
                  {new Date(published.publishedAt).toLocaleString()}
                </time>
              )}
            </div>
          )}
        </div>
        {!assessment ? (
          <button
            type="button"
            onClick={onAssessIntake}
            disabled={assessmentBusy}
            className="mt-4 cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] focus:outline-none focus:ring-2 focus:ring-[#52e081] disabled:cursor-wait disabled:opacity-40"
          >
            {assessmentBusy ? "Evaluating " + stage + "…" : "Evaluate " + stage}
          </button>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Score
                </p>
                <p className="mt-1 text-2xl font-bold text-[#102f33]">
                  {assessment.score}/{assessment.maxScore}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Recommendation
                </p>
                <p className="mt-1 text-sm font-bold text-[#197443]">
                  {assessment.recommendation}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Checks
                </p>
                <p className="mt-1 text-sm font-bold text-[#102f33]">
                  {
                    assessment.checks.filter((check) => check.state === "pass")
                      .length
                  }
                  /{assessment.checks.length} passed
                </p>
              </div>
            </div>
            {assessment.assessedAt && (
              <p className="mt-3 text-xs text-slate-500">
                Assessed{" "}
                <time dateTime={assessment.assessedAt}>
                  {new Date(assessment.assessedAt).toLocaleString()}
                </time>
              </p>
            )}
            <ul className="mt-4 space-y-2 text-sm">
              {assessment.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex gap-2 rounded-lg bg-white px-3 py-2"
                >
                  <span
                    className={
                      check.state === "pass"
                        ? "text-[#197443]"
                        : "text-amber-700"
                    }
                  >
                    {check.state === "pass" ? "✓" : "!"}
                  </span>
                  <span>
                    <strong className="text-slate-700">{check.label}</strong>
                    {check.failure && (
                      <span className="ml-1 text-slate-500">
                        — {check.failure}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {history.length > 1 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Previous Evaluations
                </span>
                {history.map((version, index) => (
                  <button
                    key={version.commentId ?? index}
                    type="button"
                    onClick={() => {
                      setSelectedVersion(index);
                    }}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition hover:bg-[#dcefe7] focus:outline-none focus:ring-2 focus:ring-[#b9e4d1] ${index === selectedVersion && !draft ? "bg-[#087f70] text-white hover:bg-[#087f70]" : "bg-white text-[#087f70]"}`}
                  >
                    v{version.revision ?? history.length - index}
                  </button>
                ))}
              </div>
            )}
            {draft ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onPublishIntake}
                  disabled={assessmentBusy}
                  className="cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] focus:outline-none focus:ring-2 focus:ring-[#52e081] disabled:cursor-wait disabled:opacity-40"
                >
                  {assessmentBusy
                    ? "Publishing…"
                    : "Publish evaluation to Jira"}
                </button>
                <span className="text-xs text-slate-500">
                  Publishing uses Fulcrum’s service account.
                </span>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onAssessIntake}
                  disabled={assessmentBusy}
                  className="cursor-pointer rounded-lg border border-[#087f70] px-4 py-2.5 text-sm font-bold text-[#087f70] transition hover:bg-[#eef8f2] focus:outline-none focus:ring-2 focus:ring-[#b9e4d1] disabled:cursor-wait disabled:opacity-40"
                >
                  {assessmentBusy
                    ? "Re-evaluating " + stage + "…"
                    : "Re-evaluate " + stage}
                </button>
                {canAdvance && (
                  <span className="text-xs text-slate-500">
                    A new published version will be added to Jira.
                  </span>
                )}
              </div>
            )}
            {canMove && !transitionOffer && (
              <button
                type="button"
                onClick={onRequestMove}
                disabled={assessmentBusy}
                className="mt-4 cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] focus:outline-none focus:ring-2 focus:ring-[#52e081] disabled:cursor-wait disabled:opacity-40"
              >
                Move to {nextStages[stage]}
              </button>
            )}
          </>
        )}
        {transitionOffer && canMove && (
          <div className="mt-4 rounded-lg border border-[#b9e4d1] bg-white p-4 text-sm text-slate-700">
            <strong>Assessment published.</strong> It recommends proceeding
            to&nbsp;
            <strong>{nextStages[stage]}</strong>. Would you like to move this
            Jira item now?
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onMoveToNextStage}
                disabled={assessmentBusy}
                className="cursor-pointer rounded-lg bg-[#102f33] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#17494d] focus:outline-none focus:ring-2 focus:ring-[#52e081] disabled:cursor-wait disabled:opacity-40"
              >
                Yes, move it
              </button>
              <button
                type="button"
                onClick={onDismissTransition}
                className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Not now
              </button>
            </div>
          </div>
        )}
        {assessmentError && (
          <p className="mt-3 text-xs font-semibold text-red-700" role="alert">
            {assessmentError}
          </p>
        )}
      </section>
    </>
  );
}

function PreviousAssessmentSummary({ item, intakeAssessment }) {
  const latestByStage = new Map();
  for (const evaluation of intakeAssessment?.allHistory ?? []) {
    const stage = evaluation.stage ?? "Assessment";
    if (!latestByStage.has(stage)) latestByStage.set(stage, evaluation);
  }
  const stageOrder = [
    "Intake",
    "Context and Research",
    "Risk Assessment",
    "Review",
    "Decision",
  ];
  const history = [...latestByStage.values()].sort(
    (left, right) =>
      stageOrder.indexOf(left.stage) - stageOrder.indexOf(right.stage),
  );
  if (item?.statusName === "Intake" || history.length === 0) return null;
  return (
    <section
      className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
      aria-label="Previous Fulcrum evaluations"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Evaluation history
          </p>
          <h3 className="mt-1 text-base font-bold text-[#102f33]">
            Previous stage summaries
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">
          {history.length} published
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {history.map((assessment) => (
          <article
            key={
              assessment.commentId ??
              `${assessment.stage}-${assessment.publishedAt}`
            }
            className="min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2.5"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[11px] font-bold text-[#087f70]">
                {assessment.stage ?? "Assessment"}
              </span>
              <span className="shrink-0 text-[9px] text-slate-400">
                {assessment.publishedAt
                  ? new Date(assessment.publishedAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {assessment.score}/{assessment.maxScore}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {assessment.recommendation ?? "No recommendation"}
            </p>
            {assessment.checks?.length > 0 && (
              <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-1.5">
                {assessment.checks.map((check) => (
                  <li
                    key={check.id}
                    className="flex items-center justify-between gap-1 text-[10px] text-slate-500"
                  >
                    <span className="truncate">{check.label}</span>
                    <span
                      className={`shrink-0 font-bold ${check.state === "pass" ? "text-[#197443]" : check.state === "partial" ? "text-amber-700" : "text-red-600"}`}
                    >
                      {check.points}/{check.weight}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function JiraWorkItemView({
  item,
  currentUser,
  userJiraConnected,
  commentText,
  setCommentText,
  commentBusy,
  commentError,
  onAddComment,
  intakeAssessment,
  assessmentBusy,
  assessmentError,
  transitionOffer,
  onAssessIntake,
  onPublishIntake,
  onRequestMove,
  onMoveToNextStage,
  onDismissTransition,
  onBack,
}) {
  if (!item)
    return <p className="text-sm text-slate-500">Loading Jira work item…</p>;
  if (item.error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
        Unable to load this work item: {item.error}
      </div>
    );
  const assessmentComments = (item.comments ?? []).filter((comment) =>
    String(comment.body ?? "").includes("<!-- fulcrum-assessment:"),
  );
  const latestAssessmentCommentId =
    assessmentComments[assessmentComments.length - 1]?.id;
  const visibleComments = (item.comments ?? []).filter(
    (comment) =>
      !String(comment.body ?? "").includes("<!-- fulcrum-assessment:") ||
      comment.id === latestAssessmentCommentId,
  );
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline"
        >
          ← Back to board
        </button>
      </div>
      <dl className="mt-8 grid gap-5 border-t border-slate-100 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Priority
          </dt>
          <dd className="mt-1 font-semibold text-slate-700">
            {item.priority ?? "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Issue type
          </dt>
          <dd className="mt-1 font-semibold text-slate-700">
            {item.issueType ?? "Issue"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Project
          </dt>
          <dd className="mt-1 font-semibold text-slate-700">
            {item.projectKey ?? "FCRM"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Updated
          </dt>
          <dd className="mt-1 font-semibold text-slate-700">
            {item.updated
              ? new Date(item.updated).toLocaleString()
              : "Not available"}
          </dd>
        </div>
      </dl>
      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Description
        </h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {item.description || "No description provided."}
        </p>
        {item.labels?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {item.labels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-[#edf7f0] px-2.5 py-1 text-xs font-semibold text-[#197443]"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <PreviousAssessmentSummary
        item={item}
        intakeAssessment={intakeAssessment}
      />
      <IntakeAssessmentPanel
        item={item}
        currentUser={currentUser}
        intakeAssessment={intakeAssessment}
        assessmentBusy={assessmentBusy}
        assessmentError={assessmentError}
        transitionOffer={transitionOffer}
        onAssessIntake={onAssessIntake}
        onPublishIntake={onPublishIntake}
        onRequestMove={onRequestMove}
        onMoveToNextStage={onMoveToNextStage}
        onDismissTransition={onDismissTransition}
      />
      {visibleComments.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Comments
          </h3>
          <div className="mt-3 space-y-3">
            {visibleComments.map((comment) => (
              <article key={comment.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">
                    {comment.author}
                  </span>
                  <span className="text-slate-400">
                    {comment.created
                      ? new Date(comment.created).toLocaleString()
                      : ""}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {comment.body || "No comment text."}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
      <CommentComposer
        item={item}
        userJiraConnected={userJiraConnected}
        commentText={commentText}
        setCommentText={setCommentText}
        commentBusy={commentBusy}
        commentError={commentError}
        onAddComment={onAddComment}
      />
    </section>
  );
}

function JiraBoardCard({ item }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <a
          href={`/demo?view=work-item&issue=${encodeURIComponent(item.key)}`}
          className="font-mono text-[10px] font-bold text-[rgb(9,167,141)] hover:underline"
          title={`View ${item.key} in FULCRUM`}
        >
          {item.key}
        </a>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          {item.issueType ?? "Issue"}
        </span>
      </div>
      <h4 className="mt-2 text-sm font-bold leading-5 text-slate-900">
        {item.summary}
      </h4>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">
        {item.assignee ?? "Unassigned"}
      </p>
      {item.updated && (
        <p className="mt-1 text-[10px] text-slate-400">
          Updated {new Date(item.updated).toLocaleDateString()}
        </p>
      )}
    </article>
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

function ChatPanel({
  question,
  setQuestion,
  messages,
  busy,
  ask,
  pendingCielAction,
  onConfirmPendingAction,
  onCancelPendingAction,
  onClose,
  onClear,
  jiraIssueKey,
  jiraUpdateRequest,
  onConfirmJiraUpdate,
  onCancelJiraUpdate,
}) {
  const chatScrollRef = useRef(null);
  const chatTargetRef = useRef(null);

  useEffect(() => {
    chatTargetRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [messages, busy]);

  return (
    <>
      <div className="fixed inset-x-4 bottom-24 z-50 flex max-h-[min(620px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[390px]">
        <div className="flex items-center justify-between bg-[rgba(12,34,38,0.95)] px-5 py-4 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(82,224,129)]">
              Ciel · FULCRUM AI Assistant
            </p>
            <h2 className="mt-1 font-bold">Initiative-aware chat</h2>
            <p className="mt-1 text-[11px] text-white/60">
              {jiraIssueKey
                ? `Jira ${jiraIssueKey} · can inspect and update description`
                : "No linked Jira item"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear Ciel chat"
              title="Clear chat"
              className="grid h-10 w-10 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[rgb(82,224,129)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M9 7V4h6v3m-8 0 1 13h6l1-13M10 11v5m4-5v5"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Ciel chat"
              title="Close chat"
              className="grid h-10 w-10 place-items-center rounded-lg text-2xl leading-none text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[rgb(82,224,129)]"
            >
              ×
            </button>
          </div>
        </div>
        <div
          ref={chatScrollRef}
          className="min-h-40 flex-1 space-y-3 overflow-y-auto bg-slate-100 p-4 text-sm leading-6 text-slate-800"
        >
          {messages.map((message, index) => (
            <p
              key={index}
              ref={
                index === messages.length - 1 && !busy
                  ? chatTargetRef
                  : undefined
              }
              className={`flex ${message.startsWith("You:") ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`min-w-0 max-w-[88%] break-words whitespace-pre-wrap rounded-2xl px-3 py-2.5 shadow-sm ${index === 0 ? "bg-white text-slate-600" : message.startsWith("You:") ? "rounded-br-sm bg-[rgb(217,245,225)] text-[#173b32]" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"}`}
              >
                {renderCielMessage(message)}
              </span>
            </p>
          ))}
          {busy && (
            <div
              ref={chatTargetRef}
              className="w-fit rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-slate-300"
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[rgb(82,224,129)]">
                Ciel
              </p>
              <span
                className="flex items-center gap-1"
                aria-label="Ciel is typing"
              >
                <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)] [animation-delay:-0.3s]" />
                <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)] [animation-delay:-0.15s]" />
                <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)]" />
              </span>
            </div>
          )}
          {pendingCielAction && !busy && (
            <div ref={chatTargetRef} className="flex justify-start">
              <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#087f70]">
                  Ciel
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Ready to apply the confirmed Jira update.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onConfirmPendingAction}
                    className="rounded-full bg-[#102f33] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#194247]"
                  >
                    {pendingCielAction.kind === "assignment"
                      ? "Yes, assign"
                      : pendingCielAction.kind === "transition"
                        ? "Yes, change status"
                        : "Yes, apply"}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelPendingAction}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
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
      {jiraUpdateRequest && (
        <JiraUpdateDialog
          issueKey={jiraUpdateRequest.issueKey}
          kind={jiraUpdateRequest.kind}
          onConfirm={onConfirmJiraUpdate}
          onCancel={onCancelJiraUpdate}
        />
      )}
    </>
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
