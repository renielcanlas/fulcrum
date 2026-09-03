"use client";

import {useEffect, useState} from "react";

const demoUser = {id: "analyst-7", displayName: "Daniel Reyes", role: "FCRM_ANALYST"};

export default function SandboxPage() {
  const [projectKey, setProjectKey] = useState("FCRM");
  const [jql, setJql] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    async function initializeSandbox() {
      try {
        await fetch("/api/sandbox/session", {method: "POST"});
        const response = await fetch("/api/jira/status");
        setConnection(await response.json());
      } catch {
        setConnection({connected: false});
      }
    }
    initializeSandbox();
  }, []);

  function connectJira() {
    window.location.href = "/api/jira/connect";
  }

  async function search(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({projectKey, ...(jql.trim() ? {jql} : {})});
      const response = await fetch(`/api/sandbox/jira?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "jira_request_failed");
      setItems(data.items ?? []);
      setMeta(data);
    } catch (requestError) {
      setItems([]);
      setMeta(null);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef3f1] text-[#172b2f]">
      <header className="border-b border-[#d4dfdc] bg-[#102f33] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <a href="/" className="text-sm font-bold tracking-[0.22em]">FULCRUM</a>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8ee0b0]">Integration sandbox</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70 sm:inline">Read only</span>
            <button onClick={connectJira} className="rounded-lg bg-[#55df82] px-3 py-2 text-xs font-bold text-[#102f33] hover:bg-[#7ee99d]">{connection?.connected ? "Reconnect Jira" : "Connect Jira"}</button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f70]">Jira work items</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#102f33]">Explore a project from the backend</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">Search a Jira project with JQL and inspect the normalized work-item response. This sandbox does not create, update, or attach anything to an assessment.</p>
          {connection?.connected && <p className="mt-4 text-sm font-semibold text-[#087f70]">Connected to {connection.siteName}. Searches use your Atlassian authorization.</p>}
          {connection && !connection.connected && <p className="mt-4 text-sm text-slate-500">Using synthetic data until you connect a Jira Cloud site.</p>}
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[330px_1fr]">
          <form onSubmit={search} className="h-fit rounded-2xl border border-[#d4dfdc] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#102f33]">Search input</h2>
              <span className="text-xs font-semibold text-slate-400">{demoUser.role.replace("_", " ")}</span>
            </div>
            <label className="mt-6 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500" htmlFor="project-key">Project key</label>
            <input id="project-key" value={projectKey} onChange={(event) => setProjectKey(event.target.value.toUpperCase())} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold uppercase outline-none focus:border-[#087f70]" placeholder="FCRM" maxLength={10} />
            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500" htmlFor="extra-jql">Optional JQL filter</label>
            <input id="extra-jql" value={jql} onChange={(event) => setJql(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#087f70]" placeholder="statusCategory != Done" />
            <p className="mt-2 text-xs leading-5 text-slate-500">The API always adds <code>project = {projectKey || "KEY"}</code> to keep the search scoped.</p>
            <button type="submit" disabled={busy || !projectKey} className="mt-6 w-full rounded-lg bg-[#55df82] px-4 py-3 text-sm font-bold text-[#102f33] transition hover:bg-[#7ee99d] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Fetching work items…" : "Fetch work items"}</button>
          </form>
          <section className="overflow-hidden rounded-2xl border border-[#d4dfdc] bg-white shadow-sm" aria-live="polite">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-bold text-[#102f33]">Results</h2><p className="mt-1 text-xs text-slate-500">{meta ? `${meta.mode === "demo" ? "Synthetic demo" : "Live Jira"} · ${meta.items.length} item${meta.items.length === 1 ? "" : "s"}` : "Run a search to load work items"}</p></div>
              {meta && <code className="text-xs text-slate-400">{meta.jql}</code>}
            </div>
            {error && <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
            {!error && items.length === 0 && <div className="px-5 py-16 text-center text-sm text-slate-500">No work items loaded yet.</div>}
            {items.length > 0 && <div className="divide-y divide-slate-100">{items.map((item) => <article key={item.id ?? item.key} className="px-5 py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><a href={item.url ?? `#${item.key}`} className="text-sm font-bold text-[#087f70] hover:underline">{item.key}</a><h3 className="mt-1 text-base font-bold text-slate-900">{item.summary}</h3></div><span className="rounded-full bg-[#e6f6ec] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#197443]">{item.status}</span></div><dl className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3"><div><dt className="font-bold uppercase tracking-wide">Assignee</dt><dd className="mt-1 text-slate-700">{item.assignee ?? "Unassigned"}</dd></div><div><dt className="font-bold uppercase tracking-wide">Due date</dt><dd className="mt-1 text-slate-700">{item.dueDate ?? "No due date"}</dd></div><div><dt className="font-bold uppercase tracking-wide">Type</dt><dd className="mt-1 text-slate-700">{item.issueType ?? "Unknown"}</dd></div></dl></article>)}</div>}
          </section>
        </div>
      </section>
    </main>
  );
}
