from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_en import decode_po

PATTERN = re.compile(
    r'(msgid\s+(?:"(?:\\.|[^"\\])*"(?:\s*"(?:\\.|[^"\\])*")*))\s*(msgstr\s+(?:"(?:\\.|[^"\\])*"(?:\s*"(?:\\.|[^"\\])*")*))',
    re.MULTILINE,
)
OVERRIDES = {
    "治安": "Public order",
    "祭祀": "Rites",
    "政务": "Administration",
    "科技": "Technology",
    "《傲世三国》 / Fate of the Dragon": "Fate of the Dragon / 傲世三国",
    "``architecture.py`` + 预算表": "``architecture.py`` + size budget",
    "``Res/res00.dll`` 等": "``Res/res00.dll`` and siblings",
    "``Res/Bei*.lib`` 等": "``Res/Bei*.lib`` and siblings",
    "关卡 ``.TSK`` + ``.int`` + ``.dmo``": "Scenario ``.TSK`` + ``.int`` + ``.dmo``",
}

root = Path(__file__).resolve().parents[2]
catalog = json.loads((root / "scripts" / "i18n" / "en.json").read_text(encoding="utf-8"))
added = 0
for path in sorted((root / "source" / "locale" / "en" / "LC_MESSAGES").glob("*.po")):
    text = path.read_text(encoding="utf-8")
    for match in PATTERN.finditer(text):
        msgid = decode_po(match.group(1), "msgid")
        msgstr = decode_po(match.group(2), "msgstr")
        if not msgid or msgstr.strip() or msgid in catalog:
            continue
        catalog[msgid] = OVERRIDES.get(msgid, msgid)
        added += 1
(root / "scripts" / "i18n" / "en.json").write_text(
    json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"added {added} missing keys")
