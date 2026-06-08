// ── Endpoint definitions ─────────────────────────────────────────────────────
const ENDPOINTS = [
  {
    name: "classify",
    path: "/api/v1/predict/classify",
    desc: "Classify an image into a category with confidence score and alternative labels.",
    returns: "category, subcategory, confidence, alternative_labels, description",
  },
  {
    name: "describe",
    path: "/api/v1/predict/describe",
    desc: "Generate a rich description: scene type, main subjects, dominant colors, and mood.",
    returns: "summary, scene_type, main_subjects, colors, mood, time_of_day, style",
  },
  {
    name: "detect",
    path: "/api/v1/predict/detect",
    desc: "Detect and list all objects in the image with confidence scores.",
    returns: "objects[], count, dominant_object, background",
  },
  {
    name: "ocr",
    path: "/api/v1/predict/ocr",
    desc: "Extract all visible text via OCR. Returns language detection and text type.",
    returns: "text_found, extracted_text, language, text_type, confidence",
  },
  {
    name: "sentiment",
    path: "/api/v1/predict/sentiment",
    desc: "Analyze the emotional sentiment and atmosphere conveyed by the image.",
    returns: "overall_sentiment, sentiment_score, emotions[], energy_level, valence",
  },
  {
    name: "custom",
    path: "/api/v1/predict/custom",
    desc: "Send a freeform prompt alongside the image. Claude returns structured JSON.",
    returns: "any — shaped by your prompt",
  },
  {
    name: "health",
    path: "/api/v1/health",
    desc: "Liveness check. Returns server status, uptime, and environment.",
    returns: "status, version, uptime, timestamp",
  },
];

// ── DOM refs ─────────────────────────────────────────────────────────────────
const dropZone      = document.getElementById("dropZone");
const fileInput     = document.getElementById("fileInput");
const previewImg    = document.getElementById("previewImg");
const endpointTabs  = document.getElementById("endpointTabs");
const customWrap    = document.getElementById("customPromptWrap");
const customPrompt  = document.getElementById("customPrompt");
const urlDisplay    = document.getElementById("urlDisplay");
const runBtn        = document.getElementById("runBtn");
const responseOutput= document.getElementById("responseOutput");
const statusBadge   = document.getElementById("statusBadge");
const copyBtn       = document.getElementById("copyBtn");
const serverStatus  = document.getElementById("serverStatus");
const statusDot     = serverStatus.querySelector(".status-dot");

let selectedFile = null;
let selectedEp   = "classify";
let lastJSON     = null;

// ── Build endpoint cards ──────────────────────────────────────────────────────
const grid = document.getElementById("endpointsGrid");
ENDPOINTS.forEach(ep => {
  grid.innerHTML += `
    <div class="ep-card">
      <div class="ep-card-title">${ep.name}</div>
      <div class="ep-card-path">POST ${ep.path}</div>
      <div class="ep-card-desc">${ep.desc}</div>
      <div class="ep-card-returns">→ ${ep.returns}</div>
    </div>`;
});

// ── Health check ─────────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const r = await fetch("/api/v1/health");
    if (r.ok) {
      serverStatus.childNodes[1].textContent = " online";
      statusDot.className = "status-dot ok";
    } else throw new Error();
  } catch {
    serverStatus.childNodes[1].textContent = " offline";
    statusDot.className = "status-dot err";
  }
}
checkHealth();

// ── File drop / select ────────────────────────────────────────────────────────
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("over"));
dropZone.addEventListener("drop", e => {
  e.preventDefault(); dropZone.classList.remove("over");
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", e => handleFile(e.target.files[0]));

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  const url = URL.createObjectURL(file);
  dropZone.querySelector(".dz-content").style.display = "none";
  previewImg.src = url;
  previewImg.style.display = "block";
  runBtn.disabled = false;
}

// ── Endpoint tabs ─────────────────────────────────────────────────────────────
endpointTabs.querySelectorAll(".ep-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    endpointTabs.querySelectorAll(".ep-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedEp = btn.dataset.ep;
    urlDisplay.textContent = `/api/v1/predict/${selectedEp}`;
    customWrap.style.display = selectedEp === "custom" ? "block" : "none";
  });
});

// ── Run prediction ────────────────────────────────────────────────────────────
runBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  runBtn.disabled = true;
  runBtn.querySelector(".run-btn-inner").textContent = "⏳ Running…";
  statusBadge.textContent = "…";
  statusBadge.className = "status-badge";
  copyBtn.style.display = "none";
  responseOutput.innerHTML = '<span style="color:var(--hint)">Sending request…</span>';

  try {
    const formData = new FormData();
    formData.append("image", selectedFile);
    if (selectedEp === "custom") {
      formData.append("prompt", customPrompt.value.trim() || "Describe this image as JSON.");
    }

    const res = await fetch(`/api/v1/predict/${selectedEp}`, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    lastJSON = json;

    statusBadge.textContent = res.ok ? `${res.status} OK` : `${res.status} Error`;
    statusBadge.className = "status-badge " + (res.ok ? "ok" : "err");

    responseOutput.innerHTML = syntaxHighlight(JSON.stringify(json, null, 2));
    copyBtn.style.display = "inline-block";
  } catch (err) {
    statusBadge.textContent = "Network Error";
    statusBadge.className = "status-badge err";
    responseOutput.innerHTML = `<span style="color:var(--red)">${err.message}</span>`;
  } finally {
    runBtn.disabled = false;
    runBtn.querySelector(".run-btn-inner").textContent = "▶ Run prediction";
  }
});

// ── Copy ─────────────────────────────────────────────────────────────────────
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(JSON.stringify(lastJSON, null, 2)).then(() => {
    copyBtn.textContent = "copied ✓";
    setTimeout(() => (copyBtn.textContent = "copy JSON"), 1600);
  });
});

// ── JSON syntax highlighter ──────────────────────────────────────────────────
function syntaxHighlight(json) {
  return json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
          return `<span class="json-str">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
        if (/null/.test(match)) return `<span class="json-null">${match}</span>`;
        return `<span class="json-num">${match}</span>`;
      }
    );
}
