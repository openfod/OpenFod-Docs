from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCALE_DIR = ROOT / "source" / "locale" / "en" / "LC_MESSAGES"
TRANSLATIONS_PATH = Path(__file__).with_name("en.json")


def unescape(value: str) -> str:
    return (
        value.replace("\\\\", "\0")
        .replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace('\\"', '"')
        .replace("\0", "\\")
    )


def escape(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\t", "\\t")
        .replace("\n", "\\n")
    )


def format_po_string(kind: str, value: str) -> str:
    if "\n" not in value:
        return f'{kind} "{escape(value)}"\n'
    parts = value.split("\n")
    lines = [f'{kind} ""\n']
    for part in parts[:-1]:
        lines.append(f'"{escape(part)}\\n"\n')
    if parts[-1] != "":
        lines.append(f'"{escape(parts[-1])}"\n')
    return "".join(lines)


def decode_po(blob: str, kind: str) -> str:
    quoted = blob[len(kind) :].strip()
    parts = re.findall(r'"((?:\\.|[^"\\])*)"', quoted)
    return unescape("".join(parts))


def apply_file(path: Path, translations: dict[str, str]) -> tuple[int, int]:
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        r'(msgid\s+(?:"(?:\\.|[^"\\])*"(?:\s*"(?:\\.|[^"\\])*")*))\s*(msgstr\s+(?:"(?:\\.|[^"\\])*"(?:\s*"(?:\\.|[^"\\])*")*))',
        re.MULTILINE,
    )
    filled = 0
    missing = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal filled, missing
        msgid_blob, msgstr_blob = match.group(1), match.group(2)
        msgid = decode_po(msgid_blob, "msgid")
        msgstr = decode_po(msgstr_blob, "msgstr")
        if not msgid:
            return match.group(0)
        if msgid in translations:
            filled += 1
            return format_po_string("msgid", msgid) + format_po_string("msgstr", translations[msgid])
        if not msgstr:
            missing += 1
        return match.group(0)

    path.write_text(pattern.sub(repl, text), encoding="utf-8")
    return filled, missing


def main() -> int:
    translations = json.loads(TRANSLATIONS_PATH.read_text(encoding="utf-8"))
    if not LOCALE_DIR.exists():
        print(f"No locale directory at {LOCALE_DIR}; run gettext first.")
        return 0
    total_filled = 0
    total_missing = 0
    for path in sorted(LOCALE_DIR.glob("*.po")):
        filled, missing = apply_file(path, translations)
        total_filled += filled
        total_missing += missing
        print(f"{path.name}: filled {filled}, still empty {missing}")
    print(f"English catalog update done. filled={total_filled} missing={total_missing}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
