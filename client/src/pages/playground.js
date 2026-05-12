import { requireAuth } from '../services/authService.js';
import { mountNav } from '../components/Nav/index.js';
import { mountToastSystem, toast } from '../components/Toast/index.js';
import { http } from '../services/http.js';
import { xpStore } from '../stores/xpStore.js';
import { mountHintPanel } from '../components/AIChat/index.js';
import { slideUp } from '../utils/animations.js';

if (!requireAuth()) throw new Error('Redirecting');

mountToastSystem();
mountNav(document.getElementById('nav-root'));

const root = document.getElementById('page-root');
const params = new URLSearchParams(window.location.search);
const lessonId = params.get('lessonId') ?? null;
const datasetSlug = params.get('dataset') ?? 'ecommerce';

const STARTER_QUERIES_BY_DATASET = {
    ecommerce: [
        { label: 'All orders', sql: 'SELECT *\nFROM orders\nLIMIT 10;' },
        { label: 'Completed orders', sql: "SELECT order_id, customer_id, amount\nFROM orders\nWHERE status = 'completed'\nORDER BY amount DESC;" },
        { label: 'Orders over £500', sql: 'SELECT order_id, amount, region\nFROM orders\nWHERE amount > 500\nORDER BY amount DESC;' },
        { label: 'Count all orders', sql: 'SELECT COUNT(*)\nFROM orders;' },
        { label: 'All customers', sql: 'SELECT *\nFROM customers;' },
    ],
    streaming: [
        { label: 'All sessions', sql: 'SELECT *\nFROM sessions\nLIMIT 10;' },
        { label: 'Premium users', sql: "SELECT user_id, username, country\nFROM users\nWHERE plan = 'premium';" },
        { label: 'Completed listens', sql: 'SELECT session_id, user_id, duration_mins\nFROM sessions\nWHERE completed = true\nORDER BY duration_mins DESC;' },
        { label: 'Count by device', sql: 'SELECT device, COUNT(*) AS sessions\nFROM sessions\nGROUP BY device\nORDER BY sessions DESC;' },
        { label: 'All tracks', sql: 'SELECT *\nFROM tracks;' },
    ],
};

const STARTER_QUERIES = STARTER_QUERIES_BY_DATASET[datasetSlug] ?? STARTER_QUERIES_BY_DATASET.ecommerce;

let editor = null;
let currentSQL = STARTER_QUERIES[0].sql;

const getSQL = () => editor ? editor.getValue() : document.getElementById('sql-textarea')?.value ?? currentSQL;

const addPlaygroundStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .playground-page { display: flex; height: calc(100vh - var(--nav-height)); overflow: hidden; }

    .playground-sidebar {
      width: 240px; flex-shrink: 0; border-right: 1px solid var(--color-border);
      overflow-y: auto; padding: var(--space-5) var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-6);
    }

    .playground-sidebar-section-title {
      font-size: var(--text-xs); font-weight: var(--weight-semibold);
      text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted);
      margin-bottom: var(--space-3);
    }

    .starter-query-btn {
      display: block; width: 100%; text-align: left;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      font-size: var(--text-xs); color: var(--color-text-secondary);
      transition: all var(--duration-fast) var(--ease-smooth); margin-bottom: var(--space-1);
    }
    .starter-query-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

    .schema-table { margin-bottom: var(--space-4); }
    .schema-table-name { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--color-brand); margin-bottom: var(--space-2); font-family: var(--font-mono); }
    .schema-col { display: flex; gap: var(--space-2); font-size: var(--text-xs); color: var(--color-text-secondary); padding: var(--space-1) 0; }
    .schema-col-name { font-family: var(--font-mono); color: var(--color-text-primary); flex: 0 0 auto; }
    .schema-col-type { color: var(--color-text-muted); }

    .playground-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .playground-editor-wrap { flex: 0 0 260px; border-bottom: 1px solid var(--color-border); position: relative; }
    .playground-editor-label {
      position: absolute; top: var(--space-3); left: var(--space-4); z-index: 1;
      font-size: var(--text-xs); font-weight: var(--weight-semibold);
      color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em;
      pointer-events: none;
    }
    .playground-editor-skeleton {
      height: 260px; background: var(--color-surface-2); display: flex;
      align-items: center; justify-content: center; color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
    .sql-textarea {
      width: 100%; height: 220px; padding: var(--space-8) var(--space-4) var(--space-4);
      font-family: var(--font-mono); font-size: var(--text-sm); line-height: 1.7;
      background: var(--color-surface-2); color: var(--color-text-primary);
      border: none; outline: none; resize: none;
    }
    #monaco-container { height: 260px; }

    .playground-toolbar {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border);
      background: var(--color-surface);
    }
    .run-btn { gap: var(--space-2); }
    .run-btn-shortcut { font-size: var(--text-xs); color: var(--color-text-muted); }

    .playground-results { flex: 1; overflow: auto; padding: var(--space-4); }
    .results-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--color-text-muted); gap: var(--space-3); }
    .results-empty-icon { font-size: 2rem; }
    .results-meta { font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-3); }
    .results-error { padding: var(--space-4); background: var(--color-accent-light); border-radius: var(--radius-md); border-left: 3px solid var(--color-accent); }
    .results-error-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-accent); margin-bottom: var(--space-1); text-transform: uppercase; }
    .results-error-message { font-size: var(--text-sm); font-family: var(--font-mono); color: var(--color-text-primary); }

    .results-table-wrap { overflow-x: auto; border-radius: var(--radius-md); border: 1px solid var(--color-border); }
    .results-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
    .results-table th { background: var(--color-surface-2); font-weight: var(--weight-semibold); padding: var(--space-3) var(--space-4); text-align: left; border-bottom: 1px solid var(--color-border); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; }
    .results-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); font-family: var(--font-mono); font-size: var(--text-xs); white-space: nowrap; }
    .results-table tr:last-child td { border-bottom: none; }
    .results-table tr:hover td { background: var(--color-surface-2); }
    .cell-null { color: var(--color-text-muted); font-style: italic; }

    .hint-panel { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); background: var(--color-surface); }
    .hint-btn { font-size: var(--text-sm); }
    .hint-count { font-size: var(--text-xs); }
    .hint-response { margin-top: var(--space-3); }
    .hint-message { margin: 0; }

    @media (max-width: 768px) {
      .playground-sidebar { display: none; }
      .playground-editor-wrap { flex: 0 0 200px; }
    }
  `;
    document.head.appendChild(style);
};

const renderResults = (result) => {
    const container = document.getElementById('results-panel');
    if (!container) return;

    if (!result) {
        container.innerHTML = `
      <div class="results-empty">
        <span class="results-empty-icon" aria-hidden="true">⚡</span>
        <p>Run a query to see results here.</p>
      </div>
    `;
        return;
    }

    if (!result.success) {
        container.innerHTML = `
      <div class="results-error" role="alert">
        <p class="results-error-label">Query error</p>
        <p class="results-error-message">${result.error}</p>
      </div>
    `;
        slideUp(container.firstElementChild);
        return;
    }

    if (result.rows.length === 0) {
        container.innerHTML = `
      <div class="results-empty">
        <span class="results-empty-icon" aria-hidden="true">○</span>
        <p>Query returned 0 rows.</p>
      </div>
    `;
        return;
    }

    const headers = result.columns;
    container.innerHTML = `
    <p class="results-meta">${result.rowCount} row${result.rowCount !== 1 ? 's' : ''} returned</p>
    <div class="results-table-wrap">
      <table class="results-table" aria-label="Query results">
        <thead>
          <tr>${headers.map((h) => `<th scope="col">${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${result.rows.map((row) => `
            <tr>
              ${headers.map((h) => {
        const val = row[h];
        return `<td>${val === null || val === undefined ? '<span class="cell-null">null</span>' : val}</td>`;
    }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
    slideUp(container.querySelector('.results-table-wrap'));
};

const runQuery = async () => {
    const sql = getSQL();
    if (!sql.trim()) return;

    const runBtn = document.getElementById('run-btn');
    if (runBtn) { runBtn.disabled = true; runBtn.textContent = 'Running…'; }

    try {
        const result = await http.post('/playground/run', { sql, dataset: datasetSlug, lessonId });
        renderResults(result.data);
    } catch (err) {
        renderResults({ success: false, error: err.message });
    } finally {
        if (runBtn) { runBtn.disabled = false; runBtn.innerHTML = `▶ Run <span class="run-btn-shortcut">⌘↵</span>`; }
    }
};

const renderSchemaPanel = (schema) => {
    if (!schema) return '<p class="text-muted" style="font-size: var(--text-xs)">Loading schema…</p>';

    return Object.entries(schema).map(([tableName, table]) => `
    <div class="schema-table">
      <p class="schema-table-name">${tableName}</p>
      ${Object.entries(table.columns).map(([col, info]) => `
        <div class="schema-col">
          <span class="schema-col-name">${col}</span>
          <span class="schema-col-type">${info.type}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
};

const initMonaco = async () => {
    const monacoContainer = document.getElementById('monaco-container');
    if (!monacoContainer) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
        monacoContainer.innerHTML = `<textarea class="sql-textarea" id="sql-textarea" spellcheck="false" autocomplete="off" aria-label="SQL editor">${currentSQL}</textarea>`;
        return;
    }

    monacoContainer.innerHTML = `<div class="playground-editor-skeleton" aria-label="Loading editor">Loading editor…</div>`;

    try {
        const monaco = await import('https://cdn.jsdelivr.net/npm/monaco-editor@0.46.0/+esm');

        monacoContainer.innerHTML = '';

        editor = monaco.editor.create(monacoContainer, {
            value: currentSQL,
            language: 'sql',
            theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs',
            fontSize: 13,
            lineHeight: 22,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 40, bottom: 12 },
            overviewRulerLanes: 0,
            renderLineHighlight: 'none',
            wordWrap: 'on',
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runQuery);
    } catch (err) {
        monacoContainer.innerHTML = `<textarea class="sql-textarea" id="sql-textarea" spellcheck="false" autocomplete="off" aria-label="SQL editor">${currentSQL}</textarea>`;
        console.warn('[playground] Monaco failed to load, using textarea fallback:', err.message);
    }
};

const loadPlayground = async () => {
    addPlaygroundStyles();

    root.innerHTML = `
    <div class="playground-page">

      <aside class="playground-sidebar" aria-label="Playground tools">
        <div>
          <p class="playground-sidebar-section-title">Starter queries</p>
          ${STARTER_QUERIES.map((q) => `
            <button class="starter-query-btn" data-sql="${encodeURIComponent(q.sql)}" type="button">${q.label}</button>
          `).join('')}
        </div>
        <div>
          <p class="playground-sidebar-section-title">Schema</p>
          <div id="schema-panel">Loading…</div>
        </div>
      </aside>

      <div class="playground-main">
        <div class="playground-editor-wrap">
          <span class="playground-editor-label" aria-hidden="true">SQL</span>
          <div id="monaco-container"></div>
        </div>

        <div class="playground-toolbar">
          <button class="btn btn-primary run-btn" id="run-btn" type="button" aria-label="Run query (Ctrl+Enter)">
            ▶ Run <span class="run-btn-shortcut">⌘↵</span>
          </button>
          <span class="text-muted" style="font-size: var(--text-xs)">Dataset: ${datasetSlug}</span>
        </div>

        <div class="playground-results" id="results-panel" aria-live="polite" aria-label="Query results">
          <div class="results-empty">
            <span class="results-empty-icon" aria-hidden="true">⚡</span>
            <p>Run a query to see results here.</p>
          </div>
        </div>

        ${lessonId ? `<div id="hint-panel-root"></div>` : ''}
      </div>
    </div>
  `;

    await initMonaco();

    document.getElementById('run-btn')?.addEventListener('click', runQuery);

    document.querySelector('.playground-sidebar')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.starter-query-btn');
        if (!btn) return;
        const sql = decodeURIComponent(btn.dataset.sql);
        currentSQL = sql;
        if (editor) { editor.setValue(sql); }
        else { const ta = document.getElementById('sql-textarea'); if (ta) ta.value = sql; }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !editor) {
            e.preventDefault();
            runQuery();
        }
    });

    try {
        const result = await http.get(`/playground/dataset/${datasetSlug}`);
        const schemaPanel = document.getElementById('schema-panel');
        if (schemaPanel) schemaPanel.innerHTML = renderSchemaPanel(result.data.schema);
    } catch {
        const schemaPanel = document.getElementById('schema-panel');
        if (schemaPanel) schemaPanel.innerHTML = '<p class="text-muted" style="font-size: var(--text-xs)">Schema unavailable</p>';
    }

    if (lessonId) {
        const hintRoot = document.getElementById('hint-panel-root');
        const { renderHintButton } = await import('../components/AIChat/index.js');
        if (hintRoot) {
            hintRoot.innerHTML = renderHintButton(lessonId, 0);
            mountHintPanel(hintRoot, { lessonId, getUserCode: getSQL });
        }
    }

    try {
        const gamResult = await http.get('/gamification/summary');
        xpStore.setFromXP(gamResult.data.xp ?? 0);
    } catch { }
};

loadPlayground();