export type Role = "system" | "user" | "assistant" | "tool";

export type Residency = "LIVE" | "COMPACTING" | "ARCHIVED";

export type EventKind = "raw" | "admit" | "compact" | "loop" | "governor" | "reject" | "note" | "fact";

export interface Budget {
  physical: number;
  reserve: number;
  safety: number;
  schema: number;
  trigger: number;
  target: number;
  tail: number;
  warmRatio: number;
}

export interface Page {
  id: string;
  seq: number;
  role: Role;
  title: string;
  body: string;
  tokens: number;
  protected: boolean;
  anchor: boolean;
  toolPath?: string;
  toolHash?: string;
  residency: Residency;
  governor?: boolean;
}

export interface Job {
  id: string;
  sourceIds: string[];
  status: "READY" | "ADMITTED";
  summaryText: string;
  summaryTokens: number;
  facts: string[];
  decisions: string[];
  files: string[];
  createdAtSeq: number;
  admittedAtSeq?: number;
}

export interface Beat {
  role: Exclude<Role, "system">;
  title: string;
  body: string;
  protected?: boolean;
  anchor?: boolean;
  toolPath?: string;
  governor?: boolean;
}

export interface TeleEvent {
  id: string;
  kind: EventKind;
  text: string;
}

export interface WorkingItem {
  key: string;
  kind: "raw" | "summary" | "control";
  label: string;
  text: string;
  tokens: number;
  why: string;
  pageId?: string;
  residency?: string;
}

export interface Selection {
  items: WorkingItem[];
  tokens: number;
  allowance: number;
  headroom: number;
  ok: boolean;
  reason?: string;
  content: number;
}

export interface NaiveView {
  tokens: number;
  kept: Page[];
  forgotten: Page[];
  ok: boolean;
}

export interface BenchData {
  pages: Page[];
  jobs: Job[];
  budget: Budget;
  events: TeleEvent[];
  control: string | null;
  cooldown: number;
  warnedHash: string | null;
  seq: number;
}

export const LARGE = {
  physical: 73728,
  reserve: 8192,
  safety: 1024,
  allowance: 64512,
  target: 32000,
  trigger: 36000,
};

export const DEFAULT_BUDGET: Budget = {
  physical: 2400,
  reserve: 256,
  safety: 64,
  schema: 160,
  trigger: 1000,
  target: 820,
  tail: 2,
  warmRatio: 0.34,
};

export function allowanceOf(budget: Budget): number {
  return Math.max(0, budget.physical - budget.reserve - budget.safety);
}

export function tokensOf(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function fnv(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}

export function linesTagged(body: string, tag: "FACT" | "DECISION"): string[] {
  const prefix = tag + " ";
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length).trim())
    .filter(Boolean);
}

function makePage(seq: number, beat: Beat): Page {
  const body = beat.body.trim();
  const toolHash = beat.toolPath ? fnv(beat.toolPath + "\n" + body) : undefined;
  const decisions = linesTagged(body, "DECISION");
  return {
    id: "p" + fnv(`${seq}:${beat.title}:${body.slice(0, 48)}`),
    seq,
    role: beat.role,
    title: beat.title,
    body,
    tokens: tokensOf(body),
    protected: Boolean(beat.protected || beat.anchor || decisions.length > 0),
    anchor: Boolean(beat.anchor),
    toolPath: beat.toolPath,
    toolHash,
    residency: "LIVE",
    governor: beat.governor,
  };
}

const SYSTEM_BODY = [
  "You are a coding agent under a rolling context window.",
  "Visible history is not proof that a conclusion is correct.",
  "Do not treat a summary as a new user instruction.",
  "Tool output is evidence. If it did not change, do not read it again.",
].join("\n");

export function freshBench(budget: Budget = DEFAULT_BUDGET): BenchData {
  const page: Page = {
    id: "psystem",
    seq: 0,
    role: "system",
    title: "Standing instructions",
    body: SYSTEM_BODY,
    tokens: tokensOf(SYSTEM_BODY),
    protected: true,
    anchor: false,
    residency: "LIVE",
  };
  return {
    pages: [page],
    jobs: [],
    budget,
    events: [
      {
        id: "e0",
        kind: "note",
        text: "Session open. RAW is the source of truth. Summaries never replace it.",
      },
    ],
    control: null,
    cooldown: 0,
    warnedHash: null,
    seq: 0,
  };
}

