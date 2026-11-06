"""Builds the Project Structure section of README.md and the data for
docs/structure.html from one list, so the two can never disagree.

Run it from the project root:  python scripts/gen_structure.py
Check without writing:         python scripts/gen_structure.py --check
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"
PAGE_DATA = ROOT / "docs" / "js" / "structure-data.js"
PAGE_URL = "https://q9kawaii.github.io/pdf-study-assistant/structure.html"
START = "<!-- structure:start -->"
END = "<!-- structure:end -->"
ALL_STEPS = "All steps"

CATEGORIES = {
    "backend": {"label": "Backend", "color": "#52e8d4"},
    "frontend": {"label": "Frontend", "color": "#a899ff"},
    "config": {"label": "Config", "color": "#ffc266"},
    "deploy": {"label": "Deploy", "color": "#ff9dc8"},
    "docs": {"label": "Docs", "color": "#a4e88a"},
}

STEPS = ["upload", "extract", "OCR", "chunk", "embed", "retrieve", "answer", "grade", "safety", "deploy"]

# path: (category, pipeline step, role, why it exists). A path ending in "/" is a folder.
FILES = {
    "docs/": ("frontend", ALL_STEPS,
        "The website, published by GitHub Pages.",
        "GitHub Pages can host this folder for free, and it needs no build step."),
    "docs/css/": ("frontend", ALL_STEPS,
        "The styles for every page.",
        "Keeping the looks apart from the page content makes both easier to change."),
    "docs/js/": ("frontend", ALL_STEPS,
        "The code that runs in the browser.",
        "Small files with one job each are easy to read and explain."),
    "scripts/": ("docs", ALL_STEPS,
        "Helper scripts for working on the project.",
        "These tools help the people building the project, so they stay apart from the app."),
    "tests/": ("backend", ALL_STEPS,
        "Automatic checks for the backend.",
        "They catch mistakes early, and they use a fake AI, so they spend no quota."),

    ".env.example": ("config", "deploy",
        "A template listing the settings the app needs, with a placeholder value.",
        "It shows new developers what to set up, without sharing a real key."),
    ".gitignore": ("config", "safety",
        "Lists the files git must never save, such as secrets and caches.",
        "It stops private or throwaway files from reaching the public repo."),
    "README.md": ("docs", ALL_STEPS,
        "The front page of the repo on GitHub.",
        "It tells visitors what the project is and how to run it."),
    "ai_client.py": ("backend", ALL_STEPS,
        "Creates the one Gemini connection the whole app shares.",
        "The API key is read in a single place, so it never gets copied around the code."),
    "answering.py": ("backend", "answer",
        "Asks Gemini to answer using only the chosen chunks.",
        "This is what stops made-up answers: it holds the rules, the prompt injection defense and the Not found reply."),
    "chunker.py": ("backend", "chunk",
        "Cuts each page into small overlapping chunks and keeps the page number.",
        "Small chunks make search exact, and the page number makes citations possible."),
    "config.py": ("config", ALL_STEPS,
        "Holds every setting and limit in one place.",
        "Changing a model name or a limit means editing one line, not hunting through the code."),
    "embeddings.py": ("backend", "embed",
        "Turns chunks and questions into vectors with Gemini.",
        "Search needs numbers. It also waits and retries when the free per-minute limit is hit."),
    "grading.py": ("backend", "grade",
        "Scores a written quiz answer out of 10 with short feedback.",
        "Written answers can't be marked by simple matching, so the AI compares them with a reference answer."),
    "main.py": ("backend", ALL_STEPS,
        "The API: it receives requests and connects every pipeline step.",
        "It's the front door of the backend, with the upload, ask, grade and health endpoints, CORS and friendly errors."),
    "ocr.py": ("backend", "OCR",
        "Reads pages that are pictures of text, using Gemini vision.",
        "Scanned pages hold no real text. It reads them in a few parallel calls, so it stays fast and within quota."),
    "pdf_reader.py": ("backend", "extract",
        "Pulls text from each page and spots pages that need OCR.",
        "It's the first step of the pipeline, and it rejects bad files with a clear message."),
    "rate_limits.py": ("backend", "safety",
        "Limits requests per person and caps total daily AI use.",
        "The free quota is small, so one visitor must not be able to use it all."),
    "render.yaml": ("deploy", "deploy",
        "Tells Render how to build and start the backend.",
        "Keeping the setup in a file makes deploys repeatable, and the API key value stays out of git."),
    "requirements.txt": ("deploy", "deploy",
        "Lists the exact Python packages the backend needs.",
        "Pinned versions mean a laptop and the server run the same code."),
    "retrieval.py": ("backend", "retrieve",
        "Scores every chunk with cosine similarity and picks the top ones.",
        "This is the search itself, written by hand with numpy, so every line can be explained."),
    "sessions.py": ("backend", "retrieve",
        "Keeps each upload's chunks and vectors in memory.",
        "It does the job of a vector database, which one small PDF doesn't need."),

    "docs/index.html": ("frontend", "upload",
        "The main page, where people upload a PDF and ask questions.",
        "It holds the layout, and the scripts bring it to life."),
    "docs/documentation.html": ("docs", ALL_STEPS,
        "A beginner's guide to how the project works, with a quiz.",
        "It explains each idea in simple words, so anyone can learn RAG from it."),
    "docs/structure.html": ("docs", ALL_STEPS,
        "This page: an interactive map of the project's files.",
        "It helps a new reader see what each file does before opening the code."),
    "docs/css/app.css": ("frontend", ALL_STEPS,
        "Styles for the main page, such as the hero and the chat.",
        "Only the main page needs them, so other pages don't load them."),
    "docs/css/base.css": ("frontend", ALL_STEPS,
        "Shared styles: colours, background, nav, buttons, footer and loader.",
        "Every page uses these, so the whole site keeps one look."),
    "docs/css/docs.css": ("frontend", ALL_STEPS,
        "Styles for the documentation page and its quiz.",
        "Long reading pages need a different layout from the app."),
    "docs/css/structure.css": ("frontend", ALL_STEPS,
        "Styles for the file tree and detail panel on this page.",
        "Only this page needs them, so other pages don't load them."),
    "docs/css/xray.css": ("frontend", ALL_STEPS,
        "Styles for the X-ray panel and the upload page map.",
        "These visuals have many small parts, so they get their own file."),
    "docs/js/api.js": ("frontend", ALL_STEPS,
        "Sends requests to the backend and wakes it if it's asleep.",
        "One shared helper gives every page the same timeouts and friendly errors."),
    "docs/js/app.js": ("frontend", "upload",
        "Runs the main page: upload, questions, answers and sources.",
        "It connects the buttons on the page to the backend."),
    "docs/js/background.js": ("frontend", ALL_STEPS,
        "Draws the moving particle background.",
        "It gives the site its motion-graphics feel, and it pauses when the tab is hidden."),
    "docs/js/config.js": ("config", "deploy",
        "Chooses the backend address, local or live.",
        "The same site can then work on a laptop and on GitHub Pages."),
    "docs/js/icons.js": ("frontend", ALL_STEPS,
        "Holds the shared icons and small page-building helpers.",
        "Pages reuse one icon set, and its text helper keeps PDF text from running as code."),
    "docs/js/loader.js": ("frontend", ALL_STEPS,
        "Shows the loading card with a looping pipeline diagram.",
        "People see that work is happening while the server wakes or the AI thinks."),
    "docs/js/motion.js": ("frontend", ALL_STEPS,
        "Adds the scroll reveals and the word-by-word headings.",
        "It adds movement while keeping all the text readable if it fails."),
    "docs/js/pagemap.js": ("frontend", "upload",
        "Draws page thumbnails and totals after an upload.",
        "It shows what the server really built, so nobody has to read a report."),
    "docs/js/quiz.js": ("frontend", "grade",
        "Runs the quiz: marks choices and sends written answers for grading.",
        "It lets readers test what they learned and see a final score."),
    "docs/js/structure-data.js": ("docs", ALL_STEPS,
        "The file list for this page, written by the generator script.",
        "It comes from the same source as the README, so the two always match."),
    "docs/js/structure.js": ("frontend", ALL_STEPS,
        "Draws the expandable tree and the detail panel on this page.",
        "It turns the plain file list into something you can explore."),
    "docs/js/xray-cards.js": ("frontend", "answer",
        "Draws the top 3 cards with score rings, and the answer stamp.",
        "The last X-ray stages can be seen at a glance, without much reading."),
    "docs/js/xray-radar.js": ("frontend", "retrieve",
        "Draws the similarity radar and the page heat map.",
        "It turns real scores into a picture of how close each chunk is."),
    "docs/js/xray.js": ("frontend", "retrieve",
        "Replays each question step by step in the X-ray panel.",
        "It shows how RAG really worked for that question, using real data."),

    "scripts/gen_structure.py": ("docs", ALL_STEPS,
        "Builds the README section and this page's data from one list.",
        "With one source, the README and the site can't drift apart."),
    "tests/__init__.py": ("backend", ALL_STEPS,
        "An empty file that marks this folder as a Python package.",
        "Python needs it so tests can import from each other."),
    "tests/test_api.py": ("backend", "safety",
        "Tests the endpoints, limits, citations and CORS.",
        "It proves the safety rules really work, with a fake AI."),
    "tests/test_chunker.py": ("backend", "chunk",
        "Tests chunk size, overlap and page numbers.",
        "Citations depend on chunking being right."),
    "tests/test_embeddings.py": ("backend", "embed",
        "Tests batching and waiting on the rate limit.",
        "It proves long uploads survive the free per-minute limit."),
    "tests/test_ocr.py": ("backend", "OCR",
        "Tests page groups, page markers and retries.",
        "It proves skipped pages are never counted as a success."),
    "tests/test_pdf_reader.py": ("backend", "extract",
        "Tests rejected files and finding pages that need OCR.",
        "Bad uploads must fail with a clear message."),
    "tests/test_retrieval.py": ("backend", "retrieve",
        "Checks cosine similarity against known answers.",
        "The search math has to be exactly right."),
    "tests/test_structure.py": ("docs", ALL_STEPS,
        "Checks that the README and this page are up to date.",
        "A new file with no description fails the tests, so nothing gets left out."),
}


def repo_files() -> list[str]:
    """List the repo's real files. Anything in .gitignore is left out."""
    output = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout
    # A file deleted from disk can still be listed by git, so we check it exists.
    return sorted(path for path in output.splitlines() if (ROOT / path).exists())


