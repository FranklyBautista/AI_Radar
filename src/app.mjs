import { DATA_SOURCE, NoSignalsError, loadSnapshot } from "./data-source.mjs";
import {
  RANKING_EXPLANATION,
  formatCategory,
  formatConfidence,
  formatStatus,
  rankSignals,
} from "./ranking.mjs";

const state = {
  phase: "loading",
  snapshot: null,
  selectedId: null,
  query: "",
  mode: "reader",
  edits: new Map(),
  adjustments: new Map(),
};

const elements = {
  rankingPanel: document.querySelector(".ranking-panel"),
  signalList: document.querySelector("#signal-list"),
  resultCount: document.querySelector("#result-count"),
  detail: document.querySelector("#signal-detail"),
  snapshotDate: document.querySelector("#snapshot-date"),
  sourceBadge: document.querySelector("#data-source-note"),
  search: document.querySelector("#signal-search"),
  searchForm: document.querySelector(".search"),
  modeButtons: [...document.querySelectorAll(".mode-button[data-mode]")],
  operatorPanel: document.querySelector(".operator-panel"),
  operatorKicker: document.querySelector("#operator-kicker"),
  operatorTitle: document.querySelector("#operator-title"),
  operatorDescription: document.querySelector("#operator-description"),
  operatorQueue: document.querySelector("#operator-queue"),
  operatorFeedback: document.querySelector("#operator-feedback"),
  operatorActions: [...document.querySelectorAll("[data-action]")],
  adjustPanel: document.querySelector("#adjust-panel"),
  scoreAdjustment: document.querySelector("#score-adjustment"),
  scoreAdjustmentValue: document.querySelector("#score-adjustment-value"),
  editDialog: document.querySelector("#edit-dialog"),
  editForm: document.querySelector("#edit-form"),
  editTitle: document.querySelector("#edit-title"),
  editAction: document.querySelector("#edit-action"),
  editStatus: document.querySelector("#edit-status"),
  toast: document.querySelector("#toast"),
  menuButton: document.querySelector(".mobile-menu-button"),
  navBackdrop: document.querySelector(".nav-backdrop"),
};

let toastTimer;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return new Set(["http:", "https:"]).has(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function sourceDomain(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Fuente sin dominio";
  }
}

function formatDate(date, options = { day: "2-digit", month: "short" }) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", options).format(new Date(`${date}T12:00:00`));
}

function currentSignals() {
  if (!state.snapshot) return [];
  const edited = state.snapshot.senales.map((signal) => ({
    ...signal,
    ...(state.edits.get(signal.id) ?? {}),
  }));
  return rankSignals(edited, state.adjustments);
}