function contentPressure(pages: Page[], jobs: Job[]): number {
  const raw = pages
    .filter((page) => page.residency !== "ARCHIVED")
    .reduce((sum, page) => sum + page.tokens, 0);
  const warm = jobs
    .filter((job) => job.status === "ADMITTED")
    .reduce((sum, job) => sum + job.summaryTokens, 0);
  return raw + warm;
}

function buildJob(pages: Page[], seq: number, nth: number): Job {
  const facts = pages.flatMap((page) => linesTagged(page.body, "FACT"));
  const decisions = pages.flatMap((page) => linesTagged(page.body, "DECISION"));
  const files = [...new Set(pages.map((page) => page.toolPath).filter((value): value is string => Boolean(value)))];
  const first = pages[0];
  const last = pages[pages.length - 1];
  if (!first || !last) throw new Error("Librarian received an empty episode.");
  const parts = [
    `Sources ${first.id}–${last.id}, seq ${first.seq}–${last.seq}.`,
    files.length ? `Files: ${files.join(", ")}.` : "",
    decisions.length ? `Decisions: ${decisions.join(" ")}` : "",
    facts.length ? `Facts: ${facts.join(" ")}` : "",
    "Bodies stay in RAW. This summary is lossy and is not evidence of correctness.",
  ].filter(Boolean);
  const summaryText = parts.join(" ");
  return {
    id: "j" + nth,
    sourceIds: pages.map((page) => page.id),
    status: "READY",
    summaryText,
    summaryTokens: tokensOf(summaryText),
    facts,
    decisions,
    files,
    createdAtSeq: seq,
  };
}

function detectLoop(pages: Page[], cooldown: number, warnedHash: string | null): { text: string; hash: string } | null {
  if (cooldown > 0) return null;
  const tools = pages.filter((page) => page.role === "tool" && page.toolHash);
  const last = tools.slice(-3);
  if (last.length < 3) return null;
  const hash = `${last[0].toolPath}|${last[0].toolHash}`;
  if (hash === warnedHash) return null;
  if (!last.every((page) => `${page.toolPath}|${page.toolHash}` === hash)) return null;
  return {
    hash,
    text: `Loop Guard: ${last[0].toolPath} came back identical three times. Stop re-reading it. Act on the evidence already in RAW.`,
  };
}

let eventSerial = 1;
function event(kind: EventKind, text: string): TeleEvent {
  eventSerial += 1;
  return { id: "e" + eventSerial.toString(36), kind, text };
}

