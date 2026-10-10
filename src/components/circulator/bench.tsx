import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GitFork,
  Pause,
  Play,
  RotateCcw,
  ScrollText,
  Search,
  ShieldAlert,
  SkipForward,
} from "lucide-react";
import { SCENARIO_LENGTH, useBench } from "@/lib/circulator/store";
import {
  holds,
  LARGE,
  naiveText,
  naiveWindow,
  RULES,
  scaleNote,
  searchRaw,
  selectWorking,
  taskBrief,
  workingText,
  type Page,
  type TeleEvent,
} from "@/lib/circulator/model";

type Tab = "raw" | "librarian" | "recall" | "log";

export function Bench() {
  const pages = useBench((s) => s.pages);
  const jobs = useBench((s) => s.jobs);
  const budget = useBench((s) => s.budget);
  const events = useBench((s) => s.events);
  const control = useBench((s) => s.control);
  const cursor = useBench((s) => s.cursor);
  const playing = useBench((s) => s.playing);
  const step = useBench((s) => s.step);
  const inject = useBench((s) => s.inject);
  const reread = useBench((s) => s.reread);
  const ask = useBench((s) => s.ask);
  const setPhysical = useBench((s) => s.setPhysical);
  const setTrigger = useBench((s) => s.setTrigger);
  const togglePlay = useBench((s) => s.togglePlay);
  const reset = useBench((s) => s.reset);

  const [tab, setTab] = useState<Tab>("raw");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      useBench.getState().step();
    }, 900);
    return () => window.clearInterval(id);
  }, [playing]);

  const selection = useMemo(
    () => selectWorking({ pages, jobs, budget, control }),
    [pages, jobs, budget, control],
  );
  const naive = useMemo(() => naiveWindow(pages, budget), [pages, budget]);
  const brief = useMemo(() => taskBrief(pages), [pages]);
  const circulated = workingText(selection);
  const forgotten = naiveText(naive);
  const hits = useMemo(() => searchRaw(pages, query), [pages, query]);
  const done = cursor >= SCENARIO_LENGTH;
  const admitted = jobs.filter((job) => job.status === "ADMITTED").length;
  const ready = jobs.filter((job) => job.status === "READY").length;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Mark />
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">Workshop bench</p>
            <h1 className="text-xl font-extrabold leading-none">Circulator</h1>
          </div>
          <p className="ml-auto hidden text-sm text-muted sm:block">Full history. Smaller prompt.</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-4">
          <div className="space-y-3">
            <p className="text-pretty text-base text-fg">
              Long jobs fall over when the window fills with old reads. This bench keeps every page,
              compresses the dead weight, and shows what a naive tail forgets.
            </p>
            <p className="text-pretty text-sm text-muted">
              Nothing here calls a model. The librarian is a deterministic baseline: literal facts,
              decisions, and source ids. A summary can be admitted and still be wrong.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-lime" onClick={togglePlay} disabled={done && !playing}>
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "Pause" : done ? "Finished" : "Run the job"}
            </button>
            <button type="button" className="btn-ghost" onClick={step} disabled={playing || done}>
              <SkipForward className="size-4" />
              Step
            </button>
            <button type="button" className="btn-ghost" onClick={reread}>
              Reread relay.py
            </button>
            <button type="button" className="btn-ghost" onClick={ask}>
              Ask the rule
            </button>
            <button type="button" className="btn-ghost col-span-2" onClick={reset}>
              <RotateCcw className="size-4" />
              Reset session
            </button>
          </div>

          <p className="font-mono text-xs text-muted tabular-nums">
            Beat {Math.min(cursor, SCENARIO_LENGTH)} / {SCENARIO_LENGTH}
            {done ? " · scenario complete, RAW still open" : ""}
          </p>
          {events.some((item) => item.kind === "loop") ? (
            <p className="text-sm text-clay">
              Loop guard fired on relay.py. It nudged the prompt, then dropped off. It was never written into RAW. The log keeps the event.
            </p>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-2">
              <Score
                label="Circulated"
                value={selection.tokens}
                ok={selection.ok}
                note={selection.ok ? `${selection.headroom}t headroom` : "relay refused"}
              />
              <Score
                label="Naive tail"
                value={naive.tokens}
                ok={naive.ok}
                note={
                  naive.forgotten.length
                    ? `${naive.forgotten.length} pages forgotten`
                    : "nothing dropped yet"
                }
              />
            </div>
            <ul className="divide-y divide-line border-t border-line">
              <li className="grid grid-cols-3 gap-2 bg-surface-2 px-3 py-2 font-mono text-xs uppercase tracking-wide text-muted">
                <span>Rule</span>
                <span>Here</span>
                <span>Naive</span>
              </li>
              {RULES.map((rule) => {
                const here = holds(circulated, rule);
                const there = holds(forgotten, rule);
                return (
                  <li key={rule.id} className="grid grid-cols-3 gap-2 bg-surface px-3 py-2 text-xs">
                    <span className="text-fg">{rule.label}</span>
                    <RuleBit ok={here} yes="kept" no="missing" />
                    <RuleBit ok={there} yes="kept" no="forgotten" />
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
            <Meter
              label="Prompt on the wire"
              value={Math.max(0, selection.tokens)}
              max={Math.max(selection.allowance, 1)}
              caption={`${selection.tokens}t / ${selection.allowance}t allowance`}
              hot={!selection.ok}
            />
            <Meter
              label="Live content"
              value={selection.content}
              max={Math.max(budget.trigger * 1.35, selection.content, 1)}
              mark={budget.trigger / Math.max(budget.trigger * 1.35, selection.content, 1)}
              caption={`${selection.content}t · trigger ${budget.trigger}t · target ${budget.target}t`}
              hot={selection.content > budget.trigger}
            />
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted tabular-nums">
              <dt>Schema overhead</dt>
              <dd className="text-right text-fg">{budget.schema}</dd>
              <dt>Generation reserve</dt>
              <dd className="text-right text-fg">{budget.reserve}</dd>
              <dt>Safety margin</dt>
              <dd className="text-right text-fg">{budget.safety}</dd>
              <dt>Physical window</dt>
              <dd className="text-right text-fg">{budget.physical}</dd>
            </dl>
            {!selection.ok && selection.reason ? (
              <p className="flex gap-2 text-sm text-clay">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span>{selection.reason}</span>
              </p>
            ) : null}
          </div>

          <fieldset className="space-y-3 rounded-lg border border-line p-4">
            <legend className="px-1 text-sm font-semibold">Break the window</legend>
            <Slider
              label="Physical window"
              min={700}
              max={4200}
              step={20}
              value={budget.physical}
              onChange={setPhysical}
            />
            <Slider
              label="Content trigger"
              min={400}
              max={2200}
              step={20}
              value={budget.trigger}
              onChange={setTrigger}
            />
            <p className="text-xs text-muted">{scaleNote(budget.physical)}</p>
            <p className="font-mono text-xs text-muted">
              LARGE reference {LARGE.physical.toLocaleString()} physical · {LARGE.reserve.toLocaleString()}{" "}
              reserve · {LARGE.safety.toLocaleString()} safety · {LARGE.allowance.toLocaleString()} allowance
              · trigger {LARGE.trigger.toLocaleString()}
            </p>
          </fieldset>
        </section>

        <section className="space-y-4 lg:col-span-5">
          <div className="rounded-lg bg-paper p-4 text-ink">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">What this request sends</h2>
              <span className="font-mono text-xs text-ink-soft tabular-nums">
                {selection.ok ? "admitted" : "refused"}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {brief.objective}
            </p>
            {brief.decisions.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {brief.decisions.map((decision) => (
                  <li key={decision.sourceId + decision.text} className="text-sm">
                    <span
                      className={
                        decision.status === "unsettled"
                          ? "font-mono text-xs uppercase tracking-wide text-clay"
                          : "font-mono text-xs uppercase tracking-wide text-ink-soft"
                      }
                    >
                      {decision.status} ·{" "}
                    </span>
                    {decision.text}
                    {decision.conflict ? (
                      <span className="mt-1 block text-xs text-ink-soft">
                        Conflicts with {decision.conflict.title}: {decision.conflict.excerpt}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">No decision in RAW yet.</p>
            )}
            {brief.decisions.some((decision) => decision.status === "unsettled") ? (
              <p className="mt-3 text-xs text-ink-soft">
                Unsettled means a later page conflicts. The old line can still be in the prompt. Fact check does not rewrite RAW.
              </p>
            ) : null}
          </div>

          <ol className="space-y-2">
            {selection.items.map((item) => (
              <li
                key={item.key}
                className={
                  item.kind === "control"
                    ? "rounded-lg border border-clay bg-surface p-3"
                    : item.kind === "summary"
                      ? "rounded-lg border border-lime/50 bg-surface p-3"
                      : "rounded-lg border border-line bg-surface p-3"
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold">{item.label}</h3>
                  <span className="font-mono text-xs text-muted tabular-nums">
                    {item.why} · {item.tokens}t
                    {item.pageId ? ` · ${item.pageId}` : ""}
                    {item.residency ? ` · ${item.residency}` : ""}
                  </span>
                </div>
                <Excerpt text={item.text} id={item.key} />
                {/all tests passed|implementation is verified/i.test(item.text) ? (
                  <p className="mt-2 text-xs text-clay">
                    Claim, not evidence. Continuity does not make this true.
                  </p>
                ) : null}
                {brief.decisions.some(
                  (decision) => decision.status === "unsettled" && item.text.includes(decision.text),
                ) ? (
                  <p className="mt-2 text-xs text-clay">Unsettled. A later page conflicts with this line.</p>
                ) : null}
              </li>
            ))}
          </ol>

          {naive.forgotten.length > 0 ? (
            <div className="rounded-lg border border-line p-4">
              <h2 className="text-sm font-semibold">Naive tail already dropped</h2>
              <ul className="mt-2 space-y-1">
                {naive.forgotten.slice(0, 6).map((page) => (
                  <li key={page.id} className="font-mono text-xs text-muted">
                    {page.id} · {page.title} · {page.tokens}t
                  </li>
                ))}
              </ul>
              {naive.forgotten.length > 6 ? (
                <p className="mt-2 font-mono text-xs text-muted">
                  +{naive.forgotten.length - 6} more
                </p>
              ) : null}
            </div>
          ) : null}

          <form
            className="space-y-2 rounded-lg border border-line p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const body = draft.trim();
              if (!body) return;
              inject({
                role: "user",
                title: "Pasted turn",
                body,
              });
              setDraft("");
            }}
          >
            <label htmlFor="draft" className="text-sm font-semibold">
              Throw more weight in
            </label>
            <textarea
              id="draft"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="A note, a log, a repeated file. It lands in RAW and counts toward the window."
              className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-lime"
            />
            <button type="submit" className="btn-lime" disabled={!draft.trim()}>
              Append to RAW
            </button>
          </form>
        </section>

        <section className="lg:col-span-3">
          <div className="mb-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Archive">
            <TabButton id="raw" tab={tab} setTab={setTab} label="RAW" />
            <TabButton id="librarian" tab={tab} setTab={setTab} label={`Lib ${admitted}/${jobs.length}`} />
            <TabButton id="recall" tab={tab} setTab={setTab} label="Recall" />
            <TabButton id="log" tab={tab} setTab={setTab} label="Log" />
          </div>

          {tab === "raw" ? <RawList pages={pages} /> : null}
          {tab === "librarian" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                {ready
                  ? `${ready} summary READY. It joins the next request, not this one.`
                  : admitted
                    ? `${admitted} admitted once. RAW was not rewritten.`
                    : "Cold pages queue here. Run the job until content crosses the trigger."}
              </p>
              {jobs.length === 0 ? (
                <Empty icon={<ScrollText className="size-4" />} text="No compaction yet." />
              ) : (
                jobs
                  .slice()
                  .reverse()
                  .map((job) => (
                    <article key={job.id} className="rounded-lg border border-line bg-surface p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-mono text-xs">{job.id}</h3>
                        <span className={job.status === "ADMITTED" ? "text-xs text-lime" : "text-xs text-clay"}>
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted">{job.summaryText}</p>
                      <p className="mt-2 font-mono text-xs text-muted tabular-nums">{job.summaryTokens}t</p>
                    </article>
                  ))
              )}
            </div>
          ) : null}
          {tab === "recall" ? (
            <div className="space-y-2">
              <label className="block text-sm font-semibold" htmlFor="recall">
                Search RAW, including archived pages
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
                <input
                  id="recall"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="schema, n_ctx, relay.py"
                  className="min-h-11 w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm outline-none focus:border-lime"
                />
              </div>
              {query.trim() && hits.length === 0 ? <Empty text="No source contains that." /> : null}
              {hits.map((page) => (
                <article key={page.id} className="rounded-lg border border-line bg-surface p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold">{page.title}</h3>
                    <span className="font-mono text-xs text-muted">{page.residency}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {page.id}
                    {page.toolPath ? ` · ${page.toolPath}` : ""}
                  </p>
                  <Excerpt text={page.body} id={"hit-" + page.id} />
                </article>
              ))}
            </div>
          ) : null}
          {tab === "log" ? (
            <ol className="space-y-2">
              {events
                .slice()
                .reverse()
                .map((item) => (
                  <li key={item.id}>
                    <LogRow item={item} />
                  </li>
                ))}
            </ol>
          ) : null}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl space-y-2 px-4 pt-2 pb-10 text-sm text-muted">
        <p className="flex items-start gap-2">
          <GitFork className="mt-0.5 size-4 shrink-0" />
          <span>
            A browser fork of the pipeline in{" "}
            <a
              className="text-lime underline underline-offset-2"
              href="https://github.com/UnVibedNoCoder/rolling-context-circulator"
              target="_blank"
              rel="noreferrer"
            >
              UnVibedNoCoder/rolling-context-circulator
            </a>
            , MIT. The Linux beta talks to Hermes and llama.cpp. This one is the mechanism you can push
            on: RAW, librarian, one-time admission, loop guard, and a relay that can say no.
          </span>
        </p>
      </footer>
    </div>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0 text-lime" aria-hidden="true">
      <circle
        className="orbit"
        cx="16"
        cy="16"
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="46 22"
      />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    </svg>
  );
}

function Score({
  label,
  value,
  ok,
  note,
}: {
  label: string;
  value: number;
  ok: boolean;
  note: string;
}) {
  return (
    <div className="bg-surface px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-mono text-3xl font-medium tabular-nums">{value}</p>
      <p className={ok ? "text-xs text-lime" : "text-xs text-clay"}>{note}</p>
    </div>
  );
}

function RuleBit({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return <span className={ok ? "text-lime" : "text-clay"}>{ok ? yes : no}</span>;
}

function Meter({
  label,
  value,
  max,
  caption,
  mark,
  hot,
}: {
  label: string;
  value: number;
  max: number;
  caption: string;
  mark?: number;
  hot?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span>{label}</span>
        <span className="font-mono text-muted tabular-nums">{caption}</span>
      </div>
      <div className="relative mt-1 h-2 rounded-full bg-surface-2">
        <div
          className={hot ? "h-full rounded-full bg-clay transition-all" : "h-full rounded-full bg-lime transition-all"}
          style={{ width: `${pct}%` }}
        />
        {mark != null ? (
          <div
            className="absolute top-0 h-2 w-px bg-fg"
            style={{ left: `${Math.max(0, Math.min(100, mark * 100))}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id}>{label}</label>
        <span className="font-mono text-xs tabular-nums">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-11 w-full accent-lime"
      />
    </div>
  );
}

function TabButton({
  id,
  tab,
  setTab,
  label,
}: {
  id: Tab;
  tab: Tab;
  setTab: (tab: Tab) => void;
  label: string;
}) {
  const on = tab === id;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      className={
        on
          ? "min-h-11 shrink-0 rounded-lg bg-lime px-3 text-sm font-semibold text-lime-ink"
          : "min-h-11 shrink-0 rounded-lg px-3 text-sm text-muted"
      }
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );
}

function RawList({ pages }: { pages: Page[] }) {
  const ordered = pages.slice().reverse();
  return (
    <ol className="space-y-2">
      {ordered.map((page) => (
        <li key={page.id} className="rounded-lg border border-line bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">{page.title}</h3>
            <span className="font-mono text-xs text-muted">{badge(page)}</span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted tabular-nums">
            {page.role} · {page.tokens}t · {page.id}
          </p>
          <Excerpt text={page.body} id={"raw-" + page.id} />
        </li>
      ))}
    </ol>
  );
}

function badge(page: Page): string {
  if (page.residency === "ARCHIVED") return "ARCHIVED";
  if (page.residency === "COMPACTING") return "COMPACTING";
  if (page.protected) return "PROTECTED";
  return "LIVE";
}

function Excerpt({ text, id }: { text: string; id: string }) {
  const [open, setOpen] = useState(false);
  const lines = text.split("\n");
  const long = lines.length > 6;
  const shown = long && !open ? lines.slice(0, 5).join("\n") : text;
  return (
    <div className="mt-2">
      <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-current">{shown}</pre>
      {long ? (
        <button
          type="button"
          className="mt-1 min-h-11 text-xs font-semibold underline underline-offset-2"
          onClick={() => setOpen((value) => !value)}
          aria-controls={id}
        >
          {open ? "Show less" : `Show ${lines.length - 5} more lines`}
        </button>
      ) : null}
    </div>
  );
}

function LogRow({ item }: { item: TeleEvent }) {
  const tone =
    item.kind === "reject" || item.kind === "loop" || item.kind === "fact"
      ? "text-clay"
      : item.kind === "admit" || item.kind === "compact"
        ? "text-lime"
        : "text-muted";
  return (
    <p className="text-xs">
      <span className={`font-mono uppercase ${tone}`}>{item.kind}</span>
      <span className="text-fg"> {item.text}</span>
    </p>
  );
}

function Empty({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted">
      {icon}
      {text}
    </p>
  );
}
