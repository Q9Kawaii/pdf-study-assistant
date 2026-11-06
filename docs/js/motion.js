// Scroll reveals and the hero's word-by-word entrance.
(function () {
  // Wrap every word of [data-words] headings in a span with its own delay.
  document.querySelectorAll("[data-words]").forEach((heading) => {
    let index = 0;
    const wrapWords = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType !== Node.TEXT_NODE) {
          wrapWords(child);
          continue;
        }
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) {
            fragment.append(part);
            return;
          }
          const word = document.createElement("span");
          word.className = "word";
          word.textContent = part;
          word.style.animationDelay = `${index++ * 110}ms`;
          fragment.append(word);
        });
        child.replaceWith(fragment);
      }
    };
    wrapWords(heading);
  });

  // Reveal each .reveal element the first time it scrolls into view.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
})();