function filteredSignals() {
  const query = state.query.trim().toLocaleLowerCase("es");
  if (!query) return currentSignals();
  return currentSignals().filter((signal) =>
    [
      signal.titulo,
      signal.fuente.nombre,
      signal.estado,
      signal.confianza,
      ...(signal.etiquetas ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase("es")
      .includes(query),
  );
}

function selectedSignal() {
  return currentSignals().find((signal) => signal.id === state.selectedId) ?? null;
}

function signalRow(signal, index) {
  const selected = signal.id === state.selectedId;
  const title = escapeHtml(signal.titulo);
  const category = escapeHtml(formatCategory(signal.etiquetas));
  const status = escapeHtml(formatStatus(signal.estado));
  const date = formatDate(signal.fuente.fecha_publicacion);
  const adjustment = signal.scoreAdjustment
    ? `, ajuste local ${signal.scoreAdjustment > 0 ? "+" : ""}${signal.scoreAdjustment}`
    : "";

  return `
    <button
      class="signal-row${selected ? " is-selected" : ""}"
      type="button"
      data-signal-id="${escapeHtml(signal.id)}"
      aria-current="${selected ? "true" : "false"}"
      aria-label="${index + 1}. ${title}. Puntuación ${signal.score}${adjustment}. ${status}."
    >
      <span class="rank-number" aria-hidden="true">${index + 1}</span>
      <span class="signal-main"><span class="signal-title">${title}</span></span>
      <span class="category" aria-hidden="true">${category}</span>
      <span class="score" title="${escapeHtml(RANKING_EXPLANATION)}" aria-hidden="true">${signal.score}</span>
      <span class="status-pill" data-status="${escapeHtml(signal.estado)}" aria-hidden="true">${status}</span>
      <span class="signal-date" aria-hidden="true">${date}</span>
      <span class="signal-meta-mobile" aria-hidden="true">
        <span>${category}</span>
        <span class="status-pill" data-status="${escapeHtml(signal.estado)}">${status}</span>
        <span>${date}</span>
      </span>
    </button>`;
}

function renderRanking() {
  const signals = filteredSignals();
  elements.rankingPanel.setAttribute("aria-busy", "false");
  elements.resultCount.textContent = `${signals.length} ${signals.length === 1 ? "señal" : "señales"}`;

  if (!signals.length) {
    elements.signalList.innerHTML = `
      <div class="empty-state">
        <span aria-hidden="true">⌕</span>
        <h3>No encontramos señales</h3>
        <p>Prueba otro término o limpia la búsqueda para volver al radar completo.</p>
        <button class="button button-secondary" type="button" data-reset-search>Limpiar búsqueda</button>
      </div>`;
    elements.detail.hidden = true;
    return;
  }

  if (!signals.some((signal) => signal.id === state.selectedId)) {
    state.selectedId = signals[0].id;
  }
  elements.signalList.innerHTML = signals.map(signalRow).join("");
}

function renderDetail() {
  const signal = selectedSignal();
  if (!signal || filteredSignals().length === 0) {
    elements.detail.hidden = true;
    return;
  }

  const sourceUrl = safeSourceUrl(signal.fuente.url);
  const tags = (signal.etiquetas ?? [])
    .map((tag) => `<span class="tag" role="listitem">${escapeHtml(tag)}</span>`)
    .join("");

  elements.detail.innerHTML = `
    <div class="detail-header">
      <h2 id="detail-title">${escapeHtml(signal.titulo)}</h2>
      <div class="detail-badges">
        <span class="status-pill" data-status="${escapeHtml(signal.estado)}">${escapeHtml(formatStatus(signal.estado))}</span>
        <span class="confidence-pill">${escapeHtml(formatConfidence(signal.confianza))}</span>
      </div>
    </div>
    <div class="detail-grid">
      <section class="detail-section" aria-labelledby="impact-title">
        <h3 id="impact-title">Por qué importa</h3>
        <p>${escapeHtml(signal.impacto)}</p>
        <div class="action-block">
          <h3>Acción sugerida</h3>
          <p>${escapeHtml(signal.accion)}</p>
        </div>
      </section>
      <section class="detail-section" aria-labelledby="evidence-title">
        <h3 id="evidence-title">Evidencia</h3>
        <div class="evidence-card">
          <p>${escapeHtml(signal.evidencia)}</p>
          <small>Evidencia reportada en el snapshot · contrato ${escapeHtml(state.snapshot.contract_version)}</small>
        </div>
        <div class="tag-list" role="list" aria-label="Etiquetas">${tags}</div>
      </section>
      <section class="detail-section" id="sources" aria-labelledby="sources-title">
        <h3 id="sources-title">Fuente</h3>
        <div class="source-card">
          <div class="source-card-top">
            <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer noopener">
              ${escapeHtml(signal.fuente.nombre)} <span class="sr-only">(abre en una pestaña nueva)</span>
            </a>
            <span class="confidence-pill">${escapeHtml(signal.confianza ?? "sin dato")}</span>
          </div>
          <p class="source-domain">${escapeHtml(sourceDomain(signal.fuente.url))}</p>
          <small>Publicado ${escapeHtml(formatDate(signal.fuente.fecha_publicacion, { dateStyle: "long" }))}</small>
        </div>
      </section>
    </div>`;
  elements.detail.hidden = false;
}

function renderOperatorQueue() {
  elements.operatorQueue.innerHTML = currentSignals()
    .map(
      (signal, index) => `
        <button
          type="button"
          class="queue-row${signal.id === state.selectedId ? " is-selected" : ""}"
          data-signal-id="${escapeHtml(signal.id)}"
          aria-label="Seleccionar ${escapeHtml(signal.titulo)}, puesto ${index + 1}, puntuación ${signal.score}"
        >
          <span class="queue-rank" aria-hidden="true">${index + 1}</span>
          <strong aria-hidden="true">${escapeHtml(signal.titulo)}</strong>
          <span class="queue-score" aria-hidden="true">${signal.score}</span>
        </button>`,
    )
    .join("");
}

function renderOperator() {
  const isOperator = state.mode === "operator";
  const hasSelection = Boolean(selectedSignal());
  elements.operatorPanel.dataset.active = String(isOperator);
  elements.operatorKicker.textContent = isOperator ? "Herramientas de sesión" : "Vista previa";
  elements.operatorTitle.textContent = isOperator ? "Controles de operación" : "Modo operador";
  elements.operatorDescription.textContent = isOperator
    ? "Revisa el orden y prepara cambios locales sin fingir persistencia."
    : "Activa el modo operador para revisar y preparar señales.";

  for (const action of elements.operatorActions) {
    const canUse = isOperator && hasSelection && action.dataset.action !== "publish";
    action.disabled = !canUse;
  }

  if (!isOperator) {
    elements.adjustPanel.hidden = true;
    elements.operatorFeedback.textContent = "";
  }

  const adjustment = state.adjustments.get(state.selectedId) ?? 0;
  elements.scoreAdjustment.value = String(adjustment);
  elements.scoreAdjustmentValue.value = String(adjustment);
  elements.scoreAdjustmentValue.textContent = adjustment > 0 ? `+${adjustment}` : String(adjustment);
  renderOperatorQueue();
}

function renderDashboard() {
  renderRanking();
  renderDetail();
  renderOperator();
}

function renderSourceBadge({ kind, source, reason } = {}) {
  if (kind === "demo") {
    elements.sourceBadge.dataset.source = "demo";
    elements.sourceBadge.textContent = `Demo local · fallback · contrato ${source.contract_version ?? "1.0.0"}`;
    elements.sourceBadge.title = `${source.url} · ${source.activation}. Motivo: ${reason}`;
    return;
  }

  if (kind === "live") {
    elements.sourceBadge.dataset.source = "live";
    elements.sourceBadge.textContent = `Supabase · en vivo · contrato ${source.contract_version ?? "1.0.0"}`;
    elements.sourceBadge.title = `${source.url} · ${source.security}`;
    return;
  }

  elements.sourceBadge.dataset.source = "unavailable";
  elements.sourceBadge.textContent = "Fuente no disponible";
  elements.sourceBadge.title = DATA_SOURCE.url;
}

function renderError(error) {
  state.phase = "error";
  renderSourceBadge();
  elements.rankingPanel.setAttribute("aria-busy", "false");
  elements.resultCount.textContent = "Error de carga";
  elements.signalList.innerHTML = `
    <div class="error-state" role="alert">
      <span aria-hidden="true">!</span>
      <h3>No pudimos cargar las señales</h3>
      <p>${escapeHtml(error.message)}. La fuente declarada es ${escapeHtml(DATA_SOURCE.url)}.</p>
      <button class="button button-secondary" type="button" data-retry>Reintentar</button>
    </div>`;
  elements.detail.hidden = true;
  elements.operatorQueue.innerHTML = "";
  for (const action of elements.operatorActions) action.disabled = true;
}

function renderNoSignals() {
  state.phase = "empty";
  renderSourceBadge();
  elements.rankingPanel.setAttribute("aria-busy", "false");
  elements.resultCount.textContent = "0 señales";
  elements.signalList.innerHTML = `
    <div class="empty-state" role="status">
      <span aria-hidden="true">⌕</span>
      <h3>Todavía no hay señales</h3>
      <p>Supabase aún no tiene un run completo para mostrar en el radar.</p>
      <button class="button button-secondary" type="button" data-retry>Reintentar</button>
    </div>`;
  elements.detail.hidden = true;
  elements.operatorQueue.innerHTML = "";
  for (const action of elements.operatorActions) action.disabled = true;
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 4200);
}

function selectSignal(id) {
  if (!currentSignals().some((signal) => signal.id === id)) return;
  state.selectedId = id;
  elements.adjustPanel.hidden = true;
  elements.operatorFeedback.textContent = "";
  renderDashboard();
}

function setMode(mode) {
  if (!new Set(["reader", "operator"]).has(mode)) return;
  state.mode = mode;
  document.body.dataset.mode = mode;
  for (const button of elements.modeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }
  renderOperator();
  showToast(mode === "operator" ? "Modo operador activo. Los cambios son locales." : "Modo lector activo.");
}

function openEditDialog() {
  const signal = selectedSignal();
  if (!signal) return;
  elements.editTitle.value = signal.titulo;
  elements.editAction.value = signal.accion;
  elements.editStatus.value = signal.estado;
  elements.editDialog.showModal();
}

function saveLocalEdit() {
  const signal = selectedSignal();
  if (!signal) return;
  state.edits.set(signal.id, {
    titulo: elements.editTitle.value.trim(),
    accion: elements.editAction.value.trim(),
    estado: elements.editStatus.value,
  });
  elements.editDialog.close();
  renderDashboard();
  showToast("Borrador local guardado. No se envió al backend.");
}

function handleOperatorAction(action) {
  if (state.mode !== "operator") return;
  if (action === "merge") {
    elements.operatorFeedback.textContent =
      "No se detectaron duplicados compatibles en este snapshot.";
  }
  if (action === "adjust") {
    elements.adjustPanel.hidden = !elements.adjustPanel.hidden;
    if (!elements.adjustPanel.hidden) elements.scoreAdjustment.focus();
  }
  if (action === "edit") openEditDialog();
}

async function load() {
  state.phase = "loading";
  elements.rankingPanel.setAttribute("aria-busy", "true");
  let sourceMeta;
  try {
    const snapshot = await loadSnapshot({
      allowDemoFallback: true,
      onSource: (meta) => {
        sourceMeta = meta;
      },
    });
    state.snapshot = snapshot;
    state.phase = "success";
    state.selectedId = rankSignals(snapshot.senales)[0]?.id ?? null;
    elements.snapshotDate.dateTime = snapshot.fecha;
    elements.snapshotDate.textContent = formatDate(snapshot.fecha, { dateStyle: "long" });
    renderSourceBadge({
      ...sourceMeta,
      source: { ...sourceMeta.source, contract_version: snapshot.contract_version },
    });
    renderDashboard();
  } catch (error) {
    if (error instanceof NoSignalsError) {
      renderNoSignals();
    } else {
      renderError(error instanceof Error ? error : new Error("Error de datos desconocido"));
    }
  }
}

function closeNavigation() {
  document.body.classList.remove("nav-open");
  elements.menuButton.setAttribute("aria-expanded", "false");
  elements.menuButton.setAttribute("aria-label", "Abrir navegación");
}

elements.signalList.addEventListener("click", (event) => {
  const signal = event.target.closest("[data-signal-id]");
  if (signal) selectSignal(signal.dataset.signalId);
  if (event.target.closest("[data-reset-search]")) {
    state.query = "";
    elements.search.value = "";
    renderDashboard();
    elements.search.focus();
  }
  if (event.target.closest("[data-retry]")) load();
});

elements.operatorQueue.addEventListener("click", (event) => {
  const signal = event.target.closest("[data-signal-id]");
  if (signal) selectSignal(signal.dataset.signalId);
});

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderDashboard();
});

