import type { AstroCookies } from "astro";

// Minimal cookie-stub som dekker det auth- og reservasjonskoden bruker.
export type FakeCookies = AstroCookies & {
  raw: Map<string, string>;
};

export function fakeCookies(initial: Record<string, string> = {}): FakeCookies {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    raw: store,
    get: (name: string) =>
      store.has(name) ? { value: store.get(name)! } : undefined,
    set: (name: string, value: string) => {
      store.set(name, value);
    },
    delete: (name: string) => {
      store.delete(name);
    },
    has: (name: string) => store.has(name),
  } as unknown as FakeCookies;
}
