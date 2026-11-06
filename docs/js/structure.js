// The structure page: an expandable file tree and a detail panel.
// All the content comes from structure-data.js, which the generator writes.
(function () {
  const { categories, steps, allSteps, tree } = STRUCTURE;
  const treeBox = document.getElementById("tree");
  const detail = document.getElementById("detail");
  const legend = document.getElementById("legend");
  const stackedLayout = matchMedia("(max-width: 900px)");
  let selectedRow = null;

  const colour = (node) => categories[node.category].color;

  function flatten(node) {
    return node.children.flatMap((child) => [child, ...flatten(child)]);
  }

  function drawLegend() {
    const nodes = flatten(tree);
    legend.replaceChildren(
      ...Object.entries(categories).map(([key, category]) => {
        const item = el("li");
        item.style.setProperty("--c", category.color);
        const count = nodes.filter((node) => node.category === key).length;
        item.append(el("i"), category.label, el("span", "", String(count)));
        return item;
      })
    );
  }

  function showDetail(node, row) {
    if (selectedRow) {
      selectedRow.classList.remove("selected");
      selectedRow.removeAttribute("aria-current");
    }
    selectedRow = row;
    row.classList.add("selected");
    row.setAttribute("aria-current", "true");

    detail.style.setProperty("--c", colour(node));
    const body = el("div", "detail-body");
    const stepList = el("ul", "step-grid");
    stepList.append(
      ...steps.map((step) => {
        const on = node.step === allSteps || node.step === step;
        return el("li", on ? "on" : "", step);
      })
    );
    body.append(
      el("span", "detail-badge", categories[node.category].label),
      el("h2", "", node.path),
      el("h3", "", "What it does"),
      el("p", "", node.role),
      el("h3", "", "Why it exists"),
      el("p", "", node.why),
      el("h3", "", `Pipeline step: ${node.step}`),
      stepList
    );
    detail.replaceChildren(body);
  }

  function makeRow(tag, node) {
    const row = el(tag, "tree-row");
    row.style.setProperty("--c", colour(node));
    row.append(
      icon(node.folder ? "folder" : "pdf"),
      el("span", "tree-name", node.name + (node.folder ? "/" : "")),
      el("span", "tree-role", node.role)
    );
    row.title = node.role;
    return row;
  }

  function choose(node, row) {
    showDetail(node, row);
    // Stacked on a phone, the panel sits below the tree, so bring it into view.
    if (stackedLayout.matches) {
      detail.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "start" });
    }
  }

  function drawChildren(parent) {
    const list = el("ul", "tree-list");
    for (const child of parent.children) {
      const item = el("li");
      if (child.folder) {
        const folder = el("details");
        folder.open = true;
        const summary = makeRow("summary", child);
        // Opening or closing a folder also shows what the folder is for.
        summary.addEventListener("click", () => showDetail(child, summary));
        folder.append(summary, drawChildren(child));
        item.append(folder);
      } else {
        const button = makeRow("button", child);
        button.type = "button";
        button.addEventListener("click", () => choose(child, button));
        item.append(button);
      }
      list.append(item);
    }
    return list;
  }

  function drawTree() {
    const root = el("details");
    root.open = true;
    const summary = el("summary", "tree-root");
    summary.append(icon("folder"), el("span", "tree-name", `${tree.name}/`));
    root.append(summary, drawChildren(tree));
    treeBox.replaceChildren(root);
  }

  drawLegend();
  drawTree();

  // Start on the file that ties the whole backend together.
  const start = [...treeBox.querySelectorAll("button.tree-row")].find(
    (row) => row.querySelector(".tree-name").textContent === "main.py"
  );
  start.click();
})();
