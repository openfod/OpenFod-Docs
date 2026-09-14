from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path


def env(*names: str) -> str:
    for name in names:
        value = str(os.environ.get(name) or "").strip()
        if value:
            return value
    return ""


def chat_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    return f"{normalized}/chat/completions"


def generate_faq(chunks: list[dict], language: str, base_url: str, api_key: str, model: str) -> list[dict]:
    titles = []
    seen: set[str] = set()
    for chunk in chunks:
        title = str(chunk.get("title") or "").strip()
        if not title or title in seen:
            continue
        seen.add(title)
        titles.append(title)
        if len(titles) >= 12:
            break
    if not titles:
        return []

    prompt = (
        "Create concise FAQ pairs about OpenFoD from these documentation page titles. "
        "Return JSON list of objects with keys question and answer. "
        f"Language: {'English' if language == 'en' else 'Simplified Chinese'}.\n"
        + "\n".join(f"- {title}" for title in titles)
    )
    body = json.dumps(
        {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You write documentation FAQs. Reply with JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        chat_url(base_url),
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return []
    content = str(payload.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
    if content.startswith("```"):
        content = content.strip("`")
        content = content.split("\n", 1)[-1]
        if content.endswith("```"):
            content = content[: content.rfind("```")]
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    faq = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        question = str(item.get("question") or "").strip()
        answer = str(item.get("answer") or "").strip()
        if question and answer:
            faq.append({"question": question, "answer": answer})
    return faq


def main() -> int:
    parser = argparse.ArgumentParser(description="Optionally enrich the static AI index with LLM FAQ pairs.")
    parser.add_argument("--index-dir", default="build/ai/index")
    parser.add_argument("--output-dir", default="build/ai/index")
    args = parser.parse_args()

    index_dir = Path(args.index_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    base_url = env("LLM_BASE_URL", "AI_QA_BASE_URL", "OPENAI_BASE_URL")
    api_key = env("LLM_APIKEY", "LLM_API_KEY", "AI_QA_API_KEY", "OPENAI_API_KEY")
    model = env("LLM_MODEL", "AI_QA_MODEL", "OPENAI_MODEL")

    for language in ("zh", "en"):
        chunks_path = index_dir / f"chunks_{language}.json"
        output_path = output_dir / f"faq_{language}.json"
        if not chunks_path.exists():
            continue
        chunks = json.loads(chunks_path.read_text(encoding="utf-8"))
        faq: list[dict] = []
        if base_url and api_key and model:
            faq = generate_faq(chunks, language, base_url, api_key, model)
            if faq:
                print(f"Wrote {len(faq)} FAQ pairs for {language}.")
            else:
                print(f"LLM FAQ generation skipped or failed for {language}.")
        else:
            print("LLM environment is not set; writing empty FAQ cache.")
        output_path.write_text(json.dumps(faq, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
