import { create } from "zustand";
import { ASK_BEAT, REREAD_BEAT, SCENARIO } from "@/lib/circulator/scenario";
import {
  advance,
  DEFAULT_BUDGET,
  freshBench,
  type Beat,
  type BenchData,
  type Budget,
} from "@/lib/circulator/model";

interface BenchStore extends BenchData {
  cursor: number;
  playing: boolean;
  step: () => void;
  inject: (beat: Beat) => void;
  reread: () => void;
  ask: () => void;
  setPhysical: (physical: number) => void;
  setTrigger: (trigger: number) => void;
  togglePlay: () => void;
  reset: () => void;
}

function seeded(): BenchData & { cursor: number; playing: boolean } {
  return { ...freshBench(), cursor: 0, playing: false };
}

export const useBench = create<BenchStore>((set, get) => ({
  ...seeded(),
  step: () => {
    const state = get();
    if (state.cursor >= SCENARIO.length) {
      set({ playing: false });
      return;
    }
    const next = advance(state, SCENARIO[state.cursor]);
    const cursor = state.cursor + 1;
    set({ ...next, cursor, playing: cursor >= SCENARIO.length ? false : state.playing });
  },
  inject: (beat) => {
    const state = get();
    set({ ...advance(state, beat), playing: false });
  },
  reread: () => get().inject(REREAD_BEAT),
  ask: () => get().inject(ASK_BEAT),
  setPhysical: (physical) => {
    const budget: Budget = { ...get().budget, physical: Math.round(physical) };
    set({ budget });
  },
  setTrigger: (trigger) => {
    const next = Math.round(trigger);
    const budget: Budget = {
      ...get().budget,
      trigger: next,
      target: Math.max(200, Math.round(next * 0.82)),
    };
    set({ budget });
  },
  togglePlay: () => {
    const state = get();
    if (state.cursor >= SCENARIO.length) {
      set({ playing: false });
      return;
    }
    set({ playing: !state.playing });
  },
  reset: () => set({ ...freshBench(DEFAULT_BUDGET), cursor: 0, playing: false }),
}));

export const SCENARIO_LENGTH = SCENARIO.length;
