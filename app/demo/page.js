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
  ["sandbox", "Sandbox", "⚗"],
  ["help-center", "Help center", "?"],
  ["configuration", "Configuration", "⚙"],
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
const goldenInitiativeDraft = {
  summary: "Launch U.S.–Philippines Instant Remittance",
  problem: "Customers need a faster, lower-friction way to send money from the United States to recipients in the Philippines.",
  outcome: "Launch a bounded digital remittance service with traceable FCRM controls and an explicit committee decision path.",
  scope: "U.S. senders, Philippines recipients, mobile and web channels, local payment partner, and an initial transaction limit of $1,000.",
  users: "Existing U.S. customers, Philippines recipients, operations teams, FCRM analysts, and the local payment partner.",
  risk: "Cross-border instant payments, transaction velocity, sanctions and screening dependency, fraud, and third-party partner risk.",
  success: "Decision-ready assessment with evidence lineage, effective controls, assigned owners, and monitored launch conditions.",
  labels: "payments, remittance, geographic-expansion, golden-demo",
  priority: "High",
  owner: "Maya Chen",
};
const jiraWorkflowStatuses = [
  "Intake",
  "Context and Research",
  "Risk Assessment",
  "Review",
  "Accepted",
  "Rejected",
];

async function readApiJson(response, fallback) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const suffix = response.status === 404
      ? "endpoint not found; redeploy the current application"
      : `server returned ${response.status} ${response.statusText || "an HTML response"}`;
    throw new Error(`${fallback}: ${suffix}`);
  }
}

