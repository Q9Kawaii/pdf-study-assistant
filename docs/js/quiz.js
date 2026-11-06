// The quiz. Multiple choice is marked here. Written answers go to POST /grade.
(function () {
  const POINTS_PER_QUESTION = 10;

  // type "choice": "answer" is the position of the correct option, from 0.
  // type "written": "reference" is the model answer the AI grades against.
  const QUESTIONS = [
    {
      type: "choice",
      text: "What does this app do when the answer isn't in your PDF?",
      options: [
        "It answers from what the AI already knows",
        'It says "Not found in your document"',
        "It searches the web",
        "It asks you to upload a bigger PDF",
      ],
      answer: 1,
    },
    {
      type: "choice",
      text: "What is a hallucination?",
      options: [
        "When the server goes to sleep",
        "When a PDF has no text",
        "When an LLM confidently makes up something false",
        "When two chunks share text",
      ],
      answer: 2,
    },
    {
      type: "written",
      text: "In your own words, what are the two big problems of an LLM on its own?",
      reference:
        "It has never seen your private documents, because it only knows its training data. It can also sound confident while being wrong, which is called hallucination.",
    },
    {
      type: "choice",
      text: "What does the R in RAG stand for?",
      options: ["Reading", "Ranking", "Retrieval", "Response"],
      answer: 2,
    },
    {
      type: "written",
      text: "Explain RAG using the idea of an exam.",
      reference:
        "A normal LLM is like a closed-book exam where it answers from memory and may guess. RAG is like an open-book exam: it first looks up the relevant text, then answers from it.",
    },
    {
      type: "choice",
      text: "What is an embedding?",
      options: [
        "A vector of numbers that captures the meaning of text",
        "A picture inside a PDF",
        "A compressed copy of a file",
        "A password for the API",
      ],
      answer: 0,
    },
    {
      type: "choice",
      text: 'Why can "How do cells make energy?" find a passage about "ATP production"?',
      options: [
        "They share the same words",
        "The passage is on page 1",
        "Similar meanings get similar vectors, even with different words",
        "The search only looks at titles",
      ],
      answer: 2,
    },
    {
      type: "choice",
      text: "Why do neighbouring chunks overlap?",
      options: [
        "To make the PDF smaller",
        "So an idea cut at a boundary can still appear whole in a chunk",
        "To use more quota",
        "So every chunk has the same page number",
      ],
      answer: 1,
    },
    {
      type: "written",
      text: "Why do we split a PDF into chunks instead of making one vector for the whole file?",
      reference:
        "One vector for a whole PDF mixes all its topics, so it is too blurry to search. Small chunks let the search find the exact passage, and only those passages are sent to the model.",
    },
    {
      type: "choice",
      text: "What does cosine similarity measure?",
      options: [
        "The length of each vector",
        "The number of shared words",
        "The file size",
        "The angle between two vectors",
      ],
      answer: 3,
    },
    {
      type: "choice",
      text: "Which pages does this app send to OCR?",
      options: [
        "Every page of every PDF",
        "Only the first page",
        "Pages that have pictures but almost no real text",
        "Only pages with tables",
      ],
      answer: 2,
    },
    {
      type: "written",
      text: "Why does a long scanned PDF use a few calls of several pages each, instead of one call per page?",
      reference:
        "The free plan allows only 15 AI requests a minute for all users. One call per page could use them all up and block people's questions. A few calls running at the same time stay fast and leave room.",
    },
    {
      type: "choice",
      text: "In this app, what is sent to Gemini to write an answer?",
      options: [
        "The whole PDF and the question",
        "The top 3 chunks and the question",
        "Only the question",
        "All the vectors",
      ],
      answer: 1,
    },
    {
      type: "written",
      text: "What is prompt injection, and how does this app defend against it?",
      reference:
        "Prompt injection is when text in a document tries to give the AI instructions, like ignore your rules. The app treats chunk text as data, not instructions: its rules warn the model and the chunks are sent as JSON, separate from those rules.",
    },
    {
      type: "written",
      text: "A 20-page PDF fits inside Gemini's input. Give two reasons to still use RAG instead of pasting it all.",
      reference:
        "Any two of: it uses far fewer tokens and less quota, it is faster, the model stays focused on relevant text, we know which passages to cite, and it still works for very large documents.",
    },
    {
      type: "choice",
      text: 'Why might "Summarise the whole PDF" work badly here?',
      options: [
        "Only the top 3 chunks reach the model",
        "Gemini can't write summaries",
        "PDFs can't be summarised",
        "The rate limit blocks the word summarise",
      ],
      answer: 0,
    },
    {
      type: "choice",
      text: "Why does this project use numpy instead of a vector database?",
      options: [
        "Vector databases can't store vectors",
        "numpy is the only option in Python",
        "One small PDF has few chunks, so numpy is fast and much simpler",
        "Render bans databases",
      ],
      answer: 2,
    },
  ];

  const list = document.getElementById("quiz-questions");
  const progress = document.getElementById("quiz-progress");
  const barFill = document.getElementById("quiz-bar-fill");
  const result = document.getElementById("quiz-result");
  const scoreText = document.getElementById("quiz-score");
  const message = document.getElementById("quiz-message");

  let scores = []; // one entry per question; null means not finished yet

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text; // plain text, never HTML
    return node;
  }

  function finishQuestion(index, card, points) {
    scores[index] = points;
    card.classList.add("done");
    updateProgress();
  }

  function updateProgress() {
    const done = scores.filter((score) => score !== null).length;
    progress.textContent = `${done} of ${QUESTIONS.length} answered`;
    barFill.style.width = `${(done / QUESTIONS.length) * 100}%`;
    if (done === QUESTIONS.length) showResult();
  }

  function showResult() {
    const total = scores.reduce((sum, score) => sum + score, 0);
    const maximum = QUESTIONS.length * POINTS_PER_QUESTION;
    const percent = Math.round((total / maximum) * 100);
    scoreText.textContent = `${total} / ${maximum}`;
    if (percent >= 80) message.textContent = `${percent}%. You could explain RAG to a friend now.`;
    else if (percent >= 50) message.textContent = `${percent}%. A good start. Reread the parts you missed.`;
    else message.textContent = `${percent}%. No worries. Read the guide once more and try again.`;
    result.hidden = false;
    result.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "center" });
  }

  function renderChoice(question, index, card) {
    const options = make("div", "options");
    const feedback = make("p", "feedback");
    const buttons = question.options.map((text, position) => {
      const button = make("button", "option", text);
      button.type = "button";
      button.addEventListener("click", () => {
        const correct = position === question.answer;
        buttons.forEach((item) => (item.disabled = true));
        buttons[question.answer].classList.add("correct");
        if (!correct) button.classList.add("wrong");
        feedback.textContent = correct
          ? "Correct!"
          : `Not quite. The answer is: ${question.options[question.answer]}`;
        finishQuestion(index, card, correct ? POINTS_PER_QUESTION : 0);
      });
      return button;
    });
    options.append(...buttons);
    card.append(options, feedback);
  }

  function renderWritten(question, index, card) {
    const label = `answer-${index}`;
    const hiddenLabel = make("label", "sr-only", "Your answer");
    hiddenLabel.htmlFor = label;
    const input = make("textarea");
    input.id = label;
    input.rows = 3;
    input.maxLength = 500;
    input.placeholder = "Write your answer in your own words";

    const actions = make("div", "question-actions");
    const counter = make("span", "counter", "0 / 500");
    const button = make("button", "button primary small", "Grade my answer");
    button.type = "button";
    button.disabled = true;
    actions.append(counter, button);
    const feedback = make("p", "feedback");

    input.addEventListener("input", () => {
      counter.textContent = `${input.value.length} / 500`;
      button.disabled = !input.value.trim();
    });

    button.addEventListener("click", async () => {
      button.disabled = true;
      input.disabled = true;
      feedback.textContent = "";
      feedback.classList.remove("error");
      Loader.show();
      try {
        if (!(await wakeBackend())) {
          throw new Error("The server didn't wake up. Please try again in a minute.");
        }
        const grade = await postJson("/grade", {
          question: question.text,
          reference_answer: question.reference,
          user_answer: input.value,
        });
        const score = make("strong", "", `${grade.score} / 10. `);
        feedback.replaceChildren(score, grade.feedback);
        finishQuestion(index, card, grade.score);
      } catch (error) {
        // Grading failed, so the question stays open and they can try again.
        feedback.textContent = error.message;
        feedback.classList.add("error");
        button.disabled = false;
        input.disabled = false;
      } finally {
        Loader.hide();
      }
    });

    card.append(hiddenLabel, input, actions, feedback);
  }

  function renderQuiz() {
    scores = QUESTIONS.map(() => null);
    result.hidden = true;
    list.replaceChildren(
      ...QUESTIONS.map((question, index) => {
        const card = make("article", "question");
        const kind = question.type === "choice" ? "Multiple choice" : "Written";
        card.append(
          make("p", "question-number", `Question ${index + 1} / ${kind}`),
          make("p", "question-text", question.text)
        );
        if (question.type === "choice") renderChoice(question, index, card);
        else renderWritten(question, index, card);
        return card;
      })
    );
    updateProgress();
  }

  document.getElementById("quiz-retake").addEventListener("click", () => {
    renderQuiz();
    document.getElementById("quiz").scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth" });
  });

  renderQuiz();
})();
