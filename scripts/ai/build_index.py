from __future__ import annotations

import argparse
import hashlib
import html
import json
import math
import re
import shutil
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


VECTOR_SIZE = 384
MAX_CHUNK_CHARS = 1200
MIN_BLOCK_CHARS = 8


@dataclass
class TextBlock:
    text: str
    section: str
    anchor: str


@dataclass
class ParsedPage:
    title: str
    blocks: list[TextBlock] = field(default_factory=list)


class ArticleParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_article = False
        self.article_depth = 0
        self.in_title = False
        self.title_parts: list[str] = []
        self.current_section = ""
        self.current_anchor = ""
        self.section_stack: list[str] = []
        self.heading_tag = ""
        self.heading_parts: list[str] = []
        self.block_tag = ""
        self.block_parts: list[str] = []
        self.blocks: list[TextBlock] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        classes = set((attributes.get("class") or "").split())
        if tag == "article" and "ps-article" in classes:
            self.in_article = True
            self.article_depth = 1
            return
        if self.in_article:
            self.article_depth += 1
            if tag == "section":
                self.section_stack.append(attributes.get("id") or self.current_anchor)
            if tag in {"h1", "h2", "h3", "h4"}:
                self.heading_tag = tag
                self.heading_parts = []
            if tag in {"p", "li", "pre", "td", "th"} and not self.block_tag:
                self.block_tag = tag
                self.block_parts = []
        if tag == "title":
            self.in_title = True
            self.title_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        if not self.in_article:
            return
        if self.heading_tag and tag == self.heading_tag:
            heading = normalize_text(" ".join(self.heading_parts).replace("¶", ""))
            if heading:
                self.current_section = heading
                self.current_anchor = self.section_stack[-1] if self.section_stack else ""
            self.heading_tag = ""
            self.heading_parts = []
        if self.block_tag and tag == self.block_tag:
            text = normalize_text(" ".join(self.block_parts))
            if len(text) >= MIN_BLOCK_CHARS:
                self.blocks.append(TextBlock(text=text, section=self.current_section, anchor=self.current_anchor))
            self.block_tag = ""
            self.block_parts = []
        if tag == "section" and self.section_stack:
            self.section_stack.pop()
        self.article_depth -= 1
        if self.article_depth <= 0:
            self.in_article = False
            self.article_depth = 0

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if not self.in_article:
            return
        if self.heading_tag:
            self.heading_parts.append(data)
        if self.block_tag:
            self.block_parts.append(data)

    def parsed_page(self) -> ParsedPage:
        title = normalize_text(" ".join(self.title_parts)) or "Untitled"
        return ParsedPage(title=title, blocks=self.blocks)


def normalize_text(value: str) -> str:
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def tokenize(value: str) -> list[str]:
    lowered = value.lower()
    tokens: list[str] = []
    for match in re.finditer(r"[a-z0-9_]+|[\u4e00-\u9fff]+", lowered, flags=re.UNICODE):
        fragment = match.group(0)
        if re.fullmatch(r"[\u4e00-\u9fff]+", fragment):
            tokens.extend(fragment)
            tokens.extend(fragment[index:index + 2] for index in range(max(len(fragment) - 1, 0)))
        else:
            tokens.append(fragment)
    return tokens


def embedding_for_text(value: str) -> list[float]:
    vector = [0.0] * VECTOR_SIZE
    for token in tokenize(value):
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % VECTOR_SIZE
        vector[index] += 1.0
    norm = math.sqrt(sum(component * component for component in vector)) or 1.0
    return [round(component / norm, 6) for component in vector]


def page_url(language: str, html_root: Path, html_file: Path, anchor: str) -> str:
    relative_path = html_file.relative_to(html_root).as_posix()
    url = f"/{language}/{relative_path}"
    if anchor:
        url = f"{url}#{anchor}"
    return url


