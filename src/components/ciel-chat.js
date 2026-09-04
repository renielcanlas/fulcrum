"use client";

export default function CielChat({question, setQuestion, messages, busy, onAsk, onClose, contextLabel = "Synthetic assessment context"}) {
  return <div className="fixed inset-x-4 bottom-24 z-50 flex max-h-[min(620px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[390px]">
    <div className="flex items-center justify-between bg-[rgba(12,34,38,0.95)] px-5 py-4 text-white">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(82,224,129)]">Ciel · FULCRUM AI Assistant</p><h2 className="mt-1 font-bold">Sandbox-aware chat</h2><p className="mt-1 text-[11px] text-white/55">{contextLabel}</p></div>
      <button onClick={onClose} aria-label="Close Ciel chat" className="text-xl text-white/60 hover:text-white">×</button>
    </div>
    <div className="min-h-40 flex-1 space-y-2 overflow-y-auto bg-slate-950 p-4 text-sm leading-6 text-slate-100" aria-live="polite">
      {messages.map((message, index) => <p key={index} className={index === 0 ? "text-slate-400" : "border-b border-slate-800 pb-2 last:border-0"}>{renderCielMessage(message)}</p>)}
      {busy && <div className="flex justify-start"><div className="w-fit rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-slate-300"><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[rgb(82,224,129)]">Ciel</p><span className="flex items-center gap-1" aria-label="Ciel is typing"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)] [animation-delay:-0.3s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)] [animation-delay:-0.15s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(82,224,129)]" /></span></div></div>}
    </div>
    <form onSubmit={onAsk} className="flex gap-2 border-t border-slate-200 bg-white p-3">
      <label className="sr-only" htmlFor="sandbox-ciel-question">Ask Ciel</label>
      <input id="sandbox-ciel-question" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm shadow-sm placeholder:text-slate-400" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about the demo context…" />
      <button className="min-h-11 rounded-lg bg-[rgb(82,224,129)] px-3 text-xs font-bold text-[rgb(12,34,38)] disabled:cursor-not-allowed disabled:bg-slate-300" disabled={busy || !question.trim()}>{busy ? "…" : "Ask"}</button>
    </form>
  </div>;
}

export function renderCielMessage(message) {
  return String(message).split(/(\[[^\]]+\]\([^\)]+\)|https?:\/\/\S+)/g).map((part, index) => {
    const markdown = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+|\/[^\)]*)\)$/);
    const href = markdown?.[2] ?? (part.startsWith("http://") || part.startsWith("https://") ? part : null);
    if (!href) return <span key={index}>{part}</span>;
    return <a key={index} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="font-semibold text-[rgb(82,224,129)] underline">{markdown?.[1] ?? part}</a>;
  });
}
