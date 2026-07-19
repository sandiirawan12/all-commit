const STORAGE_KEY = "all-commit-history";

const typeEl = document.getElementById("type");
const scopeEl = document.getElementById("scope");
const subjectEl = document.getElementById("subject");
const bodyEl = document.getElementById("body");
const breakingEl = document.getElementById("breaking");
const previewEl = document.getElementById("preview");
const subjectCountEl = document.getElementById("subject-count");
const copyBtn = document.getElementById("copy-btn");
const saveBtn = document.getElementById("save-btn");
const resetBtn = document.getElementById("reset-btn");
const clearHistoryBtn = document.getElementById("clear-history");
const historyListEl = document.getElementById("history-list");
const historyEmptyEl = document.getElementById("history-empty");

function buildMessage() {
  const type = typeEl.value;
  const scope = scopeEl.value.trim();
  const subject = subjectEl.value.trim() || "your subject here";
  const body = bodyEl.value.trim();
  const breaking = breakingEl.checked;

  const scopePart = scope ? `(${scope})` : "";
  const bang = breaking ? "!" : "";
  let message = `${type}${scopePart}${bang}: ${subject}`;

  if (body) {
    message += `\n\n${body}`;
  }

  if (breaking) {
    message += `\n\nBREAKING CHANGE: this commit introduces a breaking change.`;
  }

  return message;
}

function updatePreview() {
  subjectCountEl.textContent = String(subjectEl.value.length);
  previewEl.innerHTML = `<code>${escapeHtml(buildMessage())}</code>`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
}

function renderHistory() {
  const items = loadHistory();
  historyListEl.innerHTML = "";
  historyEmptyEl.hidden = items.length > 0;

  items.forEach((item) => {
    const li = document.createElement("li");
    const when = new Date(item.createdAt).toLocaleString();
    li.innerHTML = `
      <pre>${escapeHtml(item.message)}</pre>
      <div class="meta">
        <span>${when}</span>
        <button type="button" class="ghost small reuse-btn">Reuse</button>
      </div>
    `;
    li.querySelector(".reuse-btn").addEventListener("click", () => {
      typeEl.value = item.type;
      scopeEl.value = item.scope;
      subjectEl.value = item.subject;
      bodyEl.value = item.body;
      breakingEl.checked = item.breaking;
      updatePreview();
      subjectEl.focus();
    });
    historyListEl.appendChild(li);
  });
}

async function copyPreview() {
  const text = buildMessage();
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 1200);
  } catch {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1200);
  }
}

function saveDraft() {
  if (!subjectEl.value.trim()) {
    subjectEl.focus();
    return;
  }

  const items = loadHistory();
  items.unshift({
    message: buildMessage(),
    type: typeEl.value,
    scope: scopeEl.value.trim(),
    subject: subjectEl.value.trim(),
    body: bodyEl.value.trim(),
    breaking: breakingEl.checked,
    createdAt: Date.now(),
  });
  saveHistory(items);
  renderHistory();
}

function resetForm() {
  typeEl.value = "feat";
  scopeEl.value = "";
  subjectEl.value = "";
  bodyEl.value = "";
  breakingEl.checked = false;
  updatePreview();
  subjectEl.focus();
}

[typeEl, scopeEl, subjectEl, bodyEl, breakingEl].forEach((el) => {
  el.addEventListener("input", updatePreview);
  el.addEventListener("change", updatePreview);
});

copyBtn.addEventListener("click", copyPreview);
saveBtn.addEventListener("click", saveDraft);
resetBtn.addEventListener("click", resetForm);
clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

updatePreview();
renderHistory();
