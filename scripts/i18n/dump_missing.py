from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_en import decode_po  # noqa: E402

PATTERN = re.compile(
    r'(msgid\s+(?:"(?:\\.|[^"\\])*"(?:\s*"(?:\\.|[^"\\])*")*))\s*(msgstr\s+(?:"(?:\\.|[^"\\])*"(?:\s*"(?:\\.|[^"\\])*")*))',
    re.MULTILINE,
)
root = Path(__file__).resolve().parents[2] / "source" / "locale" / "en" / "LC_MESSAGES"
for path in sorted(root.glob("*.po")):
    text = path.read_text(encoding="utf-8")
    for match in PATTERN.finditer(text):
        msgid = decode_po(match.group(1), "msgid")
        msgstr = decode_po(match.group(2), "msgstr")
        if msgid and not msgstr.strip():
            print(f"FILE {path.name}")
            print(msgid)
            print("---")
