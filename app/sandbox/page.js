"use client";

import {useEffect, useState} from "react";

const PROJECT_KEY = "FCRM";
const menu = [["search", "Jira search"], ["automator", "Scenario automator"]];

export default function SandboxPage() {
  const [view, setView] = useState("search");
  const [connection, setConnection] = useState(null);
  const [jql, setJql] = useState("");
  const [results, setResults] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState("details");
  const [run, setRun] = useState(null);
  const scenario = scenarios.find((item) => item.id === selectedId);

  useEffect(() => {
    async function initialize() {
      await fetch("/api/sandbox/session", {method: "POST"});
      const [status, scenarioResponse] = await Promise.all([fetch("/api/jira/status"), fetch("/api/sandbox/scenarios")]);
      const data = await scenarioResponse.json();
      setConnection(await status.json());
      setScenarios(data.scenarios ?? []);
      if (data.scenarios?.[0]) setSelectedId(data.scenarios[0].id);
    }
    initialize().catch(() => setConnection({connected: false}));
  }, []);

  async function search(event) {
    event.preventDefault();
    const query = jql.trim() ? `?jql=${encodeURIComponent(jql)}` : "";
    const response = await fetch(`/api/sandbox/jira${query}`);
    const data = await response.json();
    setResults(response.ok ? data : {error: data.error ?? "jira_request_failed"});
  }

  async function execute() {
    if (!scenario || !connection?.connected || run?.active) return;
    const steps = scenario.steps ?? [];
    setRun({active: true, steps: steps.map((step) => ({...step, state: "pending"}))});
    let issueKey;
    for (let index = 0; index < steps.length; index += 1) {
      setRun((current) => ({...current, steps: current.steps.map((step, stepIndex) => stepIndex === index ? {...step, state: "running"} : step)}));
      try {
        const response = await fetch("/api/sandbox/jira/execute-step", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({step: steps[index], issueKey})});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "scenario_step_failed");
        issueKey = data.key ?? issueKey;
        setRun((current) => ({...current, issueKey, steps: current.steps.map((step, stepIndex) => stepIndex === index ? {...step, state: "success", result: data} : step)}));
      } catch (error) {
        setRun((current) => ({...current, active: false, steps: current.steps.map((step, stepIndex) => stepIndex === index ? {...step, state: "failed", error: error.message} : step)}));
        return;
      }
    }
    setRun((current) => ({...current, active: false}));
  }

  return <main className="min-h-screen bg-[#edf2f0] text-[#172b2f]"><header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#d3dfdb] bg-[#102f33] px-5 text-white shadow-lg lg:px-8"><a href="/" className="text-sm font-bold tracking-[0.22em]">FULCRUM <span className="font-normal tracking-normal text-white/60">Sandbox</span></a><div className="flex items-center gap-3"><span className="hidden rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70 sm:inline">{PROJECT_KEY} project</span><button type="button" onClick={() => {window.location.href = "/api/jira/connect";}} className="rounded-lg bg-[#55df82] px-3 py-2 text-xs font-bold text-[#102f33]">{connection?.connected ? "Reconnect Jira" : "Connect Jira"}</button></div></header><div className="mx-auto flex max-w-[1600px]"><aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 self-start border-r border-[#d3dfdb] bg-[#f8faf9] px-4 py-7 lg:block"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#087f70]">Sandbox</p><p className="mb-7 mt-2 px-3 text-sm font-semibold text-slate-900">All experiments</p><nav className="space-y-1" aria-label="Sandbox navigation">{menu.map(([id, label]) => <button type="button" key={id} onClick={() => setView(id)} className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${view === id ? "bg-[#dcefe7] text-[#102f33]" : "text-slate-500 hover:bg-white"}`}>{label}</button>)}</nav></aside><div className="min-w-0 flex-1"><nav className="flex gap-2 border-b border-[#d3dfdb] bg-white px-4 py-3 lg:hidden" aria-label="Sandbox navigation">{menu.map(([id, label]) => <button type="button" key={id} onClick={() => setView(id)} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold">{label}</button>)}</nav><section className="px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{view === "search" ? <Search jql={jql} setJql={setJql} results={results} onSearch={search} /> : <Automator scenario={scenario} scenarios={scenarios} selectedId={selectedId} setSelectedId={(id) => {setSelectedId(id); setTab("details");}} tab={tab} setTab={setTab} connection={connection} run={run} onRequestExecute={() => setRun({confirm: true, active: false, steps: (scenario?.steps ?? []).map((step) => ({...step, state: "pending"}))})} onExecute={execute} onCancel={() => setRun(null)} onClose={() => setRun(null)} />}</section></div></div></main>;
}

function Search({jql, setJql, results, onSearch}) { return <><Header eyebrow="Jira search · FCRM" title="Find work items in the project" text="Search Jira directly. Results come only from the fixed FCRM project." /><form onSubmit={onSearch} className="mt-9 max-w-xl rounded-2xl border border-[#d3dfdb] bg-white p-5 shadow-sm"><label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500" htmlFor="jql">Optional JQL filter</label><input id="jql" value={jql} onChange={(event) => setJql(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="statusCategory != Done" /><p className="mt-3 text-xs text-slate-500">Every request adds <code>project = FCRM</code>.</p><button type="submit" className="mt-5 rounded-lg bg-[#55df82] px-4 py-2.5 text-sm font-bold text-[#102f33]">Search Jira</button></form>{results && <section className="mt-6 overflow-hidden rounded-2xl border border-[#d3dfdb] bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold">Results</h2><p className="mt-1 text-xs text-slate-500">{results.error ?? `${results.items?.length ?? 0} item(s)`}</p></div>{results.items?.map((item) => <article key={item.id ?? item.key} className="border-b border-slate-100 px-5 py-4"><a href={item.url ?? `#${item.key}`} className="text-sm font-bold text-[#087f70]">{item.key}</a><h3 className="mt-1 font-bold">{item.summary}</h3><p className="mt-2 text-xs text-slate-500">{item.status} · {item.assignee ?? "Unassigned"}</p></article>)}</section>}</>; }
function Header({eyebrow, title, text}) { return <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f70]">{eyebrow}</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-[#102f33]">{title}</h1><p className="mt-4 text-base leading-7 text-slate-600">{text}</p></div>; }
function Automator({scenario, scenarios, selectedId, setSelectedId, tab, setTab, connection, run, onRequestExecute, onExecute, onCancel, onClose}) { const confirming = run?.confirm; return <><Header eyebrow="Scenario automator" title="Run a JSON scenario in Jira" text="Review each declared step before running it against the fixed FCRM project." /><div className="mt-9 rounded-2xl border border-[#d3dfdb] bg-white shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 p-5"><div><label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500" htmlFor="scenario">Scenario file</label><div className="relative mt-2"><select id="scenario" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full min-w-64 appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 pr-11 text-sm font-semibold outline-none focus:border-[#087f70] focus:ring-2 focus:ring-[#b9e4d1]"><option value="" disabled>Select a scenario</option>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.fileName}</option>)}</select><span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center border-l border-slate-200 text-slate-500" aria-hidden="true">⌄</span></div></div><button type="button" onClick={onRequestExecute} disabled={!scenario || !connection?.connected || run?.active} className="rounded-lg bg-[#102f33] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Execute scenario</button></div>{scenario && <><div className="flex border-b border-slate-200 px-5 pt-3"><button type="button" onClick={() => setTab("details")} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab === "details" ? "border-[#087f70] text-[#087f70]" : "border-transparent text-slate-400"}`}>Details</button><button type="button" onClick={() => setTab("json")} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab === "json" ? "border-[#087f70] text-[#087f70]" : "border-transparent text-slate-400"}`}>JSON</button></div>{tab === "details" ? <Details scenario={scenario} /> : <pre className="max-h-[520px] overflow-auto bg-[#102f33] p-6 text-xs leading-6 text-[#d9f4e2]">{JSON.stringify(Object.fromEntries(Object.entries(scenario).filter(([key]) => !["id", "fileName"].includes(key))), null, 2)}</pre>}</>}</div>{confirming && <Confirm scenario={scenario} onCancel={onCancel} onConfirm={() => {onCancel(); onExecute();}} />}{run && !confirming && <Progress run={run} onClose={onClose} />}</>; }
function Details({scenario}) { return <div className="p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087f70]">Scenario plan</p><h2 className="mt-2 text-2xl font-bold text-[#102f33]">{scenario.name}</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{scenario.description}</p><p className="mt-7 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Steps</p><ol className="mt-3 space-y-2">{(scenario.steps ?? []).map((step, index) => <li key={step.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#dcefe7] text-xs font-bold text-[#087f70]">{index + 1}</span><span className="font-semibold">{step.label}</span><code className="ml-auto text-xs text-slate-400">{step.action}</code></li>)}</ol></div>; }
function Confirm({scenario, onCancel, onConfirm}) { return <Dialog title="Confirm execution"><p className="text-sm leading-6 text-slate-600">Run <strong>{scenario.name}</strong> and execute {scenario.steps?.length ?? 0} step(s) in Jira project FCRM?</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold">Cancel</button><button type="button" onClick={onConfirm} className="rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white">Execute scenario</button></div></Dialog>; }
function Progress({run, onClose}) { const complete = !run.active; return <Dialog title={complete ? "Execution complete" : "Running steps"}><p className="text-sm text-slate-600">{complete ? "Each step has reported its result." : "Jira is processing the steps in order."}</p><ol className="mt-6 space-y-3" aria-label="Scenario execution progress">{run.steps.map((step, index) => <li key={step.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${step.state === "success" ? "bg-[#d9f5e1] text-[#197443]" : step.state === "failed" ? "bg-red-100 text-red-700" : step.state === "running" ? "bg-[#dcefe7] text-[#087f70]" : "bg-slate-100 text-slate-400"}`} aria-label={step.state}>{step.state === "success" ? "✓" : step.state === "failed" ? "×" : step.state === "running" ? "…" : index + 1}</span><span className="text-sm font-semibold">{step.label}</span>{step.error && <span className="ml-auto text-xs text-red-700">{step.error}</span>}</li>)}</ol><div className="mt-6 flex justify-end"><button type="button" onClick={onClose} disabled={!complete} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold disabled:opacity-40">Close</button></div></Dialog>; }
function Dialog({title, children}) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102f33]/70 p-5" role="presentation"><section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="sandbox-dialog-title"><h2 id="sandbox-dialog-title" className="text-2xl font-bold text-[#102f33]">{title}</h2><div className="mt-4">{children}</div></section></div>; }