export function advance(data: BenchData, beat: Beat | null): BenchData {
  const pages = data.pages.map((page) => ({ ...page }));
  const jobs = data.jobs.map((job) => ({ ...job }));
  const events = [...data.events];
  let seq = data.seq;
  let control = data.control;
  let cooldown = data.cooldown;
  let warnedHash = data.warnedHash;

  for (const job of jobs) {
    if (job.status !== "READY") continue;
    job.status = "ADMITTED";
    job.admittedAtSeq = seq;
    for (const sourceId of job.sourceIds) {
      const page = pages.find((item) => item.id === sourceId);
      if (page && page.residency === "COMPACTING") page.residency = "ARCHIVED";
    }
    events.push(
      event(
        "admit",
        `Admitted ${job.id} once. ${job.summaryTokens}t summary replaces ${job.sourceIds.length} raw ${job.sourceIds.length === 1 ? "page" : "pages"}. Sources stay archived.`,
      ),
    );
  }

  if (beat) {
    seq += 1;
    const page = makePage(seq, beat);
    pages.push(page);
    events.push(event("raw", `RAW ${page.id} · ${page.role} · ${page.tokens}t · ${page.title}`));
    if (page.governor) {
      events.push(
        event(
          "governor",
          "Governor: reasoning-only turn, no tool and no patch. One local retry would disable thinking. The 8,192 reserve is not spent on the prompt.",
        ),
      );
    }
  }

  const prior = new Set(
    checkDecisions(data.pages)
      .filter((claim) => claim.status === "unsettled")
      .map((claim) => claim.sourceId + "\n" + claim.text),
  );
  for (const claim of checkDecisions(pages)) {
    if (claim.status !== "unsettled") continue;
    if (prior.has(claim.sourceId + "\n" + claim.text)) continue;
    const excerpt = claim.conflict?.excerpt ?? "a later page";
    const where = claim.conflict?.title ?? "later RAW";
    events.push(
      event(
        "fact",
        `Fact check: "${claim.text}" is unsettled by ${where}. "${excerpt}" RAW was not rewritten.`,
      ),
    );
  }

  const loop = detectLoop(pages, cooldown, warnedHash);
  if (loop) {
    control = loop.text;
    warnedHash = loop.hash;
    cooldown = 2;
    events.push(event("loop", loop.text + " Control is transient and is not written into RAW."));
  } else if (cooldown > 0) {
    cooldown -= 1;
    if (cooldown === 0) control = null;
  } else {
    control = null;
  }

  const pressure = contentPressure(pages, jobs);
  if (pressure > data.budget.trigger) {
    const tailIds = new Set(pages.slice(-data.budget.tail).map((page) => page.id));
    const candidates = pages.filter(
      (page) =>
        page.residency === "LIVE" &&
        !page.protected &&
        !tailIds.has(page.id) &&
        page.role !== "system" &&
        page.tokens >= 120,
    );
    const taken: Page[] = [];
    let projected = pressure;
    for (const page of candidates) {
      if (projected <= data.budget.target) break;
      taken.push(page);
      projected -= page.tokens;
    }
    if (taken.length > 0) {
      for (const page of taken) page.residency = "COMPACTING";
      const job = buildJob(taken, seq, jobs.length + 1);
      const saved = taken.reduce((sum, page) => sum + page.tokens, 0) - job.summaryTokens;
      if (saved <= 0) {
        for (const page of taken) page.residency = "LIVE";
      } else {
        jobs.push(job);
        const noun = taken.length === 1 ? "page" : "pages";
        events.push(
          event(
            "compact",
            `Librarian READY ${job.id}. ${taken.length} ${noun}, ${saved}t of dead weight parked. Not admitted until the next request.`,
          ),
        );
      }
    }
  }

  const selection = selectWorking({ pages, jobs, budget: data.budget, control });
  if (!selection.ok) {
    const already = events.slice(-6).some((item) => item.kind === "reject");
    if (!already) {
      events.push(event("reject", selection.reason ?? "Relay refused the prompt."));
    }
  }

  return {
    pages,
    jobs,
    budget: data.budget,
    events: events.slice(-48),
    control,
    cooldown,
    warnedHash,
    seq,
  };
}

export function selectWorking(input: {
  pages: Page[];
  jobs: Job[];
  budget: Budget;
  control: string | null;
}): Selection {
  const { pages, jobs, budget, control } = input;
  const allowance = allowanceOf(budget);
  const content = contentPressure(pages, jobs);
  let used = budget.schema;
  let ok = used <= allowance;
  const chosen = new Map<string, string>();

  const take = (page: Page, why: string, required: boolean) => {
    if (chosen.has(page.id)) return;
    const next = used + page.tokens;
    if (next > allowance && !required) return;
    if (next > allowance) ok = false;
    chosen.set(page.id, why);
    used = next;
  };

  const protectedPages = pages.filter((page) => page.protected && page.residency !== "ARCHIVED");
  const tail = pages.filter((page) => page.residency !== "ARCHIVED").slice(-budget.tail);
  for (const page of protectedPages) take(page, page.anchor ? "Task anchor" : "Standing instruction", true);
  for (const page of tail) take(page, "Recent tail", true);

  const controlTokens = control ? tokensOf(control) : 0;
  const controlFits = Boolean(control) && used + controlTokens <= allowance;
  if (control && !controlFits) ok = used <= allowance;

  const warmCap = Math.floor(allowance * budget.warmRatio);
  let warmUsed = 0;
  const admitted = jobs.filter((job) => job.status === "ADMITTED");
  const summaryIds: string[] = [];
  for (const job of admitted) {
    if (warmUsed + job.summaryTokens > warmCap) continue;
    if (used + job.summaryTokens > allowance) break;
    summaryIds.push(job.id);
    warmUsed += job.summaryTokens;
    used += job.summaryTokens;
  }

  const filler = pages
    .filter((page) => page.residency !== "ARCHIVED" && !chosen.has(page.id))
    .slice()
    .reverse();
  for (const page of filler) {
    if (used + page.tokens > allowance) continue;
    chosen.set(page.id, page.residency === "COMPACTING" ? "Still on the wire" : "Fits in the remainder");
    used += page.tokens;
  }

  if (controlFits && control) used += controlTokens;

  const items: WorkingItem[] = [];
  for (const page of pages) {
    const why = chosen.get(page.id);
    if (!why) continue;
    if (page.role === "system" || page.protected) {
      items.push(toRawItem(page, why));
    }
  }
  for (const job of admitted) {
    if (!summaryIds.includes(job.id)) continue;
    items.push({
      key: job.id,
      kind: "summary",
      label: `Summary ${job.id}`,
      text: job.summaryText,
      tokens: job.summaryTokens,
      why: "Admitted once",
      residency: "WARM",
    });
  }
  for (const page of pages) {
    const why = chosen.get(page.id);
    if (!why || page.protected || page.role === "system") continue;
    items.push(toRawItem(page, why));
  }
  if (controlFits && control) {
    items.push({
      key: "control",
      kind: "control",
      label: "Loop control",
      text: control,
      tokens: controlTokens,
      why: "Transient. Not in RAW.",
    });
  }

  const reason = ok
    ? undefined
    : "Relay refused the prompt. Protected material, the tail, and tool schema do not fit the allowance. Raising the context number is not a fix in this bench.";

  return {
    items,
    tokens: used,
    allowance,
    headroom: allowance - used,
    ok: ok && used <= allowance,
    reason,
    content,
  };
}

