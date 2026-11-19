import { sharedArabic } from "@/locales/shared-ar";

/** Visible English copy that should be sent for Arabic translation. */
export function isTranslatableCopy(value: string): boolean {
  const v = value.trim();
  if (v.length < 3) return false;
  if (/[\u0600-\u06FF]/.test(v)) return false;
  if (!/[a-zA-Z]/.test(v)) return false;
  if (/^https?:\/\//i.test(v)) return false;
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(v)) return false;
  if (/^[\d\s+()\-./]+$/.test(v)) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return false;
  return true;
}

const SKIP = "script,style,noscript,textarea,input,code,pre,[data-no-translate]";
const ATTRS = ["placeholder", "aria-label", "alt", "title"] as const;

type Restore =
  | { kind: "text"; node: Text; original: string }
  | { kind: "attr"; el: Element; attr: string; original: string };

const applied = new Map<string, string>();
const failed = new Set<string>();
const restores: Restore[] = [];
let titleOriginal: string | null = null;
const recordedText = new WeakSet<Text>();
const recordedAttr = new WeakMap<Element, Set<string>>();

let observer: MutationObserver | null = null;
let running = false;
let pending = false;

function rememberRestore(item: Restore) {
  if (item.kind === "text") {
    if (recordedText.has(item.node)) return;
    recordedText.add(item.node);
  } else {
    const set = recordedAttr.get(item.el) ?? new Set<string>();
    if (set.has(item.attr)) return;
    set.add(item.attr);
    recordedAttr.set(item.el, set);
  }
  restores.push(item);
}

function applyText(node: Text, original: string, next: string) {
  const raw = node.nodeValue ?? "";
  const start = raw.indexOf(original);
  if (start < 0) return;
  const value = raw.slice(0, start) + next + raw.slice(start + original.length);
  if (value === raw) return;
  rememberRestore({ kind: "text", node, original: raw });
  node.nodeValue = value;
}

function applyAttr(el: Element, attr: string, original: string, next: string) {
  if (el.getAttribute(attr) === next) return;
  rememberRestore({ kind: "attr", el, attr, original });
  el.setAttribute(attr, next);
}

type Job = { text: string; apply: (next: string) => void };

function collect(jobs: Job[]) {
  const root = document.body;
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent || parent.closest(SKIP) || parent.isContentEditable) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const trimmed = (node.nodeValue ?? "").trim();
    if (isTranslatableCopy(trimmed)) {
      jobs.push({ text: trimmed, apply: (next) => applyText(node, trimmed, next) });
    }
    current = walker.nextNode();
  }

  root.querySelectorAll<HTMLElement>("[placeholder],[aria-label],[alt],[title]").forEach((el) => {
    if (el.closest(SKIP)) return;
    for (const attr of ATTRS) {
      const value = el.getAttribute(attr);
      if (!value || !isTranslatableCopy(value.trim())) continue;
      const trimmed = value.trim();
      jobs.push({ text: trimmed, apply: (next) => applyAttr(el, attr, value, next) });
    }
  });

  if (isTranslatableCopy(document.title)) {
    const title = document.title;
    jobs.push({
      text: title.trim(),
      apply: (next) => {
        if (document.title === next) return;
        if (titleOriginal == null) titleOriginal = document.title;
        document.title = next;
      },
    });
  }
}

async function translateChunk(texts: string[]): Promise<string[]> {
  try {
    const res = await fetch("/api/i18n/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    if (!res.ok) return texts;
    const data = (await res.json()) as { texts?: string[] };
    return texts.map((text, i) => (typeof data.texts?.[i] === "string" ? data.texts[i] : text));
  } catch {
    return texts;
  }
}

function applyCached() {
  const jobs: Job[] = [];
  collect(jobs);
  for (const job of jobs) {
    const cached = applied.get(job.text);
    if (cached && cached !== job.text) job.apply(cached);
  }
}

async function scan() {
  const jobs: Job[] = [];
  collect(jobs);
  const pendingJobs: Job[] = [];
  const pendingTexts: string[] = [];
  const seen = new Set<string>();

  for (const job of jobs) {
    const known = sharedArabic(job.text);
    if (known !== undefined) {
      applied.set(job.text, known);
      if (known !== job.text) job.apply(known);
      continue;
    }
    const cached = applied.get(job.text);
    if (cached) {
      if (cached !== job.text) job.apply(cached);
      continue;
    }
    if (failed.has(job.text) || seen.has(job.text)) continue;
    seen.add(job.text);
    pendingJobs.push(job);
    pendingTexts.push(job.text);
  }

  if (!pendingTexts.length) return;
  const CHUNK = 40;
  for (let i = 0; i < pendingJobs.length; i += CHUNK) {
    const slice = pendingJobs.slice(i, i + CHUNK);
    const translated = await translateChunk(slice.map((job) => job.text));
    slice.forEach((job, j) => {
      const next = translated[j] ?? job.text;
      if (!next || next === job.text) {
        failed.add(job.text);
        return;
      }
      applied.set(job.text, next);
    });
    applyCached();
  }
}

function schedule() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  scan()
    .catch(() => undefined)
    .finally(() => {
      running = false;
      if (!pending) return;
      pending = false;
      schedule();
    });
}

/** Translate the visible page. Cleanup disconnects the observer and does not restore English. */
export function watchArabicDom(): () => void {
  if (typeof document === "undefined") return () => undefined;
  observer?.disconnect();
  schedule();
  observer = new MutationObserver(() => {
    if (running) {
      pending = true;
      return;
    }
    schedule();
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "aria-label", "alt", "title"],
  });
  return () => {
    observer?.disconnect();
    observer = null;
  };
}

/** Put the DOM back to the English strings captured before translation. */
export function stopArabicDom() {
  observer?.disconnect();
  observer = null;
  pending = false;
  for (const item of restores) {
    if (item.kind === "text") {
      if (item.node.isConnected) item.node.nodeValue = item.original;
    } else if (item.el.isConnected) {
      item.el.setAttribute(item.attr, item.original);
    }
  }
  restores.length = 0;
  failed.clear();
  if (titleOriginal != null) {
    document.title = titleOriginal;
    titleOriginal = null;
  }
}