def repo_folders(files: list[str]) -> list[str]:
    """List every folder that holds a file, like "docs/js/"."""
    folders = set()
    for path in files:
        parts = path.split("/")[:-1]
        for depth in range(1, len(parts) + 1):
            folders.add("/".join(parts[:depth]) + "/")
    return sorted(folders)


def check_descriptions(paths: list[str]) -> None:
    """Stop if a real file has no description, or a description has no file."""
    missing = sorted(set(paths) - set(FILES))
    invented = sorted(set(FILES) - set(paths))
    if missing or invented:
        raise SystemExit(f"Not described: {missing}. Described but not real: {invented}.")


def build_tree(paths: list[str]) -> dict:
    """Turn flat paths into nested folders, with folders listed before files."""
    root = {"name": "pdf-study-assistant", "path": "", "folder": True, "children": {}}
    for path in paths:
        node = root
        parts = path.rstrip("/").split("/")
        for depth, part in enumerate(parts, start=1):
            is_folder = depth < len(parts) or path.endswith("/")
            key = "/".join(parts[:depth]) + ("/" if is_folder else "")
            node = node["children"].setdefault(
                part, {"name": part, "path": key, "folder": is_folder, "children": {}}
            )

    def finish(node):
        children = sorted(
            node["children"].values(), key=lambda child: (not child["folder"], child["name"].lower())
        )
        node["children"] = [finish(child) for child in children]
        if node["path"]:
            category, step, role, why = FILES[node["path"]]
            node.update(category=category, step=step, role=role, why=why)
        return node

    return finish(root)


