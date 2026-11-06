# PDF Study Assistant

Upload a PDF and ask questions about it. Answers come only from your document,
with page numbers. A RAG X-ray panel shows every step, using real data.

**Live demo:** https://q9kawaii.github.io/pdf-study-assistant/

<!-- structure:start -->
## Project Structure

Explore this as an interactive map on the [structure page](https://q9kawaii.github.io/pdf-study-assistant/structure.html).

```
pdf-study-assistant/
├── docs/
│   ├── css/
│   │   ├── app.css
│   │   ├── base.css
│   │   ├── docs.css
│   │   ├── structure.css
│   │   └── xray.css
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── background.js
│   │   ├── config.js
│   │   ├── icons.js
│   │   ├── loader.js
│   │   ├── motion.js
│   │   ├── pagemap.js
│   │   ├── quiz.js
│   │   ├── structure-data.js
│   │   ├── structure.js
│   │   ├── xray-cards.js
│   │   ├── xray-radar.js
│   │   └── xray.js
│   ├── documentation.html
│   ├── index.html
│   └── structure.html
├── scripts/
│   └── gen_structure.py
├── tests/
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_chunker.py
│   ├── test_embeddings.py
│   ├── test_ocr.py
│   ├── test_pdf_reader.py
│   ├── test_retrieval.py
│   └── test_structure.py
├── .env.example
├── .gitignore
├── ai_client.py
├── answering.py
├── chunker.py
├── config.py
├── embeddings.py
├── grading.py
├── main.py
├── ocr.py
├── pdf_reader.py
├── rate_limits.py
├── README.md
├── render.yaml
├── requirements.txt
├── retrieval.py
└── sessions.py
```

| File | Role | Pipeline step |
| --- | --- | --- |
| `docs/` | The website, published by GitHub Pages. | All steps |
| `docs/css/` | The styles for every page. | All steps |
| `docs/css/app.css` | Styles for the main page, such as the hero and the chat. | All steps |
| `docs/css/base.css` | Shared styles: colours, background, nav, buttons, footer and loader. | All steps |
| `docs/css/docs.css` | Styles for the documentation page and its quiz. | All steps |
| `docs/css/structure.css` | Styles for the file tree and detail panel on this page. | All steps |
| `docs/css/xray.css` | Styles for the X-ray panel and the upload page map. | All steps |
| `docs/js/` | The code that runs in the browser. | All steps |
| `docs/js/api.js` | Sends requests to the backend and wakes it if it's asleep. | All steps |
| `docs/js/app.js` | Runs the main page: upload, questions, answers and sources. | upload |
| `docs/js/background.js` | Draws the moving particle background. | All steps |
| `docs/js/config.js` | Chooses the backend address, local or live. | deploy |
| `docs/js/icons.js` | Holds the shared icons and small page-building helpers. | All steps |
| `docs/js/loader.js` | Shows the loading card with a looping pipeline diagram. | All steps |
| `docs/js/motion.js` | Adds the scroll reveals and the word-by-word headings. | All steps |
| `docs/js/pagemap.js` | Draws page thumbnails and totals after an upload. | upload |
| `docs/js/quiz.js` | Runs the quiz: marks choices and sends written answers for grading. | grade |
| `docs/js/structure-data.js` | The file list for this page, written by the generator script. | All steps |
| `docs/js/structure.js` | Draws the expandable tree and the detail panel on this page. | All steps |
| `docs/js/xray-cards.js` | Draws the top 3 cards with score rings, and the answer stamp. | answer |
| `docs/js/xray-radar.js` | Draws the similarity radar and the page heat map. | retrieve |
| `docs/js/xray.js` | Replays each question step by step in the X-ray panel. | retrieve |
| `docs/documentation.html` | A beginner's guide to how the project works, with a quiz. | All steps |
| `docs/index.html` | The main page, where people upload a PDF and ask questions. | upload |
| `docs/structure.html` | This page: an interactive map of the project's files. | All steps |
| `scripts/` | Helper scripts for working on the project. | All steps |
| `scripts/gen_structure.py` | Builds the README section and this page's data from one list. | All steps |
| `tests/` | Automatic checks for the backend. | All steps |
| `tests/__init__.py` | An empty file that marks this folder as a Python package. | All steps |
| `tests/test_api.py` | Tests the endpoints, limits, citations and CORS. | safety |
| `tests/test_chunker.py` | Tests chunk size, overlap and page numbers. | chunk |
| `tests/test_embeddings.py` | Tests batching and waiting on the rate limit. | embed |
| `tests/test_ocr.py` | Tests page groups, page markers and retries. | OCR |
| `tests/test_pdf_reader.py` | Tests rejected files and finding pages that need OCR. | extract |
| `tests/test_retrieval.py` | Checks cosine similarity against known answers. | retrieve |
| `tests/test_structure.py` | Checks that the README and this page are up to date. | All steps |
| `.env.example` | A template listing the settings the app needs, with a placeholder value. | deploy |
| `.gitignore` | Lists the files git must never save, such as secrets and caches. | safety |
| `ai_client.py` | Creates the one Gemini connection the whole app shares. | All steps |
| `answering.py` | Asks Gemini to answer using only the chosen chunks. | answer |
| `chunker.py` | Cuts each page into small overlapping chunks and keeps the page number. | chunk |
| `config.py` | Holds every setting and limit in one place. | All steps |
| `embeddings.py` | Turns chunks and questions into vectors with Gemini. | embed |
| `grading.py` | Scores a written quiz answer out of 10 with short feedback. | grade |
| `main.py` | The API: it receives requests and connects every pipeline step. | All steps |
| `ocr.py` | Reads pages that are pictures of text, using Gemini vision. | OCR |
| `pdf_reader.py` | Pulls text from each page and spots pages that need OCR. | extract |
| `rate_limits.py` | Limits requests per person and caps total daily AI use. | safety |
| `README.md` | The front page of the repo on GitHub. | All steps |
| `render.yaml` | Tells Render how to build and start the backend. | deploy |
| `requirements.txt` | Lists the exact Python packages the backend needs. | deploy |
| `retrieval.py` | Scores every chunk with cosine similarity and picks the top ones. | retrieve |
| `sessions.py` | Keeps each upload's chunks and vectors in memory. | retrieve |
<!-- structure:end -->

RAG is written by hand with numpy: no LangChain and no vector database.

## How it works

1. Extract the text of each page with pypdf. Scanned pages are read by Gemini
   vision (OCR), all at the same time.
2. Cut it into chunks of about 500 characters, with 100 characters of overlap.
3. Embed the chunks with Gemini, in batches.
4. Embed the question, then score every chunk with cosine similarity.
5. Send only the top 3 chunks to Gemini, which must answer from them or reply
   "Not found in your document".

Read the [beginner's guide](https://q9kawaii.github.io/pdf-study-assistant/documentation.html)
for the full explanation, and a quiz.

## Run it locally

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Put your Gemini API key in `.env`, then start the backend and the frontend:

```
uvicorn main:app --reload
python -m http.server 5500 --directory docs
```

Open http://localhost:5500.

## Tests

```
python -m unittest
```

The tests use a fake Gemini client, so they spend no quota.

## API

| Endpoint | What it does |
| --- | --- |
| `POST /upload` | Builds an index from a PDF |
| `POST /ask` | Returns an answer, its sources, and X-ray data |
| `POST /grade` | Scores a written quiz answer out of 10 |
| `GET /health` | Quick check that the server is up |