elements.searchForm.addEventListener("submit", (event) => event.preventDefault());

for (const button of elements.modeButtons) {
  button.addEventListener("click", () => setMode(button.dataset.mode));
}

for (const action of elements.operatorActions) {
  action.addEventListener("click", () => handleOperatorAction(action.dataset.action));
}

elements.scoreAdjustment.addEventListener("input", (event) => {
  const value = Number(event.target.value);
  state.adjustments.set(state.selectedId, value);
  elements.scoreAdjustmentValue.value = String(value);
  elements.scoreAdjustmentValue.textContent = value > 0 ? `+${value}` : String(value);
  renderRanking();
  renderDetail();
  renderOperatorQueue();
});

elements.editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (elements.editForm.reportValidity()) saveLocalEdit();
});

for (const closeButton of document.querySelectorAll("[data-close-dialog]")) {
  closeButton.addEventListener("click", () => elements.editDialog.close());
}

elements.menuButton.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  elements.menuButton.setAttribute("aria-expanded", String(isOpen));
  elements.menuButton.setAttribute("aria-label", isOpen ? "Cerrar navegación" : "Abrir navegación");
});

elements.navBackdrop.addEventListener("click", closeNavigation);
document.querySelector(".sidebar").addEventListener("click", (event) => {
  if (event.target.closest("a")) closeNavigation();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
    closeNavigation();
    elements.menuButton.focus();
  }
});

load();
