"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";

function clearDemoContext() {
  for (const key of ["fulcrum-ciel-chat", "fulcrum-ciel-response-id", "fulcrum-scenario-response-id"]) {
    try { window.localStorage.removeItem(key); } catch {}
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState("/demo");
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDemoUser, setSelectedDemoUser] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [guidedLogin, setGuidedLogin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guided = params.get("guided") === "1";
    setNext(guided ? "/demo?guided=landing-start-demo" : params.get("next") === "/sandbox" ? "/sandbox" : "/demo");
    setGuidedLogin(guided);
    fetch("/api/demo-users", {cache:"no-store"})
      .then((response) => response.ok ? response.json() : [])
      .then((demoUsers) => {
        setUsers(demoUsers);
        if (guided) {
          const maya = demoUsers.find((user) => user.id === "po-1") ?? demoUsers[0];
          setSelectedDemoUser(maya?.id ?? "");
          setUsername(maya?.email ?? "");
          setPassword(maya ? "genius123!" : "");
        }
      })
      .catch(() => setUsers([]));
  }, []);

  function selectDemo(event) {
    const selected = users.find((user) => user.id === event.target.value);
    setSelectedDemoUser(event.target.value);
    setUsername(selected?.email ?? "");
    setPassword(selected ? "genius123!" : "");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/session", {
        method:"POST",
        headers:{"content-type":"application/json"},
        cache:"no-store",
        body:JSON.stringify({username, password}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.user) throw new Error(body.error ?? "login_failed");
      clearDemoContext();
      router.replace(next);
    } catch (loginError) {
      setError(loginError.message === "invalid_credentials" ? "The username or password is not correct." : "Unable to sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f7] px-6 py-10 text-[rgb(25,66,71)] lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#d8e1e1] bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
          <section className="bg-[rgba(12,34,38,0.95)] p-8 text-white sm:p-12">
            <a href="/" className="text-lg font-bold tracking-[0.18em]">FULCRUM</a>
            <p className="mt-16 text-xs font-bold uppercase tracking-[0.2em] text-[rgb(82,224,129)]">Decision-ready work</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">Sign in to continue.</h1>
            <p className="mt-5 text-sm leading-7 text-white/70">Use your FULCRUM credentials. Jira is an optional connected work system and is not required to sign in.</p>
          </section>
          <section className="p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[rgb(9,167,141)]">FULCRUM access</p>
            <h2 className="mt-2 text-2xl font-bold">Username and password</h2>
            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block text-sm font-semibold" htmlFor="username">Username
                <input id="username" type="email" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-800 outline-none focus:border-[rgb(9,167,141)] focus:ring-2 focus:ring-[rgba(9,167,141,0.2)]" placeholder="name@fulcrum.demo" />
              </label>
              <label className="block text-sm font-semibold" htmlFor="password">Password
                <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-800 outline-none focus:border-[rgb(9,167,141)] focus:ring-2 focus:ring-[rgba(9,167,141,0.2)]" />
              </label>
              <button disabled={busy} className="min-h-11 w-full rounded-lg bg-[rgb(82,224,129)] px-4 text-sm font-bold text-[rgb(12,34,38)] transition hover:bg-[rgb(110,235,151)] disabled:opacity-50">{busy ? "Signing in…" : guidedLogin ? "Continue to login" : "Sign in"}</button>
              {error && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
            </form>
            <div className="mt-8 border-t border-slate-200 pt-6">
              {guidedLogin && <div className="mb-5 rounded-xl border border-[#b9e4d1] bg-[#eef8f2] p-4" role="status"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087f70]">Landing guided demo · 2 of 2</p><h3 className="mt-1 text-base font-bold text-[#102f33]">Choose a synthetic demo user</h3><p className="mt-2 text-sm leading-6 text-slate-600">Select a persona below to populate the username and password. Maya Chen is the Product Owner who can create initiatives; Daniel Reyes is the FCRM Analyst; Helen Morgan is the Risk Committee member. The credentials are synthetic and the normal sign-in flow still applies.</p><button type="button" onClick={() => setGuidedLogin(false)} className="mt-3 text-xs font-bold text-[#087f70]">Dismiss guide</button></div>}
              <p className="text-sm font-bold">Demo user helper</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Select a synthetic persona to fill the form. You still submit the credentials through the normal login flow.</p>
              <select aria-label="Select a demo user" onChange={selectDemo} value={selectedDemoUser} className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">
                <option value="">Choose a demo user</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.displayName} — {user.role}</option>)}
              </select>
            </div>
            <a href="/" className="mt-8 inline-flex text-sm font-bold text-[rgb(9,167,141)] hover:text-[rgb(25,66,71)]">← Back to landing page</a>
          </section>
        </div>
      </div>
    </main>
  );
}