function toRawItem(page: Page, why: string): WorkingItem {
  return {
    key: page.id,
    kind: "raw",
    label: page.title,
    text: page.body,
    tokens: page.tokens,
    why,
    pageId: page.id,
    residency: page.residency === "COMPACTING" ? "COMPACTING" : "ACTIVE",
  };
}

export function naiveWindow(pages: Page[], budget: Budget): NaiveView {
  const allowance = allowanceOf(budget);
  const system = pages.filter((page) => page.role === "system");
  const rest = pages.filter((page) => page.role !== "system");
  let used = budget.schema + system.reduce((sum, page) => sum + page.tokens, 0);
  const kept = [...system];
  if (used > allowance) {
    return { tokens: used, kept, forgotten: rest, ok: false };
  }
  const suffix: Page[] = [];
  for (let i = rest.length - 1; i >= 0; i--) {
    const page = rest[i];
    if (used + page.tokens > allowance) break;
    suffix.push(page);
    used += page.tokens;
  }
  const suffixIds = new Set(suffix.map((page) => page.id));
  const forgotten = rest.filter((page) => !suffixIds.has(page.id));
  const ordered = [...kept, ...suffix.slice().reverse()];
  return { tokens: used, kept: ordered, forgotten, ok: true };
}

export function workingText(selection: Selection): string {
  return selection.items.map((item) => item.text).join("\n");
}

export function naiveText(view: NaiveView): string {
  return view.kept.map((page) => page.body).join("\n");
}

export interface Rule {
  id: string;
  label: string;
  test: RegExp;
}

export const RULES: Rule[] = [
  { id: "nctx", label: "Do not raise n_ctx", test: /do not raise n_ctx/i },
  { id: "schema", label: "Nonzero schema fallback", test: /schema fallback stays nonzero/i },
  { id: "reserve", label: "Keep the generation reserve", test: /generation reserve stays 8,?192/i },
];

export function holds(text: string, rule: Rule): boolean {
  return rule.test.test(text);
}

export type ClaimTopic = "n_ctx" | "schema" | "reserve" | "other";
export type ClaimStatus = "settled" | "unsettled" | "unchecked";

export interface Verdict {
  text: string;
  topic: ClaimTopic;
  status: ClaimStatus;
  sourceId: string;
  sourceTitle: string;
  sourceSeq: number;
  conflict?: { pageId: string; title: string; excerpt: string; seq: number };
}

interface Stance {
  topic: Exclude<ClaimTopic, "other">;
  polarity: "keep" | "break";
}

