import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as ScrollText, c as Pause, i as Search, l as GitFork, n as SkipForward, o as RotateCcw, r as ShieldAlert, s as Play } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DI8OUFOI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function dump(path, header, lines = 28) {
	const body = [...header];
	for (let i = 0; i < lines; i++) {
		const row = String(i + 40).padStart(3, "0");
		body.push(`${path}:${row}  offset=0x${(i * 17).toString(16).padStart(3, "0")}  unchanged inspection residue — not a decision`);
	}
	return body.join("\n");
}
var relayDump = dump("relay.py", [
	"def admit(prompt, tools, allowance):",
	"    # counts messages only",
	"    return len(tokenize(prompt)) <= allowance",
	"FACT Relay counts chat messages and ignores tool schema tokens.",
	"FACT Unknown tool schemas need a nonzero fallback."
]);
var schemaDump = dump("schema_budget.py", [
	"def schema_overhead(tools, explicit_no_tool=False):",
	"    if explicit_no_tool:",
	"        return 0",
	"    if not tools:",
	"        return FALLBACK  # currently 0, which is the bug",
	"FACT Explicit no-tool requests may charge zero schema overhead.",
	"FACT Every other request needs a nonzero schema fallback."
]);
var governorDump = dump("governor.py", [
	"RESERVE = 8192",
	"def on_reasoning_only(turn):",
	"    return retry_once(thinking=False)",
	"FACT Generation reserve stays 8,192 and is not available to the prompt.",
	"FACT A reasoning-only generation gets one retry with thinking off."
], 24);
var testLog = dump("pytest.out", [
	"collected 12 items",
	"tests/test_relay.py ..... passed",
	"tests/test_schema.py ... passed",
	"short test run, fixture data only",
	"FACT Schema fallback is 0. The nonzero rule was not applied."
], 30);
var SCENARIO = [
	{
		role: "user",
		title: "Objective",
		anchor: true,
		body: [
			"Fix relay admission so the prompt count includes tool schemas. The session is blowing a 73,728 context and then falling over.",
			"DECISION Do not raise n_ctx to mask an overflow.",
			"FACT Physical context in the real profile is 73,728. This bench uses a scaled window so the same failure is visible."
		].join("\n")
	},
	{
		role: "assistant",
		title: "Plan",
		body: "I will read relay.py and schema_budget.py before editing. I will not touch the context size."
	},
	{
		role: "tool",
		title: "Read relay.py",
		toolPath: "relay.py",
		body: relayDump
	},
	{
		role: "assistant",
		title: "Relay note",
		body: "The relay token count skips tool schemas. Next I read schema_budget.py. No patch yet."
	},
	{
		role: "tool",
		title: "Read schema_budget.py",
		toolPath: "schema_budget.py",
		body: schemaDump
	},
	{
		role: "assistant",
		title: "Schema decision",
		body: ["The zero fallback is how an unknown tool list silently overruns the window.", "DECISION Schema fallback stays nonzero except on an explicit no-tool request."].join("\n")
	},
	{
		role: "tool",
		title: "Reread relay.py",
		toolPath: "relay.py",
		body: relayDump
	},
	{
		role: "assistant",
		title: "Still inspecting",
		body: "Reading relay.py again in case the count moved. It has not. No patch yet.",
		governor: true
	},
	{
		role: "tool",
		title: "Reread relay.py",
		toolPath: "relay.py",
		body: relayDump
	},
	{
		role: "tool",
		title: "Reread relay.py",
		toolPath: "relay.py",
		body: relayDump
	},
	{
		role: "assistant",
		title: "Stop rereading",
		body: "The file is unchanged. I will patch the counter instead of reading relay.py again."
	},
	{
		role: "user",
		title: "Hold the reserve",
		body: "Keep the generation reserve. Do not spend it on the prompt to make the overflow disappear.\nDECISION Generation reserve stays 8,192."
	},
	{
		role: "tool",
		title: "Read governor.py",
		toolPath: "governor.py",
		body: governorDump
	},
	{
		role: "assistant",
		title: "Overclaim",
		body: "Patched the counter. All tests passed and the implementation is verified. Shipping it."
	},
	{
		role: "tool",
		title: "Test log",
		toolPath: "pytest.out",
		body: testLog
	},
	{
		role: "assistant",
		title: "Context bump",
		body: ["The window is still tight.", "DECISION Raise n_ctx to 131072 so the prompt fits."].join("\n")
	},
	{
		role: "user",
		title: "Ask for the rule",
		body: "What did we decide about schema fallback, and are we allowed to raise n_ctx?"
	}
];
var REREAD_BEAT = {
	role: "tool",
	title: "Reread relay.py",
	toolPath: "relay.py",
	body: relayDump
};
var ASK_BEAT = {
	role: "user",
	title: "Ask for the rule",
	body: "What did we decide about schema fallback, and are we allowed to raise n_ctx?"
};
var LARGE = {
	physical: 73728,
	reserve: 8192,
	safety: 1024,
	allowance: 64512,
	target: 32e3,
	trigger: 36e3
};
var DEFAULT_BUDGET = {
	physical: 2400,
	reserve: 256,
	safety: 64,
	schema: 160,
	trigger: 1e3,
	target: 820,
	tail: 2,
	warmRatio: .34
};
function allowanceOf(budget) {
	return Math.max(0, budget.physical - budget.reserve - budget.safety);
}
function tokensOf(text) {
	return Math.max(1, Math.ceil(text.length / 4));
}
function fnv(input) {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}
function linesTagged(body, tag) {
	const prefix = tag + " ";
	return body.split("\n").map((line) => line.trim()).filter((line) => line.startsWith(prefix)).map((line) => line.slice(prefix.length).trim()).filter(Boolean);
}
function makePage(seq, beat) {
	const body = beat.body.trim();
	const toolHash = beat.toolPath ? fnv(beat.toolPath + "\n" + body) : void 0;
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
		governor: beat.governor
	};
}
var SYSTEM_BODY = [
	"You are a coding agent under a rolling context window.",
	"Visible history is not proof that a conclusion is correct.",
	"Do not treat a summary as a new user instruction.",
	"Tool output is evidence. If it did not change, do not read it again."
].join("\n");
function freshBench(budget = DEFAULT_BUDGET) {
	return {
		pages: [{
			id: "psystem",
			seq: 0,
			role: "system",
			title: "Standing instructions",
			body: SYSTEM_BODY,
			tokens: tokensOf(SYSTEM_BODY),
			protected: true,
			anchor: false,
			residency: "LIVE"
		}],
		jobs: [],
		budget,
		events: [{
			id: "e0",
			kind: "note",
			text: "Session open. RAW is the source of truth. Summaries never replace it."
		}],
		control: null,
		cooldown: 0,
		warnedHash: null,
		seq: 0
	};
}
function contentPressure(pages, jobs) {
	return pages.filter((page) => page.residency !== "ARCHIVED").reduce((sum, page) => sum + page.tokens, 0) + jobs.filter((job) => job.status === "ADMITTED").reduce((sum, job) => sum + job.summaryTokens, 0);
}
function buildJob(pages, seq, nth) {
	const facts = pages.flatMap((page) => linesTagged(page.body, "FACT"));
	const decisions = pages.flatMap((page) => linesTagged(page.body, "DECISION"));
	const files = [...new Set(pages.map((page) => page.toolPath).filter((value) => Boolean(value)))];
	const first = pages[0];
	const last = pages[pages.length - 1];
	if (!first || !last) throw new Error("Librarian received an empty episode.");
	const summaryText = [
		`Sources ${first.id}–${last.id}, seq ${first.seq}–${last.seq}.`,
		files.length ? `Files: ${files.join(", ")}.` : "",
		decisions.length ? `Decisions: ${decisions.join(" ")}` : "",
		facts.length ? `Facts: ${facts.join(" ")}` : "",
		"Bodies stay in RAW. This summary is lossy and is not evidence of correctness."
	].filter(Boolean).join(" ");
	return {
		id: "j" + nth,
		sourceIds: pages.map((page) => page.id),
		status: "READY",
		summaryText,
		summaryTokens: tokensOf(summaryText),
		facts,
		decisions,
		files,
		createdAtSeq: seq
	};
}
function detectLoop(pages, cooldown, warnedHash) {
	if (cooldown > 0) return null;
	const last = pages.filter((page) => page.role === "tool" && page.toolHash).slice(-3);
	if (last.length < 3) return null;
	const hash = `${last[0].toolPath}|${last[0].toolHash}`;
	if (hash === warnedHash) return null;
	if (!last.every((page) => `${page.toolPath}|${page.toolHash}` === hash)) return null;
	return {
		hash,
		text: `Loop Guard: ${last[0].toolPath} came back identical three times. Stop re-reading it. Act on the evidence already in RAW.`
	};
}
var eventSerial = 1;
function event(kind, text) {
	eventSerial += 1;
	return {
		id: "e" + eventSerial.toString(36),
		kind,
		text
	};
}
function advance(data, beat) {
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
		events.push(event("admit", `Admitted ${job.id} once. ${job.summaryTokens}t summary replaces ${job.sourceIds.length} raw ${job.sourceIds.length === 1 ? "page" : "pages"}. Sources stay archived.`));
	}
	if (beat) {
		seq += 1;
		const page = makePage(seq, beat);
		pages.push(page);
		events.push(event("raw", `RAW ${page.id} · ${page.role} · ${page.tokens}t · ${page.title}`));
		if (page.governor) events.push(event("governor", "Governor: reasoning-only turn, no tool and no patch. One local retry would disable thinking. The 8,192 reserve is not spent on the prompt."));
	}
	const prior = new Set(checkDecisions(data.pages).filter((claim) => claim.status === "unsettled").map((claim) => claim.sourceId + "\n" + claim.text));
	for (const claim of checkDecisions(pages)) {
		if (claim.status !== "unsettled") continue;
		if (prior.has(claim.sourceId + "\n" + claim.text)) continue;
		const excerpt = claim.conflict?.excerpt ?? "a later page";
		const where = claim.conflict?.title ?? "later RAW";
		events.push(event("fact", `Fact check: "${claim.text}" is unsettled by ${where}. "${excerpt}" RAW was not rewritten.`));
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
	} else control = null;
	const pressure = contentPressure(pages, jobs);
	if (pressure > data.budget.trigger) {
		const tailIds = new Set(pages.slice(-data.budget.tail).map((page) => page.id));
		const candidates = pages.filter((page) => page.residency === "LIVE" && !page.protected && !tailIds.has(page.id) && page.role !== "system" && page.tokens >= 120);
		const taken = [];
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
			if (saved <= 0) for (const page of taken) page.residency = "LIVE";
			else {
				jobs.push(job);
				const noun = taken.length === 1 ? "page" : "pages";
				events.push(event("compact", `Librarian READY ${job.id}. ${taken.length} ${noun}, ${saved}t of dead weight parked. Not admitted until the next request.`));
			}
		}
	}
	const selection = selectWorking({
		pages,
		jobs,
		budget: data.budget,
		control
	});
	if (!selection.ok) {
		if (!events.slice(-6).some((item) => item.kind === "reject")) events.push(event("reject", selection.reason ?? "Relay refused the prompt."));
	}
	return {
		pages,
		jobs,
		budget: data.budget,
		events: events.slice(-48),
		control,
		cooldown,
		warnedHash,
		seq
	};
}
function selectWorking(input) {
	const { pages, jobs, budget, control } = input;
	const allowance = allowanceOf(budget);
	const content = contentPressure(pages, jobs);
	let used = budget.schema;
	let ok = used <= allowance;
	const chosen = /* @__PURE__ */ new Map();
	const take = (page, why, required) => {
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
	const summaryIds = [];
	for (const job of admitted) {
		if (warmUsed + job.summaryTokens > warmCap) continue;
		if (used + job.summaryTokens > allowance) break;
		summaryIds.push(job.id);
		warmUsed += job.summaryTokens;
		used += job.summaryTokens;
	}
	const filler = pages.filter((page) => page.residency !== "ARCHIVED" && !chosen.has(page.id)).slice().reverse();
	for (const page of filler) {
		if (used + page.tokens > allowance) continue;
		chosen.set(page.id, page.residency === "COMPACTING" ? "Still on the wire" : "Fits in the remainder");
		used += page.tokens;
	}
	if (controlFits && control) used += controlTokens;
	const items = [];
	for (const page of pages) {
		const why = chosen.get(page.id);
		if (!why) continue;
		if (page.role === "system" || page.protected) items.push(toRawItem(page, why));
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
			residency: "WARM"
		});
	}
	for (const page of pages) {
		const why = chosen.get(page.id);
		if (!why || page.protected || page.role === "system") continue;
		items.push(toRawItem(page, why));
	}
	if (controlFits && control) items.push({
		key: "control",
		kind: "control",
		label: "Loop control",
		text: control,
		tokens: controlTokens,
		why: "Transient. Not in RAW."
	});
	const reason = ok ? void 0 : "Relay refused the prompt. Protected material, the tail, and tool schema do not fit the allowance. Raising the context number is not a fix in this bench.";
	return {
		items,
		tokens: used,
		allowance,
		headroom: allowance - used,
		ok: ok && used <= allowance,
		reason,
		content
	};
}
function toRawItem(page, why) {
	return {
		key: page.id,
		kind: "raw",
		label: page.title,
		text: page.body,
		tokens: page.tokens,
		why,
		pageId: page.id,
		residency: page.residency === "COMPACTING" ? "COMPACTING" : "ACTIVE"
	};
}
function naiveWindow(pages, budget) {
	const allowance = allowanceOf(budget);
	const system = pages.filter((page) => page.role === "system");
	const rest = pages.filter((page) => page.role !== "system");
	let used = budget.schema + system.reduce((sum, page) => sum + page.tokens, 0);
	const kept = [...system];
	if (used > allowance) return {
		tokens: used,
		kept,
		forgotten: rest,
		ok: false
	};
	const suffix = [];
	for (let i = rest.length - 1; i >= 0; i--) {
		const page = rest[i];
		if (used + page.tokens > allowance) break;
		suffix.push(page);
		used += page.tokens;
	}
	const suffixIds = new Set(suffix.map((page) => page.id));
	const forgotten = rest.filter((page) => !suffixIds.has(page.id));
	const ordered = [...kept, ...suffix.slice().reverse()];
	return {
		tokens: used,
		kept: ordered,
		forgotten,
		ok: true
	};
}
function workingText(selection) {
	return selection.items.map((item) => item.text).join("\n");
}
function naiveText(view) {
	return view.kept.map((page) => page.body).join("\n");
}
var RULES = [
	{
		id: "nctx",
		label: "Do not raise n_ctx",
		test: /do not raise n_ctx/i
	},
	{
		id: "schema",
		label: "Nonzero schema fallback",
		test: /schema fallback stays nonzero/i
	},
	{
		id: "reserve",
		label: "Keep the generation reserve",
		test: /generation reserve stays 8,?192/i
	}
];
function holds(text, rule) {
	return rule.test.test(text);
}
function sentencesOf(body) {
	return body.split(/\n+|(?<=[.?!])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
}
function stanceOf(sentence) {
	if (/\?\s*$/.test(sentence)) return null;
	if (/^(what|why|how|are we|should we|do we|can we)\b/i.test(sentence)) return null;
	if (/do not raise n_ctx|never raise n_ctx|n_ctx stays/i.test(sentence)) return {
		topic: "n_ctx",
		polarity: "keep"
	};
	if (/rais(?:e|ing) n_ctx|bump (?:the )?(?:context|n_ctx)|n_ctx to \d{4,}/i.test(sentence)) return {
		topic: "n_ctx",
		polarity: "break"
	};
	if (/schema fallback stays nonzero|nonzero schema fallback/i.test(sentence)) return {
		topic: "schema",
		polarity: "keep"
	};
	if (/schema fallback is 0\b|schema fallback (?:stays|is|to) (?:zero|0)|fallback\s*=\s*0|nonzero rule was not/i.test(sentence)) return {
		topic: "schema",
		polarity: "break"
	};
	if (/generation reserve stays 8,?192/i.test(sentence)) return {
		topic: "reserve",
		polarity: "keep"
	};
	if (/spend the (?:generation )?reserve|drop the (?:generation )?reserve|generation reserve (?:is|to) 0/i.test(sentence)) return {
		topic: "reserve",
		polarity: "break"
	};
	return null;
}
function checkDecisions(pages) {
	const ordered = pages.slice().sort((a, b) => a.seq - b.seq);
	const claims = [];
	for (const page of ordered) for (const line of linesTagged(page.body, "DECISION")) {
		const stance = stanceOf(line);
		claims.push({
			text: line,
			topic: stance?.topic ?? "other",
			polarity: stance?.polarity ?? null,
			status: stance ? "settled" : "unchecked",
			sourceId: page.id,
			sourceTitle: page.title,
			sourceSeq: page.seq
		});
	}
	const unsettle = (claim, page, excerpt) => {
		if (claim.status === "unsettled") return;
		claim.status = "unsettled";
		claim.conflict = {
			pageId: page.id,
			title: page.title,
			excerpt: excerpt.slice(0, 160),
			seq: page.seq
		};
	};
	for (const page of ordered) for (const sentence of sentencesOf(page.body)) {
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
	for (const claim of claims) {
		if (claim.polarity === null) continue;
		const earlier = claims.find((other) => other.topic === claim.topic && other.polarity !== null && other.polarity !== claim.polarity && other.sourceSeq < claim.sourceSeq);
		if (!earlier) continue;
		claim.status = "unsettled";
		if (!claim.conflict) claim.conflict = {
			pageId: earlier.sourceId,
			title: earlier.sourceTitle,
			excerpt: earlier.text.slice(0, 160),
			seq: earlier.sourceSeq
		};
	}
	return claims.map(({ polarity: _polarity, ...claim }) => claim);
}
function taskBrief(pages) {
	const anchor = pages.find((page) => page.anchor);
	return {
		objective: anchor ? anchor.body.split("\n")[0] : "No objective anchored yet.",
		decisions: checkDecisions(pages)
	};
}
function searchRaw(pages, query) {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];
	return pages.filter((page) => {
		return `${page.title}\n${page.body}\n${page.toolPath ?? ""}`.toLowerCase().includes(needle);
	});
}
function scaleNote(physical) {
	return `Workshop window is ${(physical / LARGE.physical * 100).toFixed(1)}% of the LARGE 73,728 profile.`;
}
function seeded() {
	return {
		...freshBench(),
		cursor: 0,
		playing: false
	};
}
var useBench = create((set, get) => ({
	...seeded(),
	step: () => {
		const state = get();
		if (state.cursor >= SCENARIO.length) {
			set({ playing: false });
			return;
		}
		const next = advance(state, SCENARIO[state.cursor]);
		const cursor = state.cursor + 1;
		set({
			...next,
			cursor,
			playing: cursor >= SCENARIO.length ? false : state.playing
		});
	},
	inject: (beat) => {
		set({
			...advance(get(), beat),
			playing: false
		});
	},
	reread: () => get().inject(REREAD_BEAT),
	ask: () => get().inject(ASK_BEAT),
	setPhysical: (physical) => {
		set({ budget: {
			...get().budget,
			physical: Math.round(physical)
		} });
	},
	setTrigger: (trigger) => {
		const next = Math.round(trigger);
		set({ budget: {
			...get().budget,
			trigger: next,
			target: Math.max(200, Math.round(next * .82))
		} });
	},
	togglePlay: () => {
		const state = get();
		if (state.cursor >= SCENARIO.length) {
			set({ playing: false });
			return;
		}
		set({ playing: !state.playing });
	},
	reset: () => set({
		...freshBench(DEFAULT_BUDGET),
		cursor: 0,
		playing: false
	})
}));
var SCENARIO_LENGTH = SCENARIO.length;
function Bench() {
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
	const [tab, setTab] = (0, import_react.useState)("raw");
	const [query, setQuery] = (0, import_react.useState)("");
	const [draft, setDraft] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		const id = window.setInterval(() => {
			useBench.getState().step();
		}, 900);
		return () => window.clearInterval(id);
	}, [playing]);
	const selection = (0, import_react.useMemo)(() => selectWorking({
		pages,
		jobs,
		budget,
		control
	}), [
		pages,
		jobs,
		budget,
		control
	]);
	const naive = (0, import_react.useMemo)(() => naiveWindow(pages, budget), [pages, budget]);
	const brief = (0, import_react.useMemo)(() => taskBrief(pages), [pages]);
	const circulated = workingText(selection);
	const forgotten = naiveText(naive);
	const hits = (0, import_react.useMemo)(() => searchRaw(pages, query), [pages, query]);
	const done = cursor >= SCENARIO_LENGTH;
	const admitted = jobs.filter((job) => job.status === "ADMITTED").length;
	const ready = jobs.filter((job) => job.status === "READY").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center gap-3 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-xs uppercase tracking-widest text-muted",
								children: "Workshop bench"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-xl font-extrabold leading-none",
								children: "Circulator"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ml-auto hidden text-sm text-muted sm:block",
							children: "Full history. Smaller prompt."
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-4 lg:col-span-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-pretty text-base text-fg",
									children: "Long jobs fall over when the window fills with old reads. This bench keeps every page, compresses the dead weight, and shows what a naive tail forgets."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-pretty text-sm text-muted",
									children: "Nothing here calls a model. The librarian is a deterministic baseline: literal facts, decisions, and source ids. A summary can be admitted and still be wrong."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn-lime",
										onClick: togglePlay,
										disabled: done && !playing,
										children: [playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), playing ? "Pause" : done ? "Finished" : "Run the job"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn-ghost",
										onClick: step,
										disabled: playing || done,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { className: "size-4" }), "Step"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-ghost",
										onClick: reread,
										children: "Reread relay.py"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-ghost",
										onClick: ask,
										children: "Ask the rule"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn-ghost col-span-2",
										onClick: reset,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Reset session"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-xs text-muted tabular-nums",
								children: [
									"Beat ",
									Math.min(cursor, SCENARIO_LENGTH),
									" / ",
									SCENARIO_LENGTH,
									done ? " · scenario complete, RAW still open" : ""
								]
							}),
							events.some((item) => item.kind === "loop") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-clay",
								children: "Loop guard fired on relay.py. It nudged the prompt, then dropped off. It was never written into RAW. The log keeps the event."
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "overflow-hidden rounded-lg border border-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
										label: "Circulated",
										value: selection.tokens,
										ok: selection.ok,
										note: selection.ok ? `${selection.headroom}t headroom` : "relay refused"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
										label: "Naive tail",
										value: naive.tokens,
										ok: naive.ok,
										note: naive.forgotten.length ? `${naive.forgotten.length} pages forgotten` : "nothing dropped yet"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "divide-y divide-line border-t border-line",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "grid grid-cols-3 gap-2 bg-surface-2 px-3 py-2 font-mono text-xs uppercase tracking-wide text-muted",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rule" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Here" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Naive" })
										]
									}), RULES.map((rule) => {
										const here = holds(circulated, rule);
										const there = holds(forgotten, rule);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "grid grid-cols-3 gap-2 bg-surface px-3 py-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-fg",
													children: rule.label
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RuleBit, {
													ok: here,
													yes: "kept",
													no: "missing"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RuleBit, {
													ok: there,
													yes: "kept",
													no: "forgotten"
												})
											]
										}, rule.id);
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3 rounded-lg border border-line bg-surface p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
										label: "Prompt on the wire",
										value: Math.max(0, selection.tokens),
										max: Math.max(selection.allowance, 1),
										caption: `${selection.tokens}t / ${selection.allowance}t allowance`,
										hot: !selection.ok
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
										label: "Live content",
										value: selection.content,
										max: Math.max(budget.trigger * 1.35, selection.content, 1),
										mark: budget.trigger / Math.max(budget.trigger * 1.35, selection.content, 1),
										caption: `${selection.content}t · trigger ${budget.trigger}t · target ${budget.target}t`,
										hot: selection.content > budget.trigger
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted tabular-nums",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Schema overhead" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "text-right text-fg",
												children: budget.schema
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Generation reserve" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "text-right text-fg",
												children: budget.reserve
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Safety margin" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "text-right text-fg",
												children: budget.safety
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Physical window" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "text-right text-fg",
												children: budget.physical
											})
										]
									}),
									!selection.ok && selection.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex gap-2 text-sm text-clay",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selection.reason })]
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
								className: "space-y-3 rounded-lg border border-line p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
										className: "px-1 text-sm font-semibold",
										children: "Break the window"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Physical window",
										min: 700,
										max: 4200,
										step: 20,
										value: budget.physical,
										onChange: setPhysical
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Content trigger",
										min: 400,
										max: 2200,
										step: 20,
										value: budget.trigger,
										onChange: setTrigger
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: scaleNote(budget.physical)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-mono text-xs text-muted",
										children: [
											"LARGE reference ",
											LARGE.physical.toLocaleString(),
											" physical · ",
											LARGE.reserve.toLocaleString(),
											" ",
											"reserve · ",
											LARGE.safety.toLocaleString(),
											" safety · ",
											LARGE.allowance.toLocaleString(),
											" allowance · trigger ",
											LARGE.trigger.toLocaleString()
										]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-4 lg:col-span-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-paper p-4 text-ink",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-lg font-bold",
											children: "What this request sends"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-xs text-ink-soft tabular-nums",
											children: selection.ok ? "admitted" : "refused"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-ink-soft",
										children: brief.objective
									}),
									brief.decisions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-3 space-y-2",
										children: brief.decisions.map((decision) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "text-sm",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: decision.status === "unsettled" ? "font-mono text-xs uppercase tracking-wide text-clay" : "font-mono text-xs uppercase tracking-wide text-ink-soft",
													children: [
														decision.status,
														" ·",
														" "
													]
												}),
												decision.text,
												decision.conflict ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "mt-1 block text-xs text-ink-soft",
													children: [
														"Conflicts with ",
														decision.conflict.title,
														": ",
														decision.conflict.excerpt
													]
												}) : null
											]
										}, decision.sourceId + decision.text))
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm text-ink-soft",
										children: "No decision in RAW yet."
									}),
									brief.decisions.some((decision) => decision.status === "unsettled") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-xs text-ink-soft",
										children: "Unsettled means a later page conflicts. The old line can still be in the prompt. Fact check does not rewrite RAW."
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "space-y-2",
								children: selection.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: item.kind === "control" ? "rounded-lg border border-clay bg-surface p-3" : item.kind === "summary" ? "rounded-lg border border-lime/50 bg-surface p-3" : "rounded-lg border border-line bg-surface p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-baseline justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-sm font-semibold",
												children: item.label
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono text-xs text-muted tabular-nums",
												children: [
													item.why,
													" · ",
													item.tokens,
													"t",
													item.pageId ? ` · ${item.pageId}` : "",
													item.residency ? ` · ${item.residency}` : ""
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Excerpt, {
											text: item.text,
											id: item.key
										}),
										/all tests passed|implementation is verified/i.test(item.text) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs text-clay",
											children: "Claim, not evidence. Continuity does not make this true."
										}) : null,
										brief.decisions.some((decision) => decision.status === "unsettled" && item.text.includes(decision.text)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs text-clay",
											children: "Unsettled. A later page conflicts with this line."
										}) : null
									]
								}, item.key))
							}),
							naive.forgotten.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-line p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-semibold",
										children: "Naive tail already dropped"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-2 space-y-1",
										children: naive.forgotten.slice(0, 6).map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "font-mono text-xs text-muted",
											children: [
												page.id,
												" · ",
												page.title,
												" · ",
												page.tokens,
												"t"
											]
										}, page.id))
									}),
									naive.forgotten.length > 6 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 font-mono text-xs text-muted",
										children: [
											"+",
											naive.forgotten.length - 6,
											" more"
										]
									}) : null
								]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "space-y-2 rounded-lg border border-line p-4",
								onSubmit: (event) => {
									event.preventDefault();
									const body = draft.trim();
									if (!body) return;
									inject({
										role: "user",
										title: "Pasted turn",
										body
									});
									setDraft("");
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "draft",
										className: "text-sm font-semibold",
										children: "Throw more weight in"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										id: "draft",
										value: draft,
										onChange: (event) => setDraft(event.target.value),
										rows: 3,
										placeholder: "A note, a log, a repeated file. It lands in RAW and counts toward the window.",
										className: "w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-lime"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "btn-lime",
										disabled: !draft.trim(),
										children: "Append to RAW"
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "lg:col-span-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex gap-1 overflow-x-auto",
								role: "tablist",
								"aria-label": "Archive",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
										id: "raw",
										tab,
										setTab,
										label: "RAW"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
										id: "librarian",
										tab,
										setTab,
										label: `Lib ${admitted}/${jobs.length}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
										id: "recall",
										tab,
										setTab,
										label: "Recall"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
										id: "log",
										tab,
										setTab,
										label: "Log"
									})
								]
							}),
							tab === "raw" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RawList, { pages }) : null,
							tab === "librarian" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted",
									children: ready ? `${ready} summary READY. It joins the next request, not this one.` : admitted ? `${admitted} admitted once. RAW was not rewritten.` : "Cold pages queue here. Run the job until content crosses the trigger."
								}), jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollText, { className: "size-4" }),
									text: "No compaction yet."
								}) : jobs.slice().reverse().map((job) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-lg border border-line bg-surface p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-baseline justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-mono text-xs",
												children: job.id
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: job.status === "ADMITTED" ? "text-xs text-lime" : "text-xs text-clay",
												children: job.status
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs text-muted",
											children: job.summaryText
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 font-mono text-xs text-muted tabular-nums",
											children: [job.summaryTokens, "t"]
										})
									]
								}, job.id))]
							}) : null,
							tab === "recall" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold",
										htmlFor: "recall",
										children: "Search RAW, including archived pages"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-3 left-3 size-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "recall",
											value: query,
											onChange: (event) => setQuery(event.target.value),
											placeholder: "schema, n_ctx, relay.py",
											className: "min-h-11 w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm outline-none focus:border-lime"
										})]
									}),
									query.trim() && hits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "No source contains that." }) : null,
									hits.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
										className: "rounded-lg border border-line bg-surface p-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-baseline justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-semibold",
													children: page.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-xs text-muted",
													children: page.residency
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 font-mono text-xs text-muted",
												children: [page.id, page.toolPath ? ` · ${page.toolPath}` : ""]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Excerpt, {
												text: page.body,
												id: "hit-" + page.id
											})
										]
									}, page.id))
								]
							}) : null,
							tab === "log" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "space-y-2",
								children: events.slice().reverse().map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogRow, { item }) }, item.id))
							}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mx-auto max-w-6xl space-y-2 px-4 pt-2 pb-10 text-sm text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-start gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitFork, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"A browser fork of the pipeline in",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "text-lime underline underline-offset-2",
							href: "https://github.com/UnVibedNoCoder/rolling-context-circulator",
							target: "_blank",
							rel: "noreferrer",
							children: "UnVibedNoCoder/rolling-context-circulator"
						}),
						", MIT. The Linux beta talks to Hermes and llama.cpp. This one is the mechanism you can push on: RAW, librarian, one-time admission, loop guard, and a relay that can say no."
					] })]
				})
			})
		]
	});
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: "size-8 shrink-0 text-lime",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			className: "orbit",
			cx: "16",
			cy: "16",
			r: "11",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeDasharray: "46 22"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "16",
			cy: "16",
			r: "3.5",
			fill: "currentColor"
		})]
	});
}
function Score({ label, value, ok, note }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-3xl font-medium tabular-nums",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: ok ? "text-xs text-lime" : "text-xs text-clay",
				children: note
			})
		]
	});
}
function RuleBit({ ok, yes, no }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: ok ? "text-lime" : "text-clay",
		children: ok ? yes : no
	});
}
function Meter({ label, value, max, caption, mark, hot }) {
	const pct = Math.max(0, Math.min(100, value / max * 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-3 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-muted tabular-nums",
			children: caption
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mt-1 h-2 rounded-full bg-surface-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: hot ? "h-full rounded-full bg-clay transition-all" : "h-full rounded-full bg-lime transition-all",
			style: { width: `${pct}%` }
		}), mark != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute top-0 h-2 w-px bg-fg",
			style: { left: `${Math.max(0, Math.min(100, mark * 100))}%` }
		}) : null]
	})] });
}
function Slider({ label, min, max, step, value, onChange }) {
	const id = label.replace(/\s+/g, "-").toLowerCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs tabular-nums",
			children: value
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		id,
		type: "range",
		min,
		max,
		step,
		value,
		onChange: (event) => onChange(Number(event.target.value)),
		className: "mt-1 h-11 w-full accent-lime"
	})] });
}
function TabButton({ id, tab, setTab, label }) {
	const on = tab === id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "tab",
		"aria-selected": on,
		className: on ? "min-h-11 shrink-0 rounded-lg bg-lime px-3 text-sm font-semibold text-lime-ink" : "min-h-11 shrink-0 rounded-lg px-3 text-sm text-muted",
		onClick: () => setTab(id),
		children: label
	});
}
function RawList({ pages }) {
	const ordered = pages.slice().reverse();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "space-y-2",
		children: ordered.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-lg border border-line bg-surface p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold",
						children: page.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-muted",
						children: badge(page)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-xs text-muted tabular-nums",
					children: [
						page.role,
						" · ",
						page.tokens,
						"t · ",
						page.id
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Excerpt, {
					text: page.body,
					id: "raw-" + page.id
				})
			]
		}, page.id))
	});
}
function badge(page) {
	if (page.residency === "ARCHIVED") return "ARCHIVED";
	if (page.residency === "COMPACTING") return "COMPACTING";
	if (page.protected) return "PROTECTED";
	return "LIVE";
}
function Excerpt({ text, id }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const lines = text.split("\n");
	const long = lines.length > 6;
	const shown = long && !open ? lines.slice(0, 5).join("\n") : text;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "font-mono text-xs leading-relaxed whitespace-pre-wrap text-current",
			children: shown
		}), long ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-1 min-h-11 text-xs font-semibold underline underline-offset-2",
			onClick: () => setOpen((value) => !value),
			"aria-controls": id,
			children: open ? "Show less" : `Show ${lines.length - 5} more lines`
		}) : null]
	});
}
function LogRow({ item }) {
	const tone = item.kind === "reject" || item.kind === "loop" || item.kind === "fact" ? "text-clay" : item.kind === "admit" || item.kind === "compact" ? "text-lime" : "text-muted";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `font-mono uppercase ${tone}`,
			children: item.kind
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "text-fg",
			children: [" ", item.text]
		})]
	});
}
function Empty({ text, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted",
		children: [icon, text]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bench, {});
}
//#endregion
export { Home as component };
