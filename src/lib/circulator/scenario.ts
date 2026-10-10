import type { Beat } from "@/lib/circulator/model";

function dump(path: string, header: string[], lines = 28): string {
  const body = [...header];
  for (let i = 0; i < lines; i++) {
    const row = String(i + 40).padStart(3, "0");
    body.push(
      `${path}:${row}  offset=0x${(i * 17).toString(16).padStart(3, "0")}  unchanged inspection residue — not a decision`,
    );
  }
  return body.join("\n");
}

export const relayDump = dump("relay.py", [
  "def admit(prompt, tools, allowance):",
  "    # counts messages only",
  "    return len(tokenize(prompt)) <= allowance",
  "FACT Relay counts chat messages and ignores tool schema tokens.",
  "FACT Unknown tool schemas need a nonzero fallback.",
]);

const schemaDump = dump("schema_budget.py", [
  "def schema_overhead(tools, explicit_no_tool=False):",
  "    if explicit_no_tool:",
  "        return 0",
  "    if not tools:",
  "        return FALLBACK  # currently 0, which is the bug",
  "FACT Explicit no-tool requests may charge zero schema overhead.",
  "FACT Every other request needs a nonzero schema fallback.",
]);

const governorDump = dump(
  "governor.py",
  [
    "RESERVE = 8192",
    "def on_reasoning_only(turn):",
    "    return retry_once(thinking=False)",
    "FACT Generation reserve stays 8,192 and is not available to the prompt.",
    "FACT A reasoning-only generation gets one retry with thinking off.",
  ],
  24,
);

const testLog = dump(
  "pytest.out",
  [
    "collected 12 items",
    "tests/test_relay.py ..... passed",
    "tests/test_schema.py ... passed",
    "short test run, fixture data only",
    "FACT Schema fallback is 0. The nonzero rule was not applied.",
  ],
  30,
);

export const SCENARIO: Beat[] = [
  {
    role: "user",
    title: "Objective",
    anchor: true,
    body: [
      "Fix relay admission so the prompt count includes tool schemas. The session is blowing a 73,728 context and then falling over.",
      "DECISION Do not raise n_ctx to mask an overflow.",
      "FACT Physical context in the real profile is 73,728. This bench uses a scaled window so the same failure is visible.",
    ].join("\n"),
  },
  {
    role: "assistant",
    title: "Plan",
    body: "I will read relay.py and schema_budget.py before editing. I will not touch the context size.",
  },
  {
    role: "tool",
    title: "Read relay.py",
    toolPath: "relay.py",
    body: relayDump,
  },
  {
    role: "assistant",
    title: "Relay note",
    body: "The relay token count skips tool schemas. Next I read schema_budget.py. No patch yet.",
  },
  {
    role: "tool",
    title: "Read schema_budget.py",
    toolPath: "schema_budget.py",
    body: schemaDump,
  },
  {
    role: "assistant",
    title: "Schema decision",
    body: [
      "The zero fallback is how an unknown tool list silently overruns the window.",
      "DECISION Schema fallback stays nonzero except on an explicit no-tool request.",
    ].join("\n"),
  },
  {
    role: "tool",
    title: "Reread relay.py",
    toolPath: "relay.py",
    body: relayDump,
  },
  {
    role: "assistant",
    title: "Still inspecting",
    body: "Reading relay.py again in case the count moved. It has not. No patch yet.",
    governor: true,
  },
  {
    role: "tool",
    title: "Reread relay.py",
    toolPath: "relay.py",
    body: relayDump,
  },
  {
    role: "tool",
    title: "Reread relay.py",
    toolPath: "relay.py",
    body: relayDump,
  },
  {
    role: "assistant",
    title: "Stop rereading",
    body: "The file is unchanged. I will patch the counter instead of reading relay.py again.",
  },
  {
    role: "user",
    title: "Hold the reserve",
    body: "Keep the generation reserve. Do not spend it on the prompt to make the overflow disappear.\nDECISION Generation reserve stays 8,192.",
  },
  {
    role: "tool",
    title: "Read governor.py",
    toolPath: "governor.py",
    body: governorDump,
  },
  {
    role: "assistant",
    title: "Overclaim",
    body: "Patched the counter. All tests passed and the implementation is verified. Shipping it.",
  },
  {
    role: "tool",
    title: "Test log",
    toolPath: "pytest.out",
    body: testLog,
  },
  {
    role: "assistant",
    title: "Context bump",
    body: ["The window is still tight.", "DECISION Raise n_ctx to 131072 so the prompt fits."].join("\n"),
  },
  {
    role: "user",
    title: "Ask for the rule",
    body: "What did we decide about schema fallback, and are we allowed to raise n_ctx?",
  },
];

export const REREAD_BEAT: Beat = {
  role: "tool",
  title: "Reread relay.py",
  toolPath: "relay.py",
  body: relayDump,
};

export const ASK_BEAT: Beat = {
  role: "user",
  title: "Ask for the rule",
  body: "What did we decide about schema fallback, and are we allowed to raise n_ctx?",
};