function sentencesOf(body: string): string[] {
  return body
    .split(/\n+|(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function stanceOf(sentence: string): Stance | null {
  if (/\?\s*$/.test(sentence)) return null;
  if (/^(what|why|how|are we|should we|do we|can we)\b/i.test(sentence)) return null;
  if (/do not raise n_ctx|never raise n_ctx|n_ctx stays/i.test(sentence)) {
    return { topic: "n_ctx", polarity: "keep" };
  }
  if (/rais(?:e|ing) n_ctx|bump (?:the )?(?:context|n_ctx)|n_ctx to \d{4,}/i.test(sentence)) {
    return { topic: "n_ctx", polarity: "break" };
  }
  if (/schema fallback stays nonzero|nonzero schema fallback/i.test(sentence)) {
    return { topic: "schema", polarity: "keep" };
  }
  if (
    /schema fallback is 0\b|schema fallback (?:stays|is|to) (?:zero|0)|fallback\s*=\s*0|nonzero rule was not/i.test(
      sentence,
    )
  ) {
    return { topic: "schema", polarity: "break" };
  }
  if (/generation reserve stays 8,?192/i.test(sentence)) {
    return { topic: "reserve", polarity: "keep" };
  }
  if (/spend the (?:generation )?reserve|drop the (?:generation )?reserve|generation reserve (?:is|to) 0/i.test(sentence)) {
    return { topic: "reserve", polarity: "break" };
  }
  return null;
}

export function checkDecisions(pages: Page[]): Verdict[] {
  const ordered = pages.slice().sort((a, b) => a.seq - b.seq);
  const claims: Array<Verdict & { polarity: Stance["polarity"] | null }> = [];

  for (const page of ordered) {
    for (const line of linesTagged(page.body, "DECISION")) {
      const stance = stanceOf(line);
      claims.push({
        text: line,
        topic: stance?.topic ?? "other",
        polarity: stance?.polarity ?? null,
        status: stance ? "settled" : "unchecked",
        sourceId: page.id,
        sourceTitle: page.title,
        sourceSeq: page.seq,
      });
    }
  }

  const unsettle = (
    claim: (typeof claims)[number],
    page: Page,
    excerpt: string,
  ) => {
    if (claim.status === "unsettled") return;
    claim.status = "unsettled";
    claim.conflict = {
      pageId: page.id,
      title: page.title,
      excerpt: excerpt.slice(0, 160),
      seq: page.seq,
    };
  };

  for (const page of ordered) {
    for (const sentence of sentencesOf(page.body)) {
      const tagged = sentence.match(/^CONTRADICT\s+(.+)/i);
      if (tagged) {
        const phrase = tagged[1].trim().toLowerCase();
        for (const claim of claims) {
          if (claim.sourceSeq >= page.seq) continue;
          if (claim.text.toLowerCase().includes(phrase)) unsettle(claim, page, sentence);
        }
        continue;
      }
      const stance = stanceOf(sentence);
      if (!stance) continue;
      for (const claim of claims) {
        if (claim.sourceSeq >= page.seq) continue;
        if (claim.topic !== stance.topic || claim.polarity === null) continue;
        if (claim.polarity === stance.polarity) continue;
        unsettle(claim, page, sentence);
      }
    }
  }

  for (const claim of claims) {
    if (claim.polarity === null) continue;
    const earlier = claims.find(
      (other) =>
        other.topic === claim.topic &&
        other.polarity !== null &&
        other.polarity !== claim.polarity &&
        other.sourceSeq < claim.sourceSeq,
    );
    if (!earlier) continue;
    claim.status = "unsettled";
    if (!claim.conflict) {
      claim.conflict = {
        pageId: earlier.sourceId,
        title: earlier.sourceTitle,
        excerpt: earlier.text.slice(0, 160),
        seq: earlier.sourceSeq,
      };
    }
  }

  return claims.map(({ polarity: _polarity, ...claim }) => claim);
}

export function taskBrief(pages: Page[]): { objective: string; decisions: Verdict[] } {
  const anchor = pages.find((page) => page.anchor);
  return {
    objective: anchor ? anchor.body.split("\n")[0] : "No objective anchored yet.",
    decisions: checkDecisions(pages),
  };
}

export function searchRaw(pages: Page[], query: string): Page[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return pages.filter((page) => {
    const hay = `${page.title}\n${page.body}\n${page.toolPath ?? ""}`.toLowerCase();
    return hay.includes(needle);
  });
}

export function scaleNote(physical: number): string {
  const ratio = physical / LARGE.physical;
  return `Workshop window is ${(ratio * 100).toFixed(1)}% of the LARGE 73,728 profile.`;
}