def draw_tree(node: dict, prefix: str = "") -> list[str]:
    """Draw the tree as text, for the README."""
    lines = []
    for index, child in enumerate(node["children"]):
        last = index == len(node["children"]) - 1
        name = child["name"] + ("/" if child["folder"] else "")
        lines.append(f"{prefix}{'└── ' if last else '├── '}{name}")
        lines += draw_tree(child, prefix + ("    " if last else "│   "))
    return lines


def flatten(node: dict) -> list[dict]:
    """List every file and folder in the same order as the tree."""
    rows = []
    for child in node["children"]:
        rows.append(child)
        rows += flatten(child)
    return rows


def readme_section(tree: dict) -> str:
    rows = [
        f"| `{row['path']}` | {row['role']} | {row['step']} |"
        for row in flatten(tree)
    ]
    return "\n".join(
        [
            START,
            "## Project Structure",
            "",
            f"Explore this as an interactive map on the [structure page]({PAGE_URL}).",
            "",
            "```",
            f"{tree['name']}/",
            *draw_tree(tree),
            "```",
            "",
            "| File | Role | Pipeline step |",
            "| --- | --- | --- |",
            *rows,
            END,
        ]
    )


def page_data(tree: dict) -> str:
    data = {"categories": CATEGORIES, "steps": STEPS, "allSteps": ALL_STEPS, "tree": tree}
    body = json.dumps(data, indent=2, ensure_ascii=False)
    return f"// Written by scripts/gen_structure.py. Don't edit this by hand.\nconst STRUCTURE = {body};\n"


def read(path: Path) -> str:
    """Read a file with the same line endings on every computer."""
    return path.read_text(encoding="utf-8").replace("\r\n", "\n") if path.exists() else ""


def new_readme(section: str) -> str:
    text = read(README)
    before, _, rest = text.partition(START)
    _, _, after = rest.partition(END)
    return before + section + after


def outputs() -> dict[Path, str]:
    """Work out what both generated files should contain."""
    files = repo_files()
    paths = files + repo_folders(files)
    check_descriptions(paths)
    tree = build_tree(paths)
    return {README: new_readme(readme_section(tree)), PAGE_DATA: page_data(tree)}


def out_of_date() -> list[str]:
    """Name any generated file that doesn't match the list above."""
    return [path.name for path, text in outputs().items() if read(path) != text]


def main() -> None:
    if "--check" in sys.argv:
        stale = out_of_date()
        if stale:
            raise SystemExit(f"Out of date: {stale}. Run: python scripts/gen_structure.py")
        print("Structure is up to date.")
        return
    for path, text in outputs().items():
        path.write_text(text, encoding="utf-8", newline="\n")
        print(f"Wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
