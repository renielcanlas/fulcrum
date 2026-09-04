"use client";

import {useEffect, useRef} from "react";

export default function CielChat({question, setQuestion, messages, busy, onAsk, onClose, onClear, contextLabel = "No linked Jira item", jiraUpdateRequest, onConfirmJiraUpdate, onCancelJiraUpdate}) {
  const chatScrollRef = useRef(null);
  const chatTargetRef = useRef(null);

  useEffect(() => {
    chatTargetRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
  }, [messages, busy]);

  return <>
  <div className="fixed inset-x-4 bottom-24 z-50 flex max-h-[min(620px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[390px]">
    <div className="flex items-center justify-between bg-[rgba(12,34,38,0.95)] px-5 py-4 text-white">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(82,224,129)]">Ciel · FULCRUM AI Assistant</p><h2 className="mt-1 font-bold">Sandbox-aware chat</h2><p className="mt-1 text-[11px] text-white/55">{contextLabel}</p></div>
      <div className="flex items-center gap-1"><button type="button" onClick={onClear} aria-label="Clear Ciel chat" title="Clear chat" className="grid h-10 w-10 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[rgb(82,224,129)]"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-8 0 1 13h6l1-13M10 11v5m4-5v5" /></svg></button><button type="button" onClick={onClose} aria-label="Close Ciel chat" title="Close chat" className="grid h-10 w-10 place-items-center rounded-lg text-2xl leading-none text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[rgb(82,224,129)]">×</button></div>
    </div>
    <div ref={chatScrollRef} className="min-h-40 flex-1 space-y-3 overflow-y-auto bg-slate-100 p-4 text-sm leading-6 text-slate-800" aria-live="polite">
      {messages.map((message, index) => <div key={index} ref={index === messages.length - 1 && !busy ? chatTargetRef : undefined} className={`flex min-w-0 ${message.startsWith("You:") ? "justify-end" : "justify-start"}`}><p className={`min-w-0 max-w-[88%] break-words whitespace-pre-wrap rounded-2xl px-3 py-2.5 shadow-sm ${index === 0 ? "bg-white text-slate-600" : message.startsWith("You:") ? "rounded-br-sm bg-[#d9f5e1] text-[#173b32]" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"}`}>{renderCielMessage(message)}</p></div>)}
      {busy && <div ref={chatTargetRef} className="flex justify-start"><div className="w-fit rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-slate-300"><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[rgb(82,224,129)]">Ciel</p><span className="flex items-center gap-1" aria-label="Ciel is typing"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)] [animation-delay:-0.3s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)] [animation-delay:-0.15s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)]" /></span></div></div>}
    </div>
    <form onSubmit={onAsk} className="flex gap-2 border-t border-slate-200 bg-white p-3">
      <label className="sr-only" htmlFor="sandbox-ciel-question">Ask Ciel</label>
      <input id="sandbox-ciel-question" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm shadow-sm placeholder:text-slate-400" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about the demo context…" />
      <button className="min-h-11 rounded-lg bg-[rgb(82,224,129)] px-3 text-xs font-bold text-[rgb(12,34,38)] disabled:cursor-not-allowed disabled:bg-slate-300" disabled={busy || !question.trim()}>{busy ? "…" : "Ask"}</button>
    </form>
  </div>
  {jiraUpdateRequest && <JiraUpdateDialog issueKey={jiraUpdateRequest.issueKey} onConfirm={onConfirmJiraUpdate} onCancel={onCancelJiraUpdate} />}
  </>;
}

export function JiraUpdateDialog({issueKey, onConfirm, onCancel}) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-[#102f33]/45 p-5" role="presentation">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="ciel-jira-update-title">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d9f5e1] text-lg text-[#197443]">↗</div>
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087f70]">Jira update</p><h2 id="ciel-jira-update-title" className="mt-1 text-xl font-bold text-[#102f33]">Improve {issueKey}</h2></div>
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-600">Ciel will read the current story, improve its description using the existing facts, and send the updated description to Jira through the FULCRUM service account.</p>
      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Only the description field will be changed. No status, assignee, permissions, or decision data will be modified.</p>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="button" onClick={onConfirm} className="rounded-lg bg-[#102f33] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#194247]">Confirm update</button></div>
    </section>
  </div>;
}

export function renderCielMessage(message) {
  return String(message).split(/(\[[^\]]+\]\([^\)]+\)|https?:\/\/\S+)/g).map((part, index) => {
    const markdown = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+|\/[^\)]*)\)$/);
    const href = markdown?.[2] ?? (part.startsWith("http://") || part.startsWith("https://") ? part : null);
    if (!href) return <span key={index}>{part}</span>;
    return <a key={index} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="break-all font-semibold text-[#087f70] underline [overflow-wrap:anywhere]">{markdown?.[1] ?? part}</a>;
  });
}