export default function DemoPage() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    "Hi, I’m Ciel. I can help you understand this initiative and its decision trail.",
  ]);
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeView, setActiveView] = useState("board");
  const [sandboxAllowed, setSandboxAllowed] = useState(null);
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
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [pendingCielAction, setPendingCielAction] = useState(null);
  const [intakeAssessment, setIntakeAssessment] = useState(null);
  const [attachmentEvidence, setAttachmentEvidence] = useState([]);
  const [assessmentBusy, setAssessmentBusy] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [transitionAssignmentOpen, setTransitionAssignmentOpen] = useState(false);
  const [transitionAssignmentError, setTransitionAssignmentError] = useState("");
  const [decisionData, setDecisionData] = useState(null);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [tour, setTour] = useState(null);
  const [tourRect, setTourRect] = useState(null);
  const activeTour = tour ? guidedDemos.find((demo) => demo.id === tour.id) : null;
  const tourStep = activeTour?.steps?.[tour?.step ?? 0] ?? null;

  useEffect(() => {
    fetch("/api/features", {cache:"no-store"}).then((response) => response.ok ? response.json() : null).then((features) => {
      if (features) setSandboxAllowed(Boolean(features.allowSyntheticSandbox));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tourStep) {
      setTourRect(null);
      return;
    }
    if (tourStep.view && activeView !== tourStep.view) {
      setActiveView(tourStep.view);
      router.replace(tourStep.view === "board" ? "/demo" : `/demo?view=${tourStep.view}`);
      return;
    }
    const updateTourTarget = () => {
      const target = document.querySelector(
        `[data-tour="${tourStep.target}"]`,
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
  }, [activeView, router, tourStep]);

  function startTour(demo) {
    if (!demo?.steps?.length) return;
    setTour({ id: demo.id, step: 0 });
  }

  function advanceTour() {
    setTour((current) => {
      if (!current) return null;
      const demo = guidedDemos.find((item) => item.id === current.id);
      return current.step + 1 >= (demo?.steps?.length ?? 0)
        ? null
        : { ...current, step: current.step + 1 };
    });
  }

  function navigateTo(view) {
    if (view === "sandbox") {
      if (!sandboxAllowed) return;
      window.open("/sandbox", "_blank", "noopener,noreferrer");
      return;
    }
    setActiveView(view);
    if (view !== "initiative-detail") setTrace(null);
    router.replace(view === "board" ? "/demo" : `/demo?view=${view}`);
  }

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000);
    fetch("/api/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await readApiJson(response, "session_load_failed");
        if (!response.ok) throw new Error(data.error ?? "session_load_failed");
        return data;
      })
      .then((data) => {
        if (data.user) setSignedIn(data.user);
        else router.replace("/");
      })
      .catch((error) => {
        // React Strict Mode intentionally runs effects once, cleans them up,
        // then runs them again in development. That cleanup abort is expected
        // and must not replace a successful second session request with an
        // error screen.
        if (error.name === "AbortError" && !timedOut) return;
        setSessionError(
          error.name === "AbortError"
            ? "session_load_timeout"
            : error.message ?? "session_load_failed",
        );
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
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
        const data = await readApiJson(response, "jira_board_load_failed");
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
    setDecisionData(null);
    setDecisionError("");
    setAttachmentEvidence([]);
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
        const decisionResponse = await fetch(`/api/jira/decision?issue=${encodeURIComponent(issueKey)}`);
        const decisionResponseData = await decisionResponse.json();
        if (decisionResponse.ok) setDecisionData(decisionResponseData);
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

  async function addAttachment(file) {
    if (!selectedWorkItem?.key || !file || attachmentBusy) return;
    setAttachmentBusy(true);
    setAttachmentError("");
    try {
      const form = new FormData();
      form.append("issueKey", selectedWorkItem.key);
      form.append("file", file);
      const response = await fetch("/api/jira/attachment/upload", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error === "authentication_required"
            ? "Your Fulcrum session expired. Return to the landing page and enter the demo again."
            : data.error === "jira_user_authorization_required"
              ? "Authorize your Jira account before uploading an attachment."
              : data.error === "jira_user_identity_mismatch"
                ? `Your Jira authorization is for ${data.jiraUser ?? "a different user"}, not ${signedIn?.displayName ?? "the current Fulcrum user"}. Reconnect Jira using the current user's Atlassian account.`
              : data.error ?? "jira_attachment_upload_failed",
        );
      await refreshWorkItem(selectedWorkItem.key);
    } catch (error) {
      setAttachmentError(error.message ?? "jira_attachment_upload_failed");
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function assessIntakeStage() {
    if (!activeIssueKey || assessmentBusy) return;
    setAssessmentBusy(true);
    setAssessmentError("");
    setTransitionOffer(false);
    try {
      const response = await fetch("/api/jira/assessment/ai", {
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
      setAttachmentEvidence(data.attachmentEvidence ?? []);
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
    } catch (error) {
      setAssessmentError(error.message ?? "intake_assessment_publish_failed");
    } finally {
      setAssessmentBusy(false);
    }
  }

  async function moveToNextStage(personaId) {
    if (assessmentBusy) return;
    setAssessmentBusy(true);
    setAssessmentError("");
    setTransitionAssignmentError("");
    try {
      const assignmentResponse = await fetch("/api/jira/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueKey: activeIssueKey, personaId }),
      });
      const assignmentData = await assignmentResponse.json();
      if (!assignmentResponse.ok)
        throw new Error(assignmentData.hint || assignmentData.error || "jira_assignment_failed");
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
      setTransitionAssignmentOpen(false);
      await refreshWorkItem(activeIssueKey);
      const boardResponse = await fetch("/api/jira");
      const boardData = await readApiJson(boardResponse, "jira_board_refresh_failed");
      if (boardResponse.ok) setBoardItems(boardData.items ?? []);
    } catch (error) {
      setTransitionAssignmentError(error.message ?? "jira_transition_failed");
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
    const decisionResponse = await fetch(`/api/jira/decision?issue=${encodeURIComponent(issueKey)}`);
    const decisionResponseData = await decisionResponse.json();
    if (decisionResponse.ok) setDecisionData(decisionResponseData);
  }

  async function submitHumanDecision(decision) {
    if (!activeIssueKey || decisionBusy) return;
    setDecisionBusy(true);
    setDecisionError("");
    try {
      const response = await fetch("/api/jira/decision", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({issueKey: activeIssueKey, decision})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "jira_decision_failed");
      await refreshWorkItem(activeIssueKey);
    } catch (error) {
      setDecisionError(error.message ?? "jira_decision_failed");
    } finally {
      setDecisionBusy(false);
    }
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

  if (sessionError)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f7] p-5 text-[rgb(25,66,71)]">
        <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
            Demo session could not load
          </p>
          <h1 className="mt-2 text-xl font-bold text-slate-950">
            FULCRUM is ready, but the login session did not return.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Refresh the page and sign in again. If this persists, check that the
            deployed app exposes <code>/api/session</code> and that cookies are
            enabled for this site.
          </p>
          <p className="mt-3 rounded-lg bg-red-50 p-3 font-mono text-xs text-red-800">
            {sessionError}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600"
            >
              Return to landing page
            </button>
          </div>
        </section>
      </main>
    );

  if (!signedIn)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f7] text-sm text-slate-500">
        Preparing the synthetic demo…
      </main>
    );

  const visibleNavItems = navItems.filter(([id]) => (id !== "configuration" || signedIn.role === "FCRM_ANALYST") && (id !== "sandbox" || sandboxAllowed === true));

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
        {visibleNavItems.map(([id, label]) => (
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
            {visibleNavItems.map(([id, label, icon]) => (
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
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeView === "guided-demos" ? "bg-[rgba(9,167,141,0.11)] text-[rgb(25,66,71)]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-lg text-base ${activeView === "guided-demos" ? "bg-[rgb(9,167,141)] text-white" : "bg-slate-100 text-slate-500"}`}>
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
                const boardData = await readApiJson(boardResponse, "jira_board_refresh_failed");
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
                onClick={() => startTour(guidedDemos.find((demo) => demo.id === "welcome-tour"))}
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
                startTour(demo);
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
                        ].filter((status) => status !== "Decision")).size,
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
                        ].filter((status) => status !== "Decision")
                    ).map((label, index) => (
                      <div
                        key={label}
                        className="min-w-[178px] flex-1 rounded-xl bg-slate-50 p-2.5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-2 px-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`mt-0.5 h-2 w-2 rounded-full ${label === "Accepted" ? "bg-[#197443]" : label === "Rejected" ? "bg-[#c2413b]" : Object.values(tones)[index % Object.values(tones).length]}`}
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
              attachmentBusy={attachmentBusy}
              attachmentError={attachmentError}
              onAddAttachment={addAttachment}
              intakeAssessment={intakeAssessment}
              decisionData={decisionData}
              decisionBusy={decisionBusy}
              decisionError={decisionError}
              attachmentEvidence={attachmentEvidence}
              assessmentBusy={assessmentBusy}
              assessmentError={assessmentError}
              transitionAssignmentOpen={transitionAssignmentOpen}
              transitionAssignmentError={transitionAssignmentError}
              onAssessIntake={assessIntakeStage}
              onPublishIntake={publishIntakeAssessment}
              onRequestMove={() => {
                setTransitionAssignmentError("");
                setTransitionAssignmentOpen(true);
              }}
              onConfirmMove={moveToNextStage}
              onCancelMove={() => setTransitionAssignmentOpen(false)}
              onSubmitDecision={submitHumanDecision}
              onBack={() => {
                setSelectedWorkItem(null);
                setActiveView("board");
                router.push("/demo");
              }}
            />
          ) : (
            <WorkspaceScreen
              view={activeView}
              onNavigate={navigateTo}
              onSandboxChange={setSandboxAllowed}
              onOpenTrace={loadTrace}
              trace={trace}
              currentUser={signedIn}
            />
          )}
        </section>
      </div>
      {tourStep && (
        <GuidedDemoTour
          step={tourStep}
          index={tour?.step ?? 0}
          total={activeTour?.steps?.length ?? 0}
          rect={tourRect}
          onBack={() => setTour((current) => current && ({ ...current, step: Math.max(0, current.step - 1) }))}
          onNext={advanceTour}
          onClose={() => setTour(null)}
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

function InitiativeForm({ currentUser }) {
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
    setForm((current) => ({ ...current, [field]: value }));
  }
  function loadGoldenInitiative() {
    setForm(goldenInitiativeDraft);
    setCreatedItem(null);
    setCreateError("");
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
          owner: form.owner,
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
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <ScreenHeading
          eyebrow="Initiative formulation"
          title="Shape a decision-ready Jira initiative"
          description="Capture the business context FULCRUM needs before the work item enters the governed workflow. Creation happens after the confirmation dialog."
        />
        <button
          type="button"
          data-tour="golden-load"
          onClick={loadGoldenInitiative}
          className="shrink-0 rounded-lg border border-[#087f70] px-4 py-2.5 text-sm font-bold text-[#087f70] transition hover:bg-[#eef8f2]"
        >
          Load Golden Initiative
        </button>
      </div>
      <div className="w-full">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setCreateConfirm(true);
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
            <label className="sm:col-span-2" data-tour="initiative-summary">
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
              <span className="relative mt-2 block">
                <select
                  value={form.priority}
                  onChange={(event) => update("priority", event.target.value)}
                  className="h-[47px] w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 pr-10 text-sm outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
                >
                  <option>Highest</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <span
                  className="pointer-events-none absolute inset-y-0 right-3 grid w-4 place-items-center text-sm text-slate-400"
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </span>
            </label>
            <label data-tour="initiative-owner">
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
              <span className="relative mt-2 block">
                <select
                  value={form.owner}
                  onChange={(event) => update("owner", event.target.value)}
                  className="h-[47px] w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 pr-10 text-sm outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"
                >
                  <option value="">Select an owner</option>
                  {personas.map((persona) => (
                    <option key={persona.id} value={persona.displayName}>
                      {persona.displayName} · {persona.role}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute inset-y-0 right-3 grid w-4 place-items-center text-sm text-slate-400"
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </span>
            </label>
            {["problem", "outcome", "scope", "users", "risk", "success"].map(
              (field) => (
                <label
                  key={field}
                  data-tour={field === "problem" ? "initiative-context" : undefined}
                  className="sm:col-span-2"
                >
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
              disabled={createBusy || Boolean(createdItem)}
              data-tour="initiative-create"
              className="rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create initiative
            </button>
          </div>
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
              service account. Review the story and accountable owner before confirming.
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
                data-tour="initiative-confirm"
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

function WorkspaceScreen({ view, onNavigate, onSandboxChange, onOpenTrace, trace, currentUser }) {
  const [helpTopic, setHelpTopic] = useState(null);
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
        "Understand why the assessment says what it says: follow the path from source material to risk findings, controls, and the human decision.",
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
    "help-center": {
      eyebrow: "Reference guide",
      title: "Help center",
      description:
        "Learn what each part of FULCRUM means and how information moves through the workbench.",
    },
    configuration: {
      eyebrow: "Governed administration",
      title: "Configuration",
      description: "Update approved risk, assessment, application, and integration settings without redeploying the application.",
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
      <div data-tour="workspace-jira">
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
                genius123!
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
                        genius123!
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
    configuration: <ConfigurationScreen currentUser={currentUser} onSandboxChange={onSandboxChange} />,
    initiatives: (
          <InitiativeForm currentUser={currentUser} />
    ),
    evidence: (
      <div className="space-y-5">
        <InfoCard title="What this page answers">
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Evidence and lineage make the assessment explainable. They show
            which source records support the facts, which facts support the
            risks, which controls reduce those risks, and where an authorized
            human made or changed the decision.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {[
              ["1", "Source material", "Jira context, documents, and linked records"],
              ["2", "Facts", "What FULCRUM extracted or accepted"],
              ["3", "Risk findings", "The risks identified for review"],
              ["4", "Controls", "The mitigations and their effectiveness"],
              ["5", "Decision", "The analyst and committee outcome"],
            ].map(([number, title, text], index) => (
              <div key={title} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dcefe7] text-xs font-bold text-[#197443]">
                  {number}
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                {index < 4 && <span className="absolute -right-2 top-1/2 hidden text-slate-300 md:block">→</span>}
              </div>
            ))}
          </div>
        </InfoCard>
        <InfoCard title="Current evidence coverage">
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
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Jira / source fact</p>
              <p className="mt-2 text-sm leading-5 text-blue-950">What the source says, including its timestamp and locator.</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">FULCRUM calculation</p>
              <p className="mt-2 text-sm leading-5 text-amber-950">Deterministic scoring, thresholds, and control effects.</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Human judgment</p>
              <p className="mt-2 text-sm leading-5 text-emerald-950">Analyst overrides and committee decisions with rationale.</p>
            </div>
          </div>
          <button
            onClick={() => onOpenTrace()}
            className="mt-5 text-sm font-bold text-[rgb(9,167,141)]"
          >
            Inspect detailed provenance →
          </button>
        </InfoCard>
      </div>
    ),
    "help-center": (
      <div className="space-y-5">
        {!helpTopic && <InfoCard title="What this help center is">
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            These short guides explain the ideas behind FULCRUM in plain language. They are reference material, not another workflow to complete.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Evidence & lineage", "How source material becomes a reviewable risk conclusion."],
              ["Human decisions", "What the system calculates and what people decide."],
              ["Jira integration", "Which system owns which information."],
              ["Ciel and AI", "What Ciel can explain, draft, and never decide."],
              ["Risk & controls", "How risks, mitigations, and residual exposure are reviewed."],
              ["Sandbox usage", "How to experiment safely with synthetic Jira scenarios."],
              ["Guided demos", "How to learn the workbench step by step."],
            ].map(([title, text]) => (
              <button key={title} type="button" onClick={() => setHelpTopic(title)} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#087f70]">
                <p className="font-bold text-slate-900">{title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
                <p className="mt-4 text-xs font-bold text-[#087f70]">Read guide →</p>
              </button>
            ))}
          </div>
        </InfoCard>}
        {helpTopic && <button type="button" onClick={() => setHelpTopic(null)} className="text-sm font-bold text-[#087f70]">← All help topics</button>}
        {helpTopic === "Evidence & lineage" && <InfoCard title="Evidence & lineage" id="help-evidence-and-lineage">
          <p className="text-sm leading-7 text-slate-600">This is the explanation trail for an assessment. It answers: “Why does FULCRUM say this?” It is useful when an analyst reviews a finding, a committee challenges a recommendation, or an auditor needs to reconstruct the decision later.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {["Source material", "Facts", "Risk findings", "Controls", "Human decision"].map((item, index) => (
              <div key={item} className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-bold text-[#087f70]">0{index + 1}</span><p className="mt-2 font-bold text-slate-900">{item}</p></div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">What comes from a source</p><p className="mt-2 text-sm leading-6 text-blue-950">Jira fields, comments, attachments, and documents are source context. They keep their source identity, timestamp, and freshness.</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">What FULCRUM adds</p><p className="mt-2 text-sm leading-6 text-emerald-950">FULCRUM links accepted facts to findings, controls, deterministic scores, analyst review, and committee decisions.</p></div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">The page is not another evidence upload form and it does not replace Jira. It is the map that makes the assessment explainable.</p>
        </InfoCard>}
        {helpTopic === "Human decisions" && <InfoCard title="Human decisions" id="help-human-decisions">
          <p className="text-sm leading-7 text-slate-600">FULCRUM prepares and explains; it does not make the final decision. The system separates automation from accountability so a useful AI suggestion cannot silently become an approval.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-600"><li>Deterministic software owns workflow, authorization, scoring, thresholds, and validation.</li><li>AI can retrieve, classify, draft, challenge, and explain with evidence.</li><li>Authorized people own overrides, approval, rejection, and conditions.</li></ul>
          <p className="mt-4 text-sm leading-7 text-slate-600"><strong className="text-slate-900">Example:</strong> Ciel may point out that geography risk is high and draft a challenge. The configured scoring service calculates the rating, and an authorized analyst or committee member decides what happens next.</p>
        </InfoCard>}
        {helpTopic === "Jira integration" && <InfoCard title="Jira integration" id="help-jira-integration">
          <p className="text-sm leading-7 text-slate-600">Jira remains authoritative for initiative and delivery work: stories, assignees, status, comments, and attachments. FULCRUM remains authoritative for the assessment, risk methodology, controls, human decisions, conditions, and audit lineage.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-900">Jira owns</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600"><li>Initiative description and delivery status</li><li>Assignees, comments, and attachments</li><li>Engineering workflow and collaboration</li></ul></div><div className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-900">FULCRUM owns</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600"><li>Risk assessment and scoring</li><li>Controls, conditions, and human decisions</li><li>Evidence lineage and audit records</li></ul></div></div>
          <p className="mt-4 text-sm leading-7 text-slate-600">When the two systems disagree, FULCRUM does not silently overwrite Jira. It shows freshness and authorization boundaries, then uses an explicit governed action where a write is allowed.</p>
        </InfoCard>}
        {helpTopic === "Ciel and AI" && <InfoCard title="Ciel and AI" id="help-ciel-and-ai">
          <p className="text-sm leading-7 text-slate-600">Ciel can explain scores, find evidence, identify gaps, draft text, and prepare bounded Jira actions. It cannot approve, reject, vote, change risk ratings, bypass permissions, invent evidence, or directly mutate authoritative state.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="font-bold text-emerald-950">Good questions for Ciel</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950"><li>Why is residual risk High?</li><li>Which evidence supports this finding?</li><li>What information is still missing?</li><li>Draft a Jira description or challenge.</li></ul></div><div className="rounded-xl border border-rose-100 bg-rose-50 p-4"><p className="font-bold text-rose-950">What Ciel cannot do</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-rose-950"><li>Make the committee decision</li><li>Change a rating or scoring rule</li><li>Invent evidence or citations</li><li>Write to Jira without confirmation</li></ul></div></div>
          <p className="mt-4 text-sm leading-7 text-slate-600">AI output is an observation or draft. The surrounding deterministic services validate permissions, tools, schemas, and any confirmed action.</p>
        </InfoCard>}
        {helpTopic === "Risk & controls" && <InfoCard title="Risk & controls" id="help-risk-and-controls">
          <p className="text-sm leading-7 text-slate-600">This topic explains how FULCRUM connects identified risks to the controls intended to reduce them. It helps reviewers distinguish the exposure before mitigation from the residual risk after controls are considered.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-rose-100 bg-rose-50 p-4"><p className="font-bold text-rose-950">Risk finding</p><p className="mt-2 text-sm leading-6 text-rose-950">A material exposure or concern identified from initiative context and evidence.</p></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-blue-950">Control</p><p className="mt-2 text-sm leading-6 text-blue-950">A preventive or detective measure that reduces exposure or improves confidence.</p></div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="font-bold text-emerald-950">Residual risk</p><p className="mt-2 text-sm leading-6 text-emerald-950">The remaining exposure after configured control effects are applied.</p></div></div>
          <p className="mt-5 text-sm leading-7 text-slate-600"><strong className="text-slate-900">Important:</strong> controls mitigate risk; they do not eliminate it. The rating is calculated deterministically from configured parameters, and authorized humans review whether the result is acceptable.</p>
        </InfoCard>}
        {helpTopic === "Sandbox usage" && <InfoCard title="Sandbox usage" id="help-sandbox-usage">
          <p className="text-sm leading-7 text-slate-600">The Sandbox is a safe experimentation surface for the Jira adapter and Ciel’s bounded Jira actions. It uses synthetic work items and is separate from the governed assessment workspace.</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600"><li>Use Jira search to inspect the fixed synthetic FCRM project.</li><li>Use Scenario automator to review or draft a bounded scenario.</li><li>Inspect validation before execution.</li><li>Confirm each write explicitly; the server performs the permitted Jira operation.</li><li>Use cleanup only when you intend to remove the synthetic items returned by the sandbox search.</li></ol>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-amber-950">Safety boundary</p><p className="mt-2 text-sm leading-6 text-amber-950">Do not use real customer data, production Jira projects, real credentials, or unreviewed custom fields in the Sandbox. Jira remains authoritative for the test work items; FULCRUM does not silently change assessment decisions.</p></div>
          <button type="button" onClick={() => onNavigate("sandbox")} className="mt-4 text-sm font-bold text-[#087f70]">Open Sandbox →</button>
        </InfoCard>}
        {helpTopic === "Guided demos" && <InfoCard title="Guided demos" id="help-guided-demos">
          <p className="text-sm leading-7 text-slate-600">The welcome tour explains the main workbench areas. The Golden Initiative flow demonstrates loading synthetic context, reviewing the owner and story, and confirming a Jira creation.</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600"><li>Start the welcome tour to learn the board, initiative, risk, and decision surfaces.</li><li>Open the Golden Initiative flow from Initiatives.</li><li>Load the synthetic context and review the accountable owner.</li><li>Create the Jira initiative only after the confirmation dialog looks correct.</li></ol>
          <button type="button" onClick={() => onNavigate("guided-demos")} className="mt-4 text-sm font-bold text-[#087f70]">Open guided demos →</button>
        </InfoCard>}
      </div>
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
    <div data-tour={`workspace-${view}`}>
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

function ConfigurationScreen({onSandboxChange}) {
  const [configuration, setConfiguration] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/configuration", {cache:"no-store"})
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "configuration_load_failed");
        setConfiguration(body.configuration);
        setDrafts(body.configuration);
      })
      .catch((loadError) => setError(loadError.message ?? "configuration_load_failed"));
  }, []);

  function update(section, key, value) {
    setDrafts((current) => ({...current, [section]: {...current[section], [key]: value}}));
  }

  function updateRisk(key, value) {
    setDrafts((current) => ({...current, risk: {...current.risk, [key]: value}}));
  }

  function updateRiskValue(key, value) {
    setDrafts((current) => ({...current, risk: {...current.risk, thresholds: {...current.risk.thresholds, [key]: value}}}));
  }

  async function save(section) {
    setBusy(section);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/configuration", {method:"PUT", headers:{"content-type":"application/json"}, body:JSON.stringify({section, values:drafts[section]})});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "configuration_save_failed");
      setConfiguration((current) => ({...current, [section]: body.config}));
      setDrafts((current) => ({...current, [section]: body.config}));
      if (section === "application") onSandboxChange?.(Boolean(body.config.allowSyntheticSandbox));
      setMessage(`${section} configuration saved. New calculations use it when they run.`);
    } catch (saveError) {
      setError(saveError.message ?? "configuration_save_failed");
    } finally {
      setBusy("");
    }
  }

  if (error) return <InfoCard title="Configuration unavailable"><p className="text-sm text-red-700">{error}</p></InfoCard>;
  if (!configuration) return <InfoCard title="Configuration"><p className="text-sm text-slate-500">Loading configuration…</p></InfoCard>;
  const risk = drafts.risk;
  const assessments = drafts.assessments;
  const application = drafts.application;
  const integrations = drafts.integrations;
  const isDirty = (section) => configurationFingerprint(configuration[section]) !== configurationFingerprint(drafts[section]);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        <p className="font-bold">Configuration boundary</p>
        <p className="mt-1">These settings are persisted in Neon and take effect without a redeploy. Secrets, API keys, OAuth client secrets, and encryption keys remain server-only Vercel environment variables and are intentionally not editable here.</p>
      </div>
      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{message}</p>}
      <ConfigCard title="Risk assessment methodology" description="Set the rating boundaries and how strongly effective controls can reduce the score.">
        <details className="mb-5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700">
          <summary className="cursor-pointer px-4 py-3 font-bold text-slate-800">Learn more about risk scoring</summary>
          <div className="border-t border-slate-200 px-4 py-4 leading-6">
            <ol className="list-decimal space-y-2 pl-5"><li>FULCRUM starts with the risks in the initiative. More serious risk factors create a higher starting score.</li><li>Controls reduce that starting score based on how effective they are.</li><li>The remaining score is compared with S1 and S2 to determine Low, Medium, or High.</li></ol>
            <div className="mt-4 rounded-lg border border-white bg-white p-3 text-xs leading-5"><p className="font-bold text-slate-900">Simple example</p><p className="mt-1">If the starting score is 78, controls are 50% effective on average, and the mitigation cap is 18 points, the controls reduce the score by 9 points: <strong>78 − (50% × 18) = 69</strong>.</p></div>
            <p className="mt-3 text-xs text-slate-500">The mitigation cap is fixed score points, not a percentage. The percentage comes from control effectiveness; the cap determines how many points that effectiveness can remove.</p>
          </div>
        </details>
        <div className="grid gap-4 lg:grid-cols-2">
          <ThresholdRange thresholds={risk.thresholds} onChangeS1={(value) => updateRiskValue("mediumMax", value)} onChangeS2={(value) => updateRiskValue("highMin", value)} />
          <MitigationScaleControl value={risk.mitigationScale} onChange={(value) => update("risk", "mitigationScale", value)} />
        </div>
        <ConfigSaveButton dirty={isDirty("risk")} busy={busy === "risk"} onClick={() => save("risk")} />
      </ConfigCard>
      <ConfigCard title="Assessment decision support" description="Set how the final readiness score is weighted and when FULCRUM suggests moving to the next workflow step.">
        <details className="mb-5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700">
          <summary className="cursor-pointer px-4 py-3 font-bold text-slate-800">Learn more about decision support</summary>
          <div className="border-t border-slate-200 px-4 py-4 leading-6"><p>The AutoScore comes from deterministic checks such as completeness, ownership, labels, and collaboration. The AI score is Ciel’s advisory review of the same assessment context.</p><p className="mt-3">The weighting slider combines those two scores into one readiness score. It does not approve, reject, or move the work automatically.</p><p className="mt-3">The proceed threshold is the point at which FULCRUM suggests moving to the next workflow step. An authorized human still reviews the evidence and confirms what happens next.</p></div>
        </details>
        <div className="grid gap-4 lg:grid-cols-2">
          <DecisionWeightControl value={assessments.aiPercent} onChange={(aiPercent) => setDrafts((current) => ({...current, assessments: {...current.assessments, aiPercent, automaticPercent: 100 - aiPercent}}))} />
          <ProceedThresholdControl value={assessments.proceedThreshold} onChange={(value) => update("assessments", "proceedThreshold", value)} />
        </div>
        <ConfigSaveButton dirty={isDirty("assessments")} busy={busy === "assessments"} onClick={() => save("assessments")} />
      </ConfigCard>
      <ConfigCard title="Application behavior" description="Operational settings that are safe to change at runtime.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigInput label="Session lifetime (minutes)" helper="New sessions expire after this many minutes. Existing sessions keep their current expiry." type="number" value={application.demoSessionMinutes} onChange={(event) => update("application", "demoSessionMinutes", event.target.value)} />
          <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={application.allowSyntheticSandbox} onChange={(event) => update("application", "allowSyntheticSandbox", event.target.checked)} /> Allow synthetic Sandbox</label>
        </div>
        <ConfigSaveButton dirty={isDirty("application")} busy={busy === "application"} onClick={() => save("application")} />
      </ConfigCard>
      <ConfigCard title="Integration behavior" description="Non-secret Jira and document-processing settings. Credentials and tokens stay in Vercel environment variables or encrypted persistence.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigInput label="Jira project key" value={integrations.jiraProjectKey} onChange={(event) => update("integrations", "jiraProjectKey", event.target.value)} />
          <ConfigInput label="Jira site URL" value={integrations.jiraSiteUrl} onChange={(event) => update("integrations", "jiraSiteUrl", event.target.value)} />
          <ConfigInput label="Jira board ID" type="number" value={integrations.jiraBoardId} onChange={(event) => update("integrations", "jiraBoardId", event.target.value)} />
          <div className="flex flex-col gap-3 self-end pb-2 text-sm font-semibold text-slate-800"><label><input type="checkbox" checked={integrations.jiraOAuthEnabled} onChange={(event) => update("integrations", "jiraOAuthEnabled", event.target.checked)} /> <span className="ml-2">Enable Jira OAuth</span></label><label><input type="checkbox" checked={integrations.documentIntelligenceEnabled} onChange={(event) => update("integrations", "documentIntelligenceEnabled", event.target.checked)} /> <span className="ml-2">Enable document extraction</span></label></div>
        </div>
        <ConfigSaveButton dirty={isDirty("integrations")} busy={busy === "integrations"} onClick={() => save("integrations")} />
      </ConfigCard>
      <p className="text-xs leading-5 text-slate-500">Loaded configuration version: {Object.values(configuration).map((item) => item?.version).filter(Boolean).join(" · ") || "database defaults"}. Changes are audited with the acting FULCRUM user.</p>
    </div>
  );
}

function ConfigCard({title, description, children}) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p><div className="mt-5">{children}</div></section>;
}

function ConfigInput({label, helper, type="text", readOnly=false, value, onChange}) {
  return <label className="block text-sm font-semibold text-slate-800">{label}<input type={type} readOnly={readOnly} value={value ?? ""} onChange={onChange} className="mt-2 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-[#087f70] read-only:bg-slate-50" />{helper && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{helper}</span>}</label>;
}

function MitigationScaleControl({value, onChange}) {
  const points = Number(value);
  const explanation = points <= 10
    ? "Stricter: even effective controls can remove only a small number of points."
    : points >= 31
      ? "More lenient: effective controls can remove a larger number of points."
      : "Balanced: controls have a moderate ability to reduce the score.";
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-bold text-slate-900">Control mitigation strength</p><p className="mt-1 text-xs leading-5 text-slate-500">Sets the maximum number of score points that fully effective controls can remove.</p><label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="mitigation-scale-slider"><div className="flex items-center gap-3"><input id="mitigation-scale-slider" aria-label="Maximum control mitigation points" type="range" min="0" max="50" value={points} onChange={(event) => onChange(Number(event.target.value))} className="h-2 w-full accent-[#194247]" /><output className="min-w-16 rounded-lg bg-white px-2 py-1 text-center text-sm font-bold text-slate-800">{points} pts</output></div></label><span className="mt-3 block rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600">{explanation}</span></div>;
}

function DecisionWeightControl({value, onChange}) {
  const aiPercent = Number(value);
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-bold text-slate-900">AI and AutoScore weighting</p><p className="mt-1 text-xs leading-5 text-slate-500">Choose how much the advisory AI score contributes to the final readiness score.</p><label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="ai-weight-slider"><div className="flex items-center gap-3"><input id="ai-weight-slider" aria-label="AI score weighting percentage" type="range" min="0" max="100" value={aiPercent} onChange={(event) => onChange(Number(event.target.value))} className="h-2 w-full accent-[#194247]" /><output className="min-w-24 rounded-lg bg-white px-2 py-1 text-center text-sm font-bold text-slate-800">AI {aiPercent}%</output></div></label><div className="mt-3 flex justify-between text-[10px] font-bold text-slate-400"><span>0% AI / 100% Auto</span><span>100% AI / 0% Auto</span></div><p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600">At 80, the final score uses 80% of the AI score and 20% of the AutoScore. AI remains advisory.</p></div>;
}

function ProceedThresholdControl({value, onChange}) {
  const threshold = Number(value);
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-bold text-slate-900">Proceed-to-next-step threshold</p><p className="mt-1 text-xs leading-5 text-slate-500">The final score must reach this value before FULCRUM suggests moving to the next workflow area.</p><label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="proceed-threshold-slider"><div className="flex items-center gap-3"><input id="proceed-threshold-slider" aria-label="Proceed to next step threshold" type="range" min="0" max="100" value={threshold} onChange={(event) => onChange(Number(event.target.value))} className="h-2 w-full accent-[#194247]" /><output className="min-w-16 rounded-lg bg-white px-2 py-1 text-center text-sm font-bold text-slate-800">{threshold}</output></div></label><div className="mt-3 flex justify-between text-[10px] font-bold text-slate-400"><span>0</span><span>100</span></div><p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600">This is a suggestion threshold, not an automatic approval or transition. A person still confirms the next step.</p></div>;
}

function ThresholdRange({thresholds, onChangeS1, onChangeS2}) {
  const s1 = Number(thresholds.mediumMax);
  const s2 = Number(thresholds.highMin);
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event) => {
      const track = trackRef.current;
      if (!track) return;
      const bounds = track.getBoundingClientRect();
      const value = Math.max(0, Math.min(100, Math.round(((event.clientX - bounds.left) / bounds.width) * 100)));
      if (dragging === "s1") onChangeS1(Math.max(5, Math.min(value, s2 - 5)));
      if (dragging === "s2") onChangeS2(Math.min(95, Math.max(value, s1 + 5)));
    };
    const stop = () => setDragging(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, {once:true});
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging, onChangeS1, onChangeS2, s1, s2]);

  function nudge(handle, direction) {
    if (handle === "s1") onChangeS1(Math.max(5, Math.min(s2 - 5, s1 + direction)));
    if (handle === "s2") onChangeS2(Math.min(95, Math.max(s1 + 5, s2 + direction)));
  }

  function handleKeyDown(handle, event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); nudge(handle, -1); }
    if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); nudge(handle, 1); }
    if (event.key === "Home") { event.preventDefault(); handle === "s1" ? onChangeS1(5) : onChangeS2(s1 + 5); }
    if (event.key === "End") { event.preventDefault(); handle === "s1" ? onChangeS1(s2 - 5) : onChangeS2(95); }
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-900">Risk rating boundaries</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Sets where the Low, Medium, and High score ranges begin and end.</p>
      <div ref={trackRef} className="relative mt-3 h-10 select-none touch-none">
        <div className="absolute left-0 right-0 top-3 h-3 rounded-full" style={{background:`linear-gradient(to right, #22c55e 0%, #facc15 ${s1}%, #facc15 ${s2}%, #ef4444 ${Math.min(100, s2 + 10)}%, #ef4444 100%)`}} />
        <button type="button" role="slider" aria-label="S1 low-risk ceiling" aria-valuemin="5" aria-valuemax={s2 - 5} aria-valuenow={s1} onPointerDown={(event) => {event.preventDefault(); setDragging("s1");}} onKeyDown={(event) => handleKeyDown("s1", event)} className="absolute top-0 z-20 h-9 w-2 -translate-x-1/2 cursor-ew-resize rounded-sm border-2 border-white bg-slate-700 shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400" style={{left:`${s1}%`}} />
        <button type="button" role="slider" aria-label="S2 high-risk floor" aria-valuemin={s1 + 5} aria-valuemax="95" aria-valuenow={s2} onPointerDown={(event) => {event.preventDefault(); setDragging("s2");}} onKeyDown={(event) => handleKeyDown("s2", event)} className="absolute top-0 z-10 h-9 w-2 -translate-x-1/2 cursor-ew-resize rounded-sm border-2 border-white bg-slate-700 shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400" style={{left:`${s2}%`}} />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
      <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 text-center text-xs"><div className="border-r border-emerald-200 bg-emerald-50 px-3 py-2"><p className="font-bold text-emerald-800">Low</p><p className="mt-1 text-emerald-700">0–{s1}</p></div><div className="border-r border-amber-200 bg-amber-50 px-3 py-2"><p className="font-bold text-amber-800">Medium</p><p className="mt-1 text-amber-700">{s1 + 1}–{s2}</p></div><div className="bg-red-50 px-3 py-2"><p className="font-bold text-red-800">High</p><p className="mt-1 text-red-700">{s2 + 1}–100</p></div></div>
    </div>
  );
}

function configurationFingerprint(value) {
  if (Array.isArray(value)) return `[${value.map(configurationFingerprint).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${configurationFingerprint(value[key])}`).join(",")}}`;
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) return String(Number(value));
  return JSON.stringify(value);
}

function ConfigSaveButton({dirty, busy, onClick}) {
  if (!dirty) return null;
  return <div className="mt-5 flex items-center gap-3"><span className="text-xs font-semibold text-amber-700">Unsaved changes</span><button type="button" onClick={onClick} disabled={busy} className="rounded-lg bg-[rgb(25,66,71)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#087f70] disabled:opacity-50">{busy ? "Saving…" : "Save configuration"}</button></div>;
}

function InfoCard({ title, children, id }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
      className="pointer-events-none fixed inset-0 z-[70]"
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
        className="pointer-events-auto absolute max-h-[calc(100vh-40px)] w-[min(320px,calc(100vw-40px))] overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
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
        {step.interactive && (
          <p className="mt-3 rounded-lg bg-[#eef8f2] px-3 py-2 text-xs font-semibold leading-5 text-[#197443]">
            Try the highlighted control, then select Next.
          </p>
        )}
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
  ];
  const current = item?.statusName ?? "";
  const currentIndex = statuses.indexOf(current);
  const terminalOutcome = current === "Accepted" || current === "Rejected" ? current : "";
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
        <div className="pb-1">
          <div className="grid grid-cols-2 items-stretch sm:grid-cols-4">
            {statuses.map((status, index) => (
              <div
                key={status}
                className={`border-y border-r px-2 py-2 first:border-l ${currentIndex >= index && currentIndex >= 0 ? "border-[rgba(82,224,129,0.45)] bg-[rgba(82,224,129,0.06)]" : "border-slate-200 bg-white"}`}
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
        {terminalOutcome && (
          <div className="px-4 pt-2 text-xs font-bold sm:px-5">
            Final outcome: <span className={terminalOutcome === "Accepted" ? "text-[#197443]" : "text-[#c2413b]"}>{terminalOutcome}</span>
          </div>
        )}
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

function isFulcrumComment(comment) {
  const body = String(comment?.body ?? "");
  return body.includes("<!-- fulcrum-assessment:") || body.includes("<!-- fulcrum-evaluation:") || body.includes("<!-- fulcrum-decision:") || body.includes("FULCRUM_ASSESSMENT_JSON:") || body.includes("FULCRUM_EVALUATION_JSON:") || body.includes("FULCRUM_DECISION_JSON:");
}

function readableFulcrumComment(body) {
  return String(body ?? "")
    .split(/\nFULCRUM_(?:ASSESSMENT|EVALUATION|DECISION)_JSON:/i)[0]
    .replace(/<!-- fulcrum-(?:assessment|evaluation|decision):[^>]*-->/gi, "")
    .trim() || "FULCRUM automated details are available in the evaluation above.";
}

function ScoreBar({ label, score, maxScore, color }) {
  const percent = maxScore > 0 ? Math.max(0, Math.min(100, (score / maxScore) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between gap-3 text-[11px]">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="text-slate-500">{score}/{maxScore}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${label}: ${score} of ${maxScore}`}>
        <div className={`h-full rounded-full ${color}`} style={{width: `${percent}%`}} />
      </div>
    </div>
  );
}

function weightedCheckScore(check, assessment) {
  const weighting = assessment?.decisionWeighting ?? assessment?.weightedDecision ?? {};
  const automaticWeight = Number(weighting.automaticPercent ?? 25) / 100;
  const aiWeight = Number(weighting.aiPercent ?? 75) / 100;
  const aiReview = assessment?.aiDecisionSupport?.checkReviews?.find((review) => review.checkId === check.id);
  if (!aiReview) return {points: check.points, max: check.weight, hasAi: false};
  return {
    points: Number(((check.points * automaticWeight) + (aiReview.points * aiWeight)).toFixed(1)),
    max: check.weight,
    hasAi: true,
  };
}

function ChecklistScoreGraphic({ check, aiReview, weighting }) {
  const automaticPercent = check.weight > 0 ? Math.max(0, Math.min(100, (check.points / check.weight) * 100)) : 0;
  const aiPercent = aiReview && aiReview.weight > 0 ? Math.max(0, Math.min(100, (aiReview.points / aiReview.weight) * 100)) : 0;
  const automaticWeight = Number(weighting?.automaticPercent ?? 25) / 100;
  const aiWeight = Number(weighting?.aiPercent ?? 75) / 100;
  const combinedPercent = aiReview ? (automaticPercent * automaticWeight) + (aiPercent * aiWeight) : automaticPercent;
  const combinedPoints = aiReview ? ((check.points * automaticWeight) + (aiReview.points * aiWeight)).toFixed(1).replace(".0", "") : check.points;
  const scoreTone = combinedPercent >= 80
    ? {ring: "#197443", track: "#dcefe7", text: "text-[#197443]"}
    : combinedPercent < 50
      ? {ring: "#c2413b", track: "#f8dedb", text: "text-[#c2413b]"}
      : {ring: "#b7791f", track: "#f8ebc9", text: "text-[#b7791f]"};
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-start gap-1.5">
          <strong className="text-xs leading-4 text-slate-700">{check.label}</strong>
        </span>
        <span className="shrink-0 text-[10px] text-slate-400">/{check.weight}</span>
      </div>
      <div className="mt-3 flex justify-center" role="img" aria-label={`${check.label}: combined score ${combinedPoints} of ${check.weight}`}>
        <div className="grid h-[76px] w-[76px] place-items-center rounded-full" style={{background: `conic-gradient(${scoreTone.ring} 0 ${combinedPercent}%, ${scoreTone.track} ${combinedPercent}% 100%)`}}>
          <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-white text-center">
            <span className={`text-xl font-bold ${scoreTone.text}`}>{combinedPoints}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-3 text-[10px]">
        <span className="text-[#087f70]"><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#087f70]" />Auto {check.points}</span>
        <span className="text-[#6d5bd0]"><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#6d5bd0]" />AI {aiReview?.points ?? "—"}</span>
      </div>
      <p className="mt-2 min-h-8 text-[10px] leading-4 text-slate-500">{aiReview?.observation ?? check.failure ?? "No additional observation."}</p>
    </li>
  );
}

function IntakeAssessmentPanel({
  item,
  currentUser,
  intakeAssessment,
  assessmentBusy,
  assessmentError,
  transitionAssignmentOpen,
  transitionAssignmentError,
  attachmentEvidence,
  onAssessIntake,
  onPublishIntake,
  onRequestMove,
  onConfirmMove,
  onCancelMove,
}) {
  const [selectedVersion, setSelectedVersion] = useState(0);
  const hasDraft = Boolean(intakeAssessment?.assessment);
  useEffect(() => setSelectedVersion(hasDraft ? "draft" : 0), [item?.key, hasDraft]);
  const nextStages = {
    Intake: "Context and Research",
    "Context and Research": "Risk Assessment",
    "Risk Assessment": "Review",
  };
  const stage = item?.statusName;
  if (!stage || !["Intake", "Context and Research", "Risk Assessment", "Review"].includes(stage)) return null;
  const canAdvance = Boolean(
    item.assigneeAccountId &&
    currentUser?.jiraIdentity?.jiraAccountId === item.assigneeAccountId,
  );
  const history = intakeAssessment?.history ?? [];
  const selectedPublished = selectedVersion === "draft" ? null : history[Number(selectedVersion)] ?? intakeAssessment?.published;
  const assessment = selectedVersion === "draft" && hasDraft ? intakeAssessment.assessment : selectedPublished;
  const draft = selectedVersion === "draft" && hasDraft;
  const weightedDecision = assessment?.weightedDecision ?? {score: assessment?.score ?? 0, maxScore: assessment?.maxScore ?? 0, recommendation: assessment?.recommendation ?? "Hold for remediation"};
  const canMove =
    Boolean(nextStages[stage]) && canAdvance && !draft && weightedDecision.recommendation === "Proceed";
  return (
    <>
      <section
        className="mt-8 rounded-xl border border-[#cfe3d8] bg-[#f7fbf8] p-4"
        aria-label="FULCRUM Intake evaluation"
        aria-busy={assessmentBusy}
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
            {stage === "Risk Assessment" && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                This is a stage-readiness score. Risk boundaries and control
                mitigation strength affect the separate initiative residual-risk
                calculation, not these Jira completeness checks.
              </p>
            )}
          </div>
          {selectedPublished && !draft && (
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-[#dcefe7] px-3 py-1 text-xs font-bold text-[#197443]">
                Published by Fulcrum
              </span>
              {selectedPublished.publishedAt && (
                <time
                  dateTime={selectedPublished.publishedAt}
                  className="text-[11px] text-slate-500"
                >
                  {new Date(selectedPublished.publishedAt).toLocaleString()}
                </time>
              )}
            </div>
          )}
        </div>
        {(history.length > 0 || hasDraft) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#dcefe7] pt-4">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              Assessment version
            </span>
            {hasDraft && (
              <button
                type="button"
                onClick={() => setSelectedVersion("draft")}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition hover:bg-[#dcefe7] focus:outline-none focus:ring-2 focus:ring-[#b9e4d1] ${selectedVersion === "draft" ? "bg-[#087f70] text-white hover:bg-[#087f70]" : "bg-white text-[#087f70]"}`}
              >
                Current draft
              </button>
            )}
            {history.map((version, index) => (
              <button
                key={version.commentId ?? index}
                type="button"
                onClick={() => setSelectedVersion(index)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition hover:bg-[#dcefe7] focus:outline-none focus:ring-2 focus:ring-[#b9e4d1] ${index === selectedVersion && !draft ? "bg-[#087f70] text-white hover:bg-[#087f70]" : "bg-white text-[#087f70]"}`}
              >
                v{version.revision ?? history.length - index}
              </button>
            ))}
          </div>
        )}
        {!assessment ? (
          <button
            type="button"
            onClick={onAssessIntake}
            disabled={assessmentBusy}
            className="mt-4 cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] focus:outline-none focus:ring-2 focus:ring-[#52e081] disabled:cursor-wait disabled:opacity-40"
          >
            {assessmentBusy ? "Evaluating " + stage + "…" : "Evaluate " + stage}
          </button>
        ) : assessmentBusy ? (
          <EvaluationLoadingSkeleton stage={stage} />
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Weighted score
                </p>
                <p className="mt-1 text-xl font-bold text-[#102f33]">
                  {weightedDecision.score}/{weightedDecision.maxScore}
                </p>
                <div className="mt-2 space-y-1.5">
                  <ScoreBar label="Automatic" score={assessment.score} maxScore={assessment.maxScore} color="bg-[#087f70]" />
                  {assessment.aiDecisionSupport?.score !== undefined && <ScoreBar label="AI" score={assessment.aiDecisionSupport.score} maxScore={assessment.aiDecisionSupport.maxScore ?? assessment.maxScore} color="bg-[#6d5bd0]" />}
                </div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Weighted decision
                </p>
                <p className="mt-1 text-sm font-bold text-[#197443]">
                  {weightedDecision.recommendation}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {assessment.score}/{assessment.maxScore} automatic · {assessment.decisionWeighting?.automaticPercent ?? 25}% automatic / {assessment.decisionWeighting?.aiPercent ?? 75}% AI
                </p>
                {assessment.aiDecisionSupport && (
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    AI response: {assessment.aiDecisionSupport.recommendation} · {assessment.aiDecisionSupport.reviewedCheckCount ?? assessment.aiDecisionSupport.checkReviews?.length ?? 0}/{assessment.checks.length} checks reviewed
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-white p-2.5">
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
            <details className="mt-2 rounded-lg bg-white p-2.5">
              <summary className="cursor-pointer text-xs font-bold text-slate-600 hover:text-[#087f70]">View scoring configuration</summary>
              <div className="mt-2 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
                <p>Proceed threshold: <strong className="text-slate-700">{assessment.configurationSnapshot?.assessment?.proceedThreshold ?? assessment.scoreBands?.find((band) => band.label === "Proceed")?.min ?? 80}</strong></p>
                <p>Partial credit: <strong className="text-slate-700">{Math.round((assessment.scoring?.partialCreditFactor ?? 0.5) * 100)}%</strong></p>
                <p>Decision weighting: <strong className="text-slate-700">{assessment.decisionWeighting?.automaticPercent ?? 25}% automatic / {assessment.decisionWeighting?.aiPercent ?? 75}% AI</strong></p>
              </div>
              <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                {assessment.checks.map((check) => <li key={`weight-${check.id}`} className="flex justify-between gap-3"><span>{check.label}</span><strong className="text-slate-700">{check.weight} pts</strong></li>)}
              </ul>
            </details>
            {assessment.assessedAt && (
              <p className="mt-3 text-xs text-slate-500">
                Assessed{" "}
                <time dateTime={assessment.assessedAt}>
                  {new Date(assessment.assessedAt).toLocaleString()}
                </time>
              </p>
            )}
            {assessment.aiDecisionSupport && (
              <div className="mt-3 rounded-lg border border-[#b9e4d1] bg-[#eef8f2] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#087f70]">
                    AI response
                  </p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#197443]">
                    Proposed: {assessment.aiDecisionSupport.recommendation}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {assessment.aiDecisionSupport.summary}
                </p>
                <div className="mt-2 rounded-md bg-white px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Challenge to the idea</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{assessment.aiDecisionSupport.challenge ?? "No additional challenge was returned."}</p>
                </div>
                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-md bg-white px-3 py-2">
                    <p className="font-bold uppercase tracking-wide text-[#197443]">Potential benefits</p>
                    {assessment.aiDecisionSupport.pros?.length ? <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-600">{assessment.aiDecisionSupport.pros.map((item, index) => <li key={`pro-${index}`}>{item}</li>)}</ul> : <p className="mt-1 text-slate-500">None identified.</p>}
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    <p className="font-bold uppercase tracking-wide text-amber-700">Risks and trade-offs</p>
                    {assessment.aiDecisionSupport.cons?.length ? <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-600">{assessment.aiDecisionSupport.cons.map((item, index) => <li key={`con-${index}`}>{item}</li>)}</ul> : <p className="mt-1 text-slate-500">None identified.</p>}
                  </div>
                </div>
                {assessment.aiDecisionSupport.rationale?.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
                    {assessment.aiDecisionSupport.rationale.map((reason, index) => (
                      <li key={`${reason}-${index}`}>{reason}</li>
                    ))}
                  </ul>
                )}
                {assessment.aiContext && (
                  <p className="mt-3 text-[11px] text-slate-500">
                    Reviewed Jira context: {assessment.aiContext.commentCount} comment(s) · {assessment.aiContext.attachmentCount} attachment(s) · {assessment.aiContext.extractedAttachmentCount ?? 0} PDF attachment(s) extracted with page references.
                  </p>
                )}
                {attachmentEvidence?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                    {attachmentEvidence.map((evidence) => (
                      <li key={evidence.attachmentId} className="flex flex-wrap justify-between gap-2 rounded-md bg-white px-2 py-1.5">
                        <span className="font-semibold">{evidence.filename}</span>
                        <span className={evidence.status === "completed" ? "text-[#197443]" : "text-amber-700"}>
                          {evidence.status === "completed" ? `${evidence.pages?.length ?? 0} page(s) extracted` : evidence.reason ?? evidence.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {assessment.aiDecisionSupport.proposedComment && (
                  <div className="mt-3 rounded-lg bg-white p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Proposed Jira comment
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                      {assessment.aiDecisionSupport.proposedComment}
                    </p>
                  </div>
                )}
              </div>
            )}
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 text-sm">
              {assessment.checks.map((check) => {
                const aiReview = assessment.aiDecisionSupport?.checkReviews?.find((review) => review.checkId === check.id);
                  return <ChecklistScoreGraphic key={check.id} check={check} aiReview={aiReview} weighting={assessment.decisionWeighting} />;
              })}
            </ul>
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
            {canMove && (
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
        <TransitionAssignmentDialog
          open={transitionAssignmentOpen}
          item={item}
          currentUser={currentUser}
          nextStage={nextStages[stage]}
          busy={assessmentBusy}
          error={transitionAssignmentError}
          onCancel={onCancelMove}
          onConfirm={onConfirmMove}
        />
        {assessmentError && (
          <p className="mt-3 text-xs font-semibold text-red-700" role="alert">
            {assessmentError}
          </p>
        )}
      </section>
    </>
  );
}

function TransitionAssignmentDialog({open, item, currentUser, nextStage, busy, error, onCancel, onConfirm}) {
  const [personas, setPersonas] = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedPersonaId("");
    fetch("/api/demo-users")
      .then((response) => response.json())
      .then((users) => setPersonas(Array.isArray(users) ? users : []))
      .catch(() => setPersonas([]));
  }, [open]);

  if (!open) return null;
  const availablePersonas = personas.filter((persona) => persona.jiraIdentity?.jiraAccountId !== item?.assigneeAccountId);
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#102f33]/55 p-5" role="presentation">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="transition-assignment-title">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087f70]">Confirm stage transition</p>
        <h2 id="transition-assignment-title" className="mt-2 text-xl font-bold text-[#102f33]">Reassign before moving to {nextStage}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose the accountable person for the next stage. FULCRUM will verify the Jira assignment first, then move {item?.key} forward.</p>
        <label htmlFor="transition-assignee" className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">Next-stage assignee</label>
        <select id="transition-assignee" value={selectedPersonaId} onChange={(event) => setSelectedPersonaId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]">
          <option value="">Select a different assignee</option>
          {availablePersonas.map((persona) => <option key={persona.id} value={persona.id}>{persona.displayName} · {persona.role}</option>)}
        </select>
        {currentUser && <p className="mt-2 text-xs text-slate-500">Current signed-in user: {currentUser.displayName}. The current Jira assignee is excluded from this handoff list.</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
          <button type="button" onClick={() => onConfirm(selectedPersonaId)} disabled={!selectedPersonaId || busy} className="cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Assigning and moving…" : "Confirm assignment and move"}</button>
        </div>
      </section>
    </div>
  );
}

function EvaluationLoadingSkeleton({stage}) {
  return (
    <div className="mt-4 animate-pulse" role="status" aria-label={`Re-evaluating ${stage}`}>
      <span className="sr-only">Re-evaluating {stage}…</span>
      <div className="grid gap-3 sm:grid-cols-3">
        {["score", "decision", "checks"].map((section) => (
          <div key={section} className="rounded-lg bg-white p-3">
            <div className="h-2.5 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-6 w-20 rounded bg-slate-200" />
            <div className="mt-4 space-y-2">
              <div className="h-2 rounded bg-slate-100" />
              <div className="h-2 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-white p-3">
        <div className="h-2.5 w-36 rounded bg-slate-200" />
        <div className="mt-3 h-2 w-full rounded bg-slate-100" />
        <div className="mt-2 h-2 w-11/12 rounded bg-slate-100" />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({length: 6}, (_, index) => (
          <div key={index} className="rounded-lg bg-white p-3">
            <div className="h-2.5 w-3/5 rounded bg-slate-200" />
            <div className="mt-3 h-2 w-full rounded bg-slate-100" />
            <div className="mt-2 h-2 w-4/5 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
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
          {intakeAssessment?.allHistory?.length ?? 0} published
          {intakeAssessment?.assessment ? " · 1 draft" : ""}
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
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Stage readiness score
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-700">
              {(assessment.weightedDecision?.score ?? assessment.score)}/{assessment.weightedDecision?.maxScore ?? assessment.maxScore}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {assessment.weightedDecision?.recommendation ?? assessment.recommendation ?? "No recommendation"}
            </p>
            {assessment.checks?.length > 0 && (
              <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-1.5">
                {assessment.checks.map((check) => (
                  <li
                    key={check.id}
                    className="flex items-center justify-between gap-1 text-[10px] text-slate-500"
                  >
                    <span className="truncate">{check.label}</span>
                    <span className="shrink-0 font-bold text-slate-700">
                      {weightedCheckScore(check, assessment).points}/{check.weight}
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

function HumanDecisionPanel({item, currentUser, intakeAssessment, decisionData, decisionBusy, decisionError, onSubmitDecision}) {
  const [outcome, setOutcome] = useState("ACCEPTED");
  const [rationale, setRationale] = useState("");
  if (item?.statusName !== "Review") return null;
  const latestDecision = decisionData?.decisions?.[0];
  const publishedEvaluation = intakeAssessment?.published;
  const ready = publishedEvaluation && (publishedEvaluation.weightedDecision?.recommendation ?? publishedEvaluation.recommendation) === "Proceed";
  const isCommittee = currentUser?.role === "RISK_COMMITTEE";
  function submit(event) { event.preventDefault(); onSubmitDecision({outcome, rationale}); }
  return (
    <section className="mt-8 rounded-xl border border-[#ead9b5] bg-[#fffaf0] p-4" aria-label="Human decision panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Human decision</p>
          <h3 className="mt-1 text-lg font-bold text-[#102f33]">Final committee decision</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">AI and automated checks provide decision support; an authorized committee member accepts or rejects the initiative.</p>
        </div>
        {latestDecision && <span className="rounded-full bg-[#dcefe7] px-3 py-1 text-xs font-bold text-[#197443]">Decision recorded</span>}
      </div>
      {latestDecision ? (
        <div className="mt-4 rounded-lg border border-[#ead9b5] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><strong className={`text-sm ${latestDecision.outcome === "ACCEPTED" ? "text-[#197443]" : "text-[#c2413b]"}`}>{latestDecision.label}</strong><span className="text-xs text-slate-500">{latestDecision.actor?.name} · {latestDecision.publishedAt ? new Date(latestDecision.publishedAt).toLocaleString() : ""}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{latestDecision.rationale}</p>
          {latestDecision.conditions?.length > 0 && <ul className="mt-3 space-y-1 text-xs text-slate-600">{latestDecision.conditions.map((condition, index) => <li key={`${condition.description}-${index}`}>• {condition.description} · {condition.owner} · due {condition.dueDate} · {condition.status}</li>)}</ul>}
        </div>
      ) : !isCommittee ? (
        <p className="mt-4 rounded-lg bg-white p-3 text-sm text-slate-600">Only a Risk Committee member can record the final decision.</p>
      ) : !ready ? (
        <p className="mt-4 rounded-lg bg-white p-3 text-sm text-slate-600">Publish a Review-stage evaluation with a weighted Proceed recommendation before recording the final outcome.</p>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"><option value="ACCEPTED">Accept initiative</option><option value="REJECTED">Reject initiative</option></select></label>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Rationale<textarea value={rationale} onChange={(event) => setRationale(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]" placeholder="Explain the human decision and material considerations." /></label>
          {decisionError && <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700" role="alert">{decisionError}</p>}
          <div className="flex justify-end"><button type="submit" disabled={decisionBusy || rationale.trim().length < 10} className="cursor-pointer rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17494d] disabled:cursor-not-allowed disabled:opacity-40">{decisionBusy ? "Recording decision…" : "Record human decision"}</button></div>
        </form>
      )}
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
  attachmentBusy,
  attachmentError,
  onAddAttachment,
  intakeAssessment,
  attachmentEvidence,
  assessmentBusy,
  assessmentError,
  transitionAssignmentOpen,
  transitionAssignmentError,
  onAssessIntake,
  onPublishIntake,
  onRequestMove,
  onConfirmMove,
  onCancelMove,
  onBack,
  decisionData,
  decisionBusy,
  decisionError,
  onSubmitDecision,
}) {
  const [openAttachment, setOpenAttachment] = useState(null);
  if (!item)
    return <p className="text-sm text-slate-500">Loading Jira work item…</p>;
  if (item.error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
        Unable to load this work item: {item.error}
      </div>
    );
  const visibleComments = item.comments ?? [];
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
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Attachments</h3>
            {userJiraConnected ? (
              <label className="cursor-pointer rounded-lg border border-[#087f70] px-3 py-2 text-xs font-bold text-[#087f70] transition hover:bg-[#eef8f2] focus-within:ring-2 focus-within:ring-[#b9e4d1]">
                {attachmentBusy ? "Uploading…" : "Add attachment"}
                <input
                  type="file"
                  className="sr-only"
                  disabled={attachmentBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) onAddAttachment(file);
                  }}
                />
              </label>
            ) : (
              <a
                href={`/api/jira/user-connect?returnTo=${encodeURIComponent(`/demo?view=work-item&issue=${item.key}`)}`}
                className="cursor-pointer rounded-lg border border-[#087f70] px-3 py-2 text-xs font-bold text-[#087f70] transition hover:bg-[#eef8f2] focus:outline-none focus:ring-2 focus:ring-[#b9e4d1]"
              >
                Connect Jira to attach
              </a>
            )}
          </div>
          {item.attachments?.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50">
              {item.attachments.map((attachment) => (
                <li key={attachment.id} className="flex min-w-0 items-center gap-3 px-4 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-sm text-[#087f70]" aria-hidden="true">↗</span>
                  <div className="min-w-0 flex-1">
                    {(/\.pdf$/i.test(attachment.filename ?? "") || attachment.mimeType === "application/pdf") ? (
                      <button
                        type="button"
                        onClick={() => setOpenAttachment(attachment)}
                        className="block max-w-full cursor-pointer break-words text-left text-sm font-semibold text-[#087f70] underline-offset-2 transition hover:text-[#102f33] hover:underline focus:outline-none focus:ring-2 focus:ring-[#b9e4d1]"
                      >
                        {attachment.filename}
                      </button>
                    ) : (
                      <a
                        href={`/api/jira/attachment?issue=${encodeURIComponent(item.key)}&attachment=${encodeURIComponent(attachment.id)}&filename=${encodeURIComponent(attachment.filename)}`}
                        download={attachment.filename}
                        className="block break-words text-sm font-semibold text-[#087f70] underline-offset-2 transition hover:text-[#102f33] hover:underline focus:outline-none focus:ring-2 focus:ring-[#b9e4d1]"
                      >
                        {attachment.filename}
                      </a>
                    )}
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {attachment.mimeType}{attachment.size ? ` · ${(attachment.size / 1024).toFixed(1)} KB` : ""}{attachment.author && attachment.author !== "Unknown" ? ` · ${attachment.author}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-slate-500">No attachments yet.</p>}
          {attachmentError && <p className="mt-3 text-xs font-semibold text-red-700" role="alert">{attachmentError}</p>}
        </div>
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
        attachmentEvidence={attachmentEvidence}
      />
      <IntakeAssessmentPanel
        item={item}
        currentUser={currentUser}
        intakeAssessment={intakeAssessment}
        assessmentBusy={assessmentBusy}
        assessmentError={assessmentError}
        transitionAssignmentOpen={transitionAssignmentOpen}
        transitionAssignmentError={transitionAssignmentError}
        onAssessIntake={onAssessIntake}
        onPublishIntake={onPublishIntake}
        onRequestMove={onRequestMove}
        onConfirmMove={onConfirmMove}
        onCancelMove={onCancelMove}
      />
      <HumanDecisionPanel
        item={item}
        currentUser={currentUser}
        intakeAssessment={intakeAssessment}
        decisionData={decisionData}
        decisionBusy={decisionBusy}
        decisionError={decisionError}
        onSubmitDecision={onSubmitDecision}
      />
      {visibleComments.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Comments
          </h3>
          <div className="mt-3 space-y-3">
            {visibleComments.map((comment) => {
              const fulcrumComment = isFulcrumComment(comment);
              const header = (
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
              );
              if (fulcrumComment) {
                return (
                  <details key={comment.id} className="rounded-xl border border-[#cfe3d8] bg-[#f7fbf8] px-4 py-3">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dcefe7] text-xs text-[#087f70]" aria-hidden="true">+</span>
                        <div className="min-w-0 flex-1">
                          {header}
                          <p className="mt-1 text-xs font-semibold text-[#087f70]">FULCRUM automated comment · click to expand</p>
                        </div>
                      </div>
                    </summary>
                    <div className="mt-3 border-t border-[#cfe3d8] pt-3">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{readableFulcrumComment(comment.body)}</p>
                      <p className="mt-2 text-[10px] text-slate-400">Machine-readable evaluation data is hidden from this comment view.</p>
                    </div>
                  </details>
                );
              }
              return (
                <article key={comment.id} className="rounded-xl bg-slate-50 p-4">
                  {header}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {comment.body || "No comment text."}
                  </p>
                </article>
              );
            })}
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
      {openAttachment && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#102f33]/70 p-4 sm:p-8"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpenAttachment(null);
          }}
        >
          <section
            className="flex h-[min(88vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attachment-dialog-title"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#087f70]">Jira attachment</p>
                <h2 id="attachment-dialog-title" className="truncate text-sm font-bold text-[#102f33]">{openAttachment.filename}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenAttachment(null)}
                className="shrink-0 cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#b9e4d1]"
              >
                Close
              </button>
            </div>
            <iframe
              title={openAttachment.filename}
              src={`/api/jira/attachment?issue=${encodeURIComponent(item.key)}&attachment=${encodeURIComponent(openAttachment.id)}&filename=${encodeURIComponent(openAttachment.filename)}`}
              className="min-h-0 flex-1 bg-slate-100"
            />
          </section>
        </div>
      )}
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
