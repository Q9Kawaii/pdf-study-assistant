// Written by scripts/gen_structure.py. Don't edit this by hand.
const STRUCTURE = {
  "categories": {
    "backend": {
      "label": "Backend",
      "color": "#52e8d4"
    },
    "frontend": {
      "label": "Frontend",
      "color": "#a899ff"
    },
    "config": {
      "label": "Config",
      "color": "#ffc266"
    },
    "deploy": {
      "label": "Deploy",
      "color": "#ff9dc8"
    },
    "docs": {
      "label": "Docs",
      "color": "#a4e88a"
    }
  },
  "steps": [
    "upload",
    "extract",
    "OCR",
    "chunk",
    "embed",
    "retrieve",
    "answer",
    "grade",
    "safety",
    "deploy"
  ],
  "allSteps": "All steps",
  "tree": {
    "name": "pdf-study-assistant",
    "path": "",
    "folder": true,
    "children": [
      {
        "name": "docs",
        "path": "docs/",
        "folder": true,
        "children": [
          {
            "name": "css",
            "path": "docs/css/",
            "folder": true,
            "children": [
              {
                "name": "app.css",
                "path": "docs/css/app.css",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Styles for the main page, such as the hero and the chat.",
                "why": "Only the main page needs them, so other pages don't load them."
              },
              {
                "name": "base.css",
                "path": "docs/css/base.css",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Shared styles: colours, background, nav, buttons, footer and loader.",
                "why": "Every page uses these, so the whole site keeps one look."
              },
              {
                "name": "docs.css",
                "path": "docs/css/docs.css",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Styles for the documentation page and its quiz.",
                "why": "Long reading pages need a different layout from the app."
              },
              {
                "name": "structure.css",
                "path": "docs/css/structure.css",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Styles for the file tree and detail panel on this page.",
                "why": "Only this page needs them, so other pages don't load them."
              },
              {
                "name": "xray.css",
                "path": "docs/css/xray.css",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Styles for the X-ray panel and the upload page map.",
                "why": "These visuals have many small parts, so they get their own file."
              }
            ],
            "category": "frontend",
            "step": "All steps",
            "role": "The styles for every page.",
            "why": "Keeping the looks apart from the page content makes both easier to change."
          },
          {
            "name": "js",
            "path": "docs/js/",
            "folder": true,
            "children": [
              {
                "name": "api.js",
                "path": "docs/js/api.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Sends requests to the backend and wakes it if it's asleep.",
                "why": "One shared helper gives every page the same timeouts and friendly errors."
              },
              {
                "name": "app.js",
                "path": "docs/js/app.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "upload",
                "role": "Runs the main page: upload, questions, answers and sources.",
                "why": "It connects the buttons on the page to the backend."
              },
              {
                "name": "background.js",
                "path": "docs/js/background.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Draws the moving particle background.",
                "why": "It gives the site its motion-graphics feel, and it pauses when the tab is hidden."
              },
              {
                "name": "config.js",
                "path": "docs/js/config.js",
                "folder": false,
                "children": [],
                "category": "config",
                "step": "deploy",
                "role": "Chooses the backend address, local or live.",
                "why": "The same site can then work on a laptop and on GitHub Pages."
              },
              {
                "name": "icons.js",
                "path": "docs/js/icons.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Holds the shared icons and small page-building helpers.",
                "why": "Pages reuse one icon set, and its text helper keeps PDF text from running as code."
              },
              {
                "name": "loader.js",
                "path": "docs/js/loader.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Shows the loading card with a looping pipeline diagram.",
                "why": "People see that work is happening while the server wakes or the AI thinks."
              },
              {
                "name": "motion.js",
                "path": "docs/js/motion.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Adds the scroll reveals and the word-by-word headings.",
                "why": "It adds movement while keeping all the text readable if it fails."
              },
              {
                "name": "pagemap.js",
                "path": "docs/js/pagemap.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "upload",
                "role": "Draws page thumbnails and totals after an upload.",
                "why": "It shows what the server really built, so nobody has to read a report."
              },
              {
                "name": "quiz.js",
                "path": "docs/js/quiz.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "grade",
                "role": "Runs the quiz: marks choices and sends written answers for grading.",
                "why": "It lets readers test what they learned and see a final score."
              },
              {
                "name": "structure-data.js",
                "path": "docs/js/structure-data.js",
                "folder": false,
                "children": [],
                "category": "docs",
                "step": "All steps",
                "role": "The file list for this page, written by the generator script.",
                "why": "It comes from the same source as the README, so the two always match."
              },
              {
                "name": "structure.js",
                "path": "docs/js/structure.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "All steps",
                "role": "Draws the expandable tree and the detail panel on this page.",
                "why": "It turns the plain file list into something you can explore."
              },
              {
                "name": "xray-cards.js",
                "path": "docs/js/xray-cards.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "answer",
                "role": "Draws the top 3 cards with score rings, and the answer stamp.",
                "why": "The last X-ray stages can be seen at a glance, without much reading."
              },
              {
                "name": "xray-radar.js",
                "path": "docs/js/xray-radar.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "retrieve",
                "role": "Draws the similarity radar and the page heat map.",
                "why": "It turns real scores into a picture of how close each chunk is."
              },
              {
                "name": "xray.js",
                "path": "docs/js/xray.js",
                "folder": false,
                "children": [],
                "category": "frontend",
                "step": "retrieve",
                "role": "Replays each question step by step in the X-ray panel.",
                "why": "It shows how RAG really worked for that question, using real data."
              }
            ],
            "category": "frontend",
            "step": "All steps",
            "role": "The code that runs in the browser.",
            "why": "Small files with one job each are easy to read and explain."
          },
          {
            "name": "documentation.html",
            "path": "docs/documentation.html",
            "folder": false,
            "children": [],
            "category": "docs",
            "step": "All steps",
            "role": "A beginner's guide to how the project works, with a quiz.",
            "why": "It explains each idea in simple words, so anyone can learn RAG from it."
          },
          {
            "name": "index.html",
            "path": "docs/index.html",
            "folder": false,
            "children": [],
            "category": "frontend",
            "step": "upload",
            "role": "The main page, where people upload a PDF and ask questions.",
            "why": "It holds the layout, and the scripts bring it to life."
          },
          {
            "name": "structure.html",
            "path": "docs/structure.html",
            "folder": false,
            "children": [],
            "category": "docs",
            "step": "All steps",
            "role": "This page: an interactive map of the project's files.",
            "why": "It helps a new reader see what each file does before opening the code."
          }
        ],
        "category": "frontend",
        "step": "All steps",
        "role": "The website, published by GitHub Pages.",
        "why": "GitHub Pages can host this folder for free, and it needs no build step."
      },
      {
        "name": "scripts",
        "path": "scripts/",
        "folder": true,
        "children": [
          {
            "name": "gen_structure.py",
            "path": "scripts/gen_structure.py",
            "folder": false,
            "children": [],
            "category": "docs",
            "step": "All steps",
            "role": "Builds the README section and this page's data from one list.",
            "why": "With one source, the README and the site can't drift apart."
          }
        ],
        "category": "docs",
        "step": "All steps",
        "role": "Helper scripts for working on the project.",
        "why": "These tools help the people building the project, so they stay apart from the app."
      },
      {
        "name": "tests",
        "path": "tests/",
        "folder": true,
        "children": [
          {
            "name": "__init__.py",
            "path": "tests/__init__.py",
            "folder": false,
            "children": [],
            "category": "backend",
            "step": "All steps",
            "role": "An empty file that marks this folder as a Python package.",
            "why": "Python needs it so tests can import from each other."
          },
          {
            "name": "test_api.py",
            "path": "tests/test_api.py",
            "folder": false,
            "children": [],
            "category": "backend",
            "step": "safety",
            "role": "Tests the endpoints, limits, citations and CORS.",
            "why": "It proves the safety rules really work, with a fake AI."
          },
          {
            "name": "test_chunker.py",
            "path": "tests/test_chunker.py",
            "folder": false,
            "children": [],
            "category": "backend",
            "step": "chunk",
            "role": "Tests chunk size, overlap and page numbers.",
            "why": "Citations depend on chunking being right."
          },
          {
            "name": "test_embeddings.py",
            "path": "tests/test_embeddings.py",
            "folder": false,
            "children": [],
            "category": "backend",
            "step": "embed",
            "role": "Tests batching and waiting on the rate limit.",
            "why": "It proves long uploads survive the free per-minute limit."
          },
          {
            "name": "test_ocr.py",
            "path": "tests/test_ocr.py",
            "folder": false,
            "children": [],
            "category": "backend",
            "step": "OCR",
            "role": "Tests page groups, page markers and retries.",
            "why": "It proves skipped pages are never counted as a success."
          },
          {
            "name": "test_pdf_reader.py",
            "path": "tests/test_pdf_reader.py",
            "folder": false,
            "children": [],
            "category": "backend",
            "step": "extract",
            "role": "Tests rejected files and finding pages that need OCR.",
            "why": "Bad uploads must fail with a clear message."
          },
          {
            "name": "test_retrieval.py",
            "path": "tests/test_retrieval.py",
            "folder": false,
            "children": [],
            "category": "backend",
            "step": "retrieve",
            "role": "Checks cosine similarity against known answers.",
            "why": "The search math has to be exactly right."
          },
          {
            "name": "test_structure.py",
            "path": "tests/test_structure.py",
            "folder": false,
            "children": [],
            "category": "docs",
            "step": "All steps",
            "role": "Checks that the README and this page are up to date.",
            "why": "A new file with no description fails the tests, so nothing gets left out."
          }
        ],
        "category": "backend",
        "step": "All steps",
        "role": "Automatic checks for the backend.",
        "why": "They catch mistakes early, and they use a fake AI, so they spend no quota."
      },
      {
        "name": ".env.example",
        "path": ".env.example",
        "folder": false,
        "children": [],
        "category": "config",
        "step": "deploy",
        "role": "A template listing the settings the app needs, with a placeholder value.",
        "why": "It shows new developers what to set up, without sharing a real key."
      },
      {
        "name": ".gitignore",
        "path": ".gitignore",
        "folder": false,
        "children": [],
        "category": "config",
        "step": "safety",
        "role": "Lists the files git must never save, such as secrets and caches.",
        "why": "It stops private or throwaway files from reaching the public repo."
      },
      {
        "name": "ai_client.py",
        "path": "ai_client.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "All steps",
        "role": "Creates the one Gemini connection the whole app shares.",
        "why": "The API key is read in a single place, so it never gets copied around the code."
      },
      {
        "name": "answering.py",
        "path": "answering.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "answer",
        "role": "Asks Gemini to answer using only the chosen chunks.",
        "why": "This is what stops made-up answers: it holds the rules, the prompt injection defense and the Not found reply."
      },
      {
        "name": "chunker.py",
        "path": "chunker.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "chunk",
        "role": "Cuts each page into small overlapping chunks and keeps the page number.",
        "why": "Small chunks make search exact, and the page number makes citations possible."
      },
      {
        "name": "config.py",
        "path": "config.py",
        "folder": false,
        "children": [],
        "category": "config",
        "step": "All steps",
        "role": "Holds every setting and limit in one place.",
        "why": "Changing a model name or a limit means editing one line, not hunting through the code."
      },
      {
        "name": "embeddings.py",
        "path": "embeddings.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "embed",
        "role": "Turns chunks and questions into vectors with Gemini.",
        "why": "Search needs numbers. It also waits and retries when the free per-minute limit is hit."
      },
      {
        "name": "grading.py",
        "path": "grading.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "grade",
        "role": "Scores a written quiz answer out of 10 with short feedback.",
        "why": "Written answers can't be marked by simple matching, so the AI compares them with a reference answer."
      },
      {
        "name": "main.py",
        "path": "main.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "All steps",
        "role": "The API: it receives requests and connects every pipeline step.",
        "why": "It's the front door of the backend, with the upload, ask, grade and health endpoints, CORS and friendly errors."
      },
      {
        "name": "ocr.py",
        "path": "ocr.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "OCR",
        "role": "Reads pages that are pictures of text, using Gemini vision.",
        "why": "Scanned pages hold no real text. It reads them in a few parallel calls, so it stays fast and within quota."
      },
      {
        "name": "pdf_reader.py",
        "path": "pdf_reader.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "extract",
        "role": "Pulls text from each page and spots pages that need OCR.",
        "why": "It's the first step of the pipeline, and it rejects bad files with a clear message."
      },
      {
        "name": "rate_limits.py",
        "path": "rate_limits.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "safety",
        "role": "Limits requests per person and caps total daily AI use.",
        "why": "The free quota is small, so one visitor must not be able to use it all."
      },
      {
        "name": "README.md",
        "path": "README.md",
        "folder": false,
        "children": [],
        "category": "docs",
        "step": "All steps",
        "role": "The front page of the repo on GitHub.",
        "why": "It tells visitors what the project is and how to run it."
      },
      {
        "name": "render.yaml",
        "path": "render.yaml",
        "folder": false,
        "children": [],
        "category": "deploy",
        "step": "deploy",
        "role": "Tells Render how to build and start the backend.",
        "why": "Keeping the setup in a file makes deploys repeatable, and the API key value stays out of git."
      },
      {
        "name": "requirements.txt",
        "path": "requirements.txt",
        "folder": false,
        "children": [],
        "category": "deploy",
        "step": "deploy",
        "role": "Lists the exact Python packages the backend needs.",
        "why": "Pinned versions mean a laptop and the server run the same code."
      },
      {
        "name": "retrieval.py",
        "path": "retrieval.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "retrieve",
        "role": "Scores every chunk with cosine similarity and picks the top ones.",
        "why": "This is the search itself, written by hand with numpy, so every line can be explained."
      },
      {
        "name": "sessions.py",
        "path": "sessions.py",
        "folder": false,
        "children": [],
        "category": "backend",
        "step": "retrieve",
        "role": "Keeps each upload's chunks and vectors in memory.",
        "why": "It does the job of a vector database, which one small PDF doesn't need."
      }
    ]
  }
};
