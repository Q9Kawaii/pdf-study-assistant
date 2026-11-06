# PDF Study Assistant

Upload a PDF and ask questions about it. Answers come only from your document,
with page numbers. A RAG X-ray panel shows every step, using real data.

**Live demo:** https://q9kawaii.github.io/pdf-study-assistant/

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
