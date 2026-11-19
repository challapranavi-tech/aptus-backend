"""Align a corrected Arabic .docx with English page copy.

Writes .data/arabic-corrections-review.json. Accepted lines go into
AR_CORRECTIONS in frontend/locales/shared-ar.ts. Do not apply a line that
drops a brand, repeats a word, or only flips Latin order.

  python frontend/scripts/import-arabic-docx.py path/to/file.docx
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
import zipfile
from difflib import SequenceMatcher
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
ODOO = ROOT / "backend" / "content" / "odoo-json"
CACHE = FRONTEND / ".next" / "cache" / "i18n-ar.json"
REVIEW = ROOT / ".data" / "arabic-corrections-review.json"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
HEADER = re.compile(r"^(/[^\s·]*|/) · .+$")
AR_WORD = re.compile(r"[\u0600-\u06FF]+")
SKIP_KEYS = {
    "id", "type", "order", "src", "href", "url", "slug", "image", "imagesrc",
    "logosrc", "icon", "iconsrc", "poster", "video", "videosrc", "bgimage",
    "backgroundimage", "classname", "variant", "layout", "align", "theme",
    "color", "email", "phone", "tel", "whatsapp", "visible", "categories",
    "family", "gridcolumns", "anchorid", "mediainline", "imageposition",
    "number",
}

# Same list localize-page masks before translation. Longest first.
BRANDS = sorted(
    [
        "Aptus Infotech", "Aptus", "Autodesk", "AutoCAD", "Revit", "Civil 3D",
        "Navisworks", "Adobe", "Photoshop", "Illustrator", "Premiere Pro",
        "Acrobat", "Oracle", "Primavera", "Aconex", "Microsoft", "Power BI",
        "ANSYS", "ETAP", "Odoo", "Fortinet", "Sophos", "SonicWall", "Kaspersky",
        "Bluebeam", "Enscape", "SketchUp", "Sketchup", "Twinmotion", "V-Ray",
        "MATLAB", "Matlab", "Turnitin", "IBM SPSS", "Prokon", "Nitro",
        "Chaos Corona", "Luminon", "RIB CostX", "Planswift", "Cubicost",
        "SpectroNova", "InfoDrainage", "InfoWater", "InfoWorks", "Forma",
        "Forma Design Collaboration", "3ds Max", "UPS", "CCTV", "SMATV", "IPTV",
        "ELV", "ISO", "OMR", "VAT",
    ],
    key=len,
    reverse=True,
)

LOCAL = {
    "/": FRONTEND / "content" / "home.json",
    "/our-story": FRONTEND / "content" / "our-story.json",
    "/our-team": FRONTEND / "content" / "our-team.json",
    "/aptus-infotech-iso-certifications": FRONTEND / "content" / "aptus-infotech-iso-certifications.json",
    "/aptus-policy": FRONTEND / "content" / "aptus-policy.json",
    "/faq": FRONTEND / "content" / "faq.json",
    "/blog": FRONTEND / "content" / "blog.json",
    "/customer-stories": FRONTEND / "content" / "case-studies.json",
    "/software-solutions": None,  # TS sources, filled below
    "/contact-us": ODOO / "contact-us.json",
    "/careers": ODOO / "career.json",
}


def nfkc(s: str) -> str:
    return unicodedata.normalize("NFKC", s).replace("\u00a0", " ")


def repair(s: str) -> str:
    """Undo visual-order flips of Latin tokens. Arabic wording stays as written."""
    s = s.replace("Infotech Aptus", "Aptus Infotech")
    s = s.replace("LLC Intl Oryx Oriental", "Oriental Oryx Intl LLC")
    s = s.replace("Max3 ds", "3ds Max").replace("ds Max3", "3ds Max")
    s = s.replace("LT AutoCAD", "AutoCAD LT")
    s = s.replace("Build Autodesk", "Autodesk Build")
    s = s.replace("Collaboration Design Forma", "Forma Design Collaboration")
    s = s.replace("DC Pro Acrobat Adobe", "Adobe Acrobat Pro DC")
    s = s.replace("Pro Acrobat Adobe", "Adobe Acrobat Pro")
    s = s.replace("Pro Premiere Adobe", "Adobe Premiere Pro")
    s = s.replace("Photoshop Adobe", "Adobe Photoshop")
    s = s.replace("Illustrator Adobe", "Adobe Illustrator")
    s = s.replace("Aconex Oracle", "Oracle Aconex")
    s = s.replace("SPSS IBM", "IBM SPSS")
    s = s.replace("Teams Microsoft", "Microsoft Teams")
    s = s.replace("6A Cat", "Cat 6A")
    s = re.sub(r"\bD3\b", "3D", s)
    s = re.sub(r"\bD2\b", "2D", s)
    s = re.sub(r"\bK4\b", "4K", s)
    s = re.sub(r"\bK8\b", "8K", s)
    s = re.sub(
        r"([A-Za-z]+)\s*\)\s*\(\s*(\d[^)\s،,]*)",
        r"\1 (\2)",
        s,
    )
    s = re.sub(
        r"([A-Za-z][A-Za-z0-9.+-]*)\s*\)\s*\(\s*([A-Za-z][^)\s]*)",
        r"(\2 \1)",
        s,
    )
    s = s.replace(".%30", "30%.").replace("%30", "30%")
    return s


def doc_pages(path: Path) -> dict[str, str]:
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    pages: dict[str, list[str]] = {}
    cur = None
    for p in root.iter(W + "p"):
        raw = "".join(t.text or "" for t in p.iter(W + "t"))
        original = nfkc(raw).strip()
        if not original:
            continue
        pPr = p.find(W + "pPr")
        bidi = pPr is not None and pPr.find(W + "bidi") is not None
        header = original
        if not HEADER.match(header):
            flipped = " ".join(reversed(original.split()))
            if HEADER.match(flipped):
                header = flipped
        if HEADER.match(header):
            cur = header.split("·", 1)[0].strip()
            pages.setdefault(cur, [])
            continue
        if cur is None:
            continue
        body = original
        if not bidi and AR_WORD.search(original):
            body = " ".join(reversed(original.split()))
        body = repair(body)
        if body:
            pages[cur].append(body)
    return {slug: "\n".join(body) for slug, body in pages.items()}


def looks_translatable(value: str) -> bool:
    v = value.strip()
    if len(v) < 2 or not re.search(r"[A-Za-z]", v):
        return False
    if re.match(r"^https?:", v, re.I) or re.match(r"^mailto:|^tel:", v, re.I):
        return False
    if re.match(r"^/[\w\-./?#=&%]+$", v):
        return False
    if re.match(r"^[\d\s+()\-./]+$", v) or re.match(r"^#[0-9a-f]{3,8}$", v, re.I):
        return False
    return True


def collect(value, key: str | None, out: list[str]) -> None:
    if isinstance(value, str):
        if key and (key.lower() in SKIP_KEYS or key.lower().endswith(("href", "src", "url"))):
            return
        if key and ("image" in key.lower() or "icon" in key.lower()):
            return
        if looks_translatable(value):
            out.append(value.strip())
        return
    if isinstance(value, list):
        for item in value:
            collect(item, key, out)
        return
    if isinstance(value, dict):
        for k, v in value.items():
            collect(v, k, out)


def mask(text: str) -> tuple[str, list[str]]:
    tokens: list[str] = []
    for brand in BRANDS:
        if brand not in text:
            continue
        token = f"__APTUS_BRAND_{len(tokens)}__"
        tokens.append(brand)
        text = text.replace(brand, token)
    return text, tokens


def restore(text: str, tokens: list[str]) -> str:
    for i, brand in enumerate(tokens):
        text = text.replace(f"__APTUS_BRAND_{i}__", brand)
    return text


def load_cache() -> dict[str, str]:
    if not CACHE.exists():
        return {}
    data = json.loads(CACHE.read_text(encoding="utf-8"))
    return data.get("entries") or {}


def load_shared() -> dict[str, str]:
    text = (FRONTEND / "locales" / "shared-ar.ts").read_text(encoding="utf-8")
    body = text.split("const SHARED_AR", 1)[1].split("export function sharedArabic", 1)[0]
    pairs = re.findall(r'"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"', body)
    out = {}
    for en, ar in pairs:
        out[json.loads(f'"{en}"')] = json.loads(f'"{ar}"')
    return out


def current_arabic(english: str, cache: dict[str, str], shared: dict[str, str]) -> str | None:
    if english in shared:
        # Curated chrome is what copyForLocale shows. Page bodies that contain
        # a brand were machine-translated; prefer the cache when it exists.
        pass
    masked, tokens = mask(english)
    for probe in (masked, english):
        key = hashlib.sha256(f"ar\0{probe}".encode()).hexdigest()
        hit = cache.get(key)
        if isinstance(hit, str) and AR_WORD.search(hit):
            return restore(hit, tokens) if probe == masked else hit
    if english in shared and AR_WORD.search(shared[english]):
        return shared[english]
    return None


def source_for(slug: str) -> list[str]:
    strings: list[str] = []
    if slug == "/software-solutions":
        for path in (
            FRONTEND / "data" / "software-solutions-page.ts",
            FRONTEND / "components" / "software" / "SoftwareSolutionsHero.tsx",
        ):
            raw = path.read_text(encoding="utf-8")
            for m in re.finditer(r'"((?:\\.|[^"\\]){8,})"', raw):
                try:
                    s = json.loads(f'"{m.group(1)}"')
                except json.JSONDecodeError:
                    continue
                if looks_translatable(s) and " " in s:
                    strings.append(s.strip())
            for m in re.finditer(r">([^<]{12,})<", raw, re.S):
                s = re.sub(r"\s+", " ", m.group(1)).strip()
                if looks_translatable(s) and " " in s:
                    strings.append(s)
        return strings
    path = LOCAL.get(slug)
    if path is None and slug.startswith("/"):
        elv = FRONTEND / "content" / "elv" / f"{slug.strip('/')}.json"
        if elv.exists():
            path = elv
        else:
            hits = [
                p for p in ODOO.rglob(f"{slug.strip('/')}.json")
                if "overrides" not in p.parts
            ]
            path = hits[0] if hits else None
    elif slug in LOCAL:
        path = LOCAL[slug]
    if path is None or not Path(path).exists():
        return []
    collect(json.loads(Path(path).read_text(encoding="utf-8")), None, strings)
    # stable unique, keep order
    seen = set()
    out = []
    for s in strings:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


def lcs_ratio(a: list[str], b: list[str]) -> float:
    if not a or not b:
        return 0.0
    prev = [0] * (len(b) + 1)
    for x in a:
        cur = [0]
        for j, y in enumerate(b, 1):
            cur.append(prev[j - 1] + 1 if x == y else max(prev[j], cur[-1]))
        prev = cur
    return prev[-1] / max(len(a), len(b))


def find_span(current: str, blob: str, spans: list[tuple[str, int, int]]) -> tuple[float, str, int, int] | None:
    cur_words = AR_WORD.findall(current)
    if len(cur_words) < 3:
        return None
    doc_words = [w for w, _, _ in spans]
    anchors = sorted(set(cur_words), key=len, reverse=True)[:3]
    positions: list[int] = []
    for anchor in anchors:
        positions.extend(i for i, w in enumerate(doc_words) if w == anchor)
    if not positions:
        return None
    best: tuple[float, int, int] | None = None
    second = 0.0
    n = len(cur_words)
    # Short headings: one changed word still has to match this page only.
    short = n <= 6
    lengths = [n] if short else range(max(4, n - 2), n + 3)
    threshold = 0.66 if short else 0.82
    seen_windows: set[tuple[int, int]] = set()
    for pos in positions:
        for length in lengths:
            for start in range(max(0, pos - length + 1), pos + 1):
                end = start + length
                if end > len(doc_words) or (start, end) in seen_windows:
                    continue
                seen_windows.add((start, end))
                c0, c1 = spans[start][1], spans[end - 1][2]
                if "\n" in blob[c0:c1]:
                    continue
                sc = lcs_ratio(cur_words, doc_words[start:end])
                length_delta = abs(length - n)
                better = best is None or sc > best[0] + 1e-9 or (
                    abs(sc - best[0]) < 1e-9 and length_delta < abs((best[2] - best[1]) - n)
                )
                if better:
                    if best is not None and sc > best[0] + 1e-9:
                        second = max(second, best[0])
                    best = (sc, start, end)
                elif sc > second:
                    second = sc
    if best is None:
        return None
    score, start, end = best
    if score < threshold:
        return None
    if short and second > 0 and score - second < 0.08:
        return None
    char_start = spans[start][1]
    char_end = spans[end - 1][2]
    # A short label must be its own line. Otherwise a 3-word window
    # clips the start of a longer sentence.
    if short:
        line_start = blob.rfind("\n", 0, char_start) + 1
        line_end = blob.find("\n", char_end)
        if line_end < 0:
            line_end = len(blob)
        if len(AR_WORD.findall(blob[line_start:line_end])) > n + 1:
            return None
    prefix = ""
    lo = char_start
    while lo > 0 and blob[lo - 1] not in "\n" and not AR_WORD.match(blob[lo - 1]):
        lo -= 1
    raw_prefix = blob[lo:char_start].strip()
    if raw_prefix and (raw_prefix in current or re.fullmatch(r"\+\d+", raw_prefix)):
        prefix = raw_prefix + " "
    suffix = ""
    hi = char_end
    while hi < len(blob) and blob[hi] not in "\n" and not AR_WORD.match(blob[hi]):
        hi += 1
    raw_suffix = blob[char_end:hi].strip()
    if raw_suffix and (raw_suffix in current or re.fullmatch(r"[.!?؟،…]+", raw_suffix)):
        suffix = raw_suffix
    text = re.sub(r"\s+", " ", prefix + blob[char_start:char_end] + suffix).strip()
    if not text or AR_WORD.search(text) is None:
        return None
    return score, text, char_start, char_end


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", repair(s)).strip()


def main() -> None:
    doc_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "هه.docx"
    pages = doc_pages(doc_path)
    cache = load_cache()
    shared = load_shared()
    corrections: dict[str, str] = {}
    review = []
    conflicts = []
    for slug, blob in pages.items():
        english = source_for(slug)
        spans = [(m.group(), m.start(), m.end()) for m in AR_WORD.finditer(blob)]
        hits = []
        for en in english:
            cur = current_arabic(en, cache, shared)
            if not cur:
                continue
            found = find_span(cur, blob, spans)
            if not found:
                continue
            score, proposed, c0, c1 = found
            if norm(proposed) == norm(cur):
                continue
            if AR_WORD.findall(proposed) == AR_WORD.findall(cur):
                continue
            if len(proposed) < len(cur) * 0.55 or len(proposed) > len(cur) * 1.7:
                continue
            if "Infotech Aptus" in proposed or re.search(r"\bD[23]\b", proposed) or '"' in proposed:
                continue
            proposed_words = AR_WORD.findall(proposed)
            cur_words = AR_WORD.findall(cur)

            def stutter(words: list[str]) -> bool:
                for i in range(len(words) - 1):
                    a, b = words[i], words[i + 1]
                    if len(a) > 3 and (a == b or b == "و" + a or a == "و" + b):
                        return True
                return False

            if stutter(proposed_words) and not stutter(cur_words):
                continue
            # A correction that drops a Latin token clipped a brand or a number.
            cur_latin = re.findall(r"[A-Za-z][A-Za-z0-9.+-]{2,}", cur)
            if any(token not in proposed for token in cur_latin):
                continue
            hits.append({"en": en, "cur": cur, "proposed": proposed, "score": score, "c0": c0, "c1": c1})
        # One document span belongs to the English string it matches best.
        hits.sort(key=lambda h: -h["score"])
        claimed: list[tuple[int, int]] = []
        used = 0
        for hit in hits:
            if any(not (hit["c1"] <= a or hit["c0"] >= b) for a, b in claimed):
                continue
            claimed.append((hit["c0"], hit["c1"]))
            en, proposed, cur, score = hit["en"], hit["proposed"], hit["cur"], hit["score"]
            prev = corrections.get(en)
            if prev is not None and norm(prev) != norm(proposed):
                conflicts.append({"en": en, "a": prev, "b": proposed, "slug": slug})
                continue
            corrections[en] = proposed
            used += 1
            review.append({
                "slug": slug,
                "score": round(score, 3),
                "en": en,
                "from": cur,
                "to": proposed,
            })
        print(f"{slug:48} src={len(english):4} corrections={used}")
    print("TOTAL", len(corrections), "conflicts", len(conflicts))
    REVIEW.write_text(json.dumps({"review": review, "conflicts": conflicts}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("review", REVIEW)


if __name__ == "__main__":
    main()