def parse_page(html_file: Path) -> ParsedPage:
    parser = ArticleParser()
    parser.feed(html_file.read_text(encoding="utf-8", errors="ignore"))
    return parser.parsed_page()


def build_chunks(language: str, html_root: Path) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    for html_file in sorted(html_root.rglob("*.html")):
        if html_file.name in {"search.html", "genindex.html"}:
            continue
        page = parse_page(html_file)
        pending_blocks: list[TextBlock] = []
        pending_length = 0

        def flush() -> None:
            nonlocal pending_blocks, pending_length
            if not pending_blocks:
                return
            content = "\n".join(block.text for block in pending_blocks)
            first_block = pending_blocks[0]
            chunk_id = hashlib.sha1(f"{language}:{html_file}:{len(chunks)}".encode("utf-8")).hexdigest()
            chunks.append({
                "id": chunk_id,
                "language": language,
                "title": page.title,
                "section": first_block.section or page.title,
                "source_path": html_file.relative_to(html_root).as_posix(),
                "docs_url": page_url(language, html_root, html_file, first_block.anchor),
                "anchor": first_block.anchor,
                "content": content,
                "embedding": embedding_for_text(f"{page.title}\n{first_block.section}\n{content}"),
            })
            pending_blocks = []
            pending_length = 0

        for block in page.blocks:
            block_length = len(block.text)
            if pending_blocks and pending_length + block_length > MAX_CHUNK_CHARS:
                flush()
            pending_blocks.append(block)
            pending_length += block_length
        flush()
    return chunks


def write_json_index(output_dir: Path, by_language: dict[str, list[dict[str, Any]]]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"languages": {}, "vector_size": VECTOR_SIZE}
    for language, chunks in by_language.items():
        manifest["languages"][language] = {"chunks": len(chunks), "collection": f"docs_{language}"}
        (output_dir / f"chunks_{language}.json").write_text(
            json.dumps(chunks, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def write_chromadb(chroma_dir: Path, by_language: dict[str, list[dict[str, Any]]]) -> None:
    try:
        import chromadb  # type: ignore[import-not-found]
    except ImportError:
        print("ChromaDB is not installed; JSON AI search index was generated only.")
        return

    if chroma_dir.exists():
        shutil.rmtree(chroma_dir)
    chroma_dir.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(chroma_dir))
    for language, chunks in by_language.items():
        collection = client.get_or_create_collection(name=f"docs_{language}")
        if not chunks:
            continue
        collection.add(
            ids=[chunk["id"] for chunk in chunks],
            documents=[chunk["content"] for chunk in chunks],
            embeddings=[chunk["embedding"] for chunk in chunks],
            metadatas=[{
                "language": chunk["language"],
                "title": chunk["title"],
                "section": chunk["section"],
                "source_path": chunk["source_path"],
                "docs_url": chunk["docs_url"],
                "anchor": chunk["anchor"],
            } for chunk in chunks],
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Build AI search chunks for OpenFoD docs.")
    parser.add_argument("--html-dir", default="build/html", help="Directory containing zh/ and en/ HTML outputs.")
    parser.add_argument("--output-dir", default="build/ai/index", help="Directory for JSON AI search index.")
    parser.add_argument("--chroma-dir", default="build/ai/chroma", help="Directory for ChromaDB persistent data.")
    args = parser.parse_args()

    html_dir = Path(args.html_dir)
    by_language: dict[str, list[dict[str, Any]]] = {}
    for language in ("zh", "en"):
        language_root = html_dir / language
        if not language_root.exists():
            raise SystemExit(f"Missing HTML output for language: {language_root}")
        by_language[language] = build_chunks(language, language_root)

    write_json_index(Path(args.output_dir), by_language)
    write_chromadb(Path(args.chroma_dir), by_language)
    total_chunks = sum(len(chunks) for chunks in by_language.values())
    print(f"Built AI search index with {total_chunks} chunks.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())