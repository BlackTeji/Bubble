import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATASETS_DIR = join(__dirname, '../../../content/datasets');

const datasetCache = new Map();

const loadDataset = async (slug) => {
    if (datasetCache.has(slug)) return datasetCache.get(slug);
    const raw = await readFile(join(DATASETS_DIR, `${slug}.json`), 'utf8');
    const dataset = JSON.parse(raw);
    datasetCache.set(slug, dataset);
    return dataset;
};

const ALLOWED_STATEMENTS = ['select'];
const BLOCKED_KEYWORDS = ['drop', 'delete', 'insert', 'update', 'create', 'alter', 'truncate', 'exec', 'execute'];

const validateQuery = (sql) => {
    const normalized = sql.toLowerCase().trim();

    for (const kw of BLOCKED_KEYWORDS) {
        if (normalized.includes(kw)) {
            return { valid: false, error: `${kw.toUpperCase()} statements are not allowed in the playground.` };
        }
    }

    const firstWord = normalized.split(/\s+/)[0];
    if (!ALLOWED_STATEMENTS.includes(firstWord)) {
        return { valid: false, error: `Only SELECT queries are supported in the playground.` };
    }

    if (sql.length > 2000) {
        return { valid: false, error: 'Query is too long.' };
    }

    return { valid: true };
};

const tokenize = (sql) => {
    return sql
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/;$/, '');
};

const parseSelect = (sql) => {
    const normalized = tokenize(sql);
    const upper = normalized.toUpperCase();

    const parsed = { columns: [], table: null, where: null, orderBy: null, orderDir: 'ASC', limit: null, isCount: false, isDistinct: false };

    const fromIdx = upper.indexOf(' FROM ');
    const whereIdx = upper.indexOf(' WHERE ');
    const orderIdx = upper.indexOf(' ORDER BY ');
    const limitIdx = upper.indexOf(' LIMIT ');

    if (fromIdx === -1) throw new Error('Missing FROM clause.');

    const selectPart = normalized.slice(7, fromIdx).trim();

    if (selectPart.toUpperCase().startsWith('COUNT(')) {
        parsed.isCount = true;
    } else if (selectPart.toUpperCase().startsWith('DISTINCT ')) {
        parsed.isDistinct = true;
        parsed.columns = selectPart.slice(9).split(',').map((c) => c.trim());
    } else if (selectPart === '*') {
        parsed.columns = ['*'];
    } else {
        parsed.columns = selectPart.split(',').map((c) => c.trim());
    }

    const afterFrom = normalized.slice(fromIdx + 6).trim();
    const tableEnd = Math.min(
        whereIdx !== -1 ? whereIdx - fromIdx - 6 : Infinity,
        orderIdx !== -1 ? orderIdx - fromIdx - 6 : Infinity,
        limitIdx !== -1 ? limitIdx - fromIdx - 6 : Infinity,
        afterFrom.length
    );
    parsed.table = afterFrom.slice(0, tableEnd).trim().replace(/;$/, '');

    if (whereIdx !== -1) {
        const start = whereIdx + 7;
        const end = Math.min(
            orderIdx !== -1 ? orderIdx : Infinity,
            limitIdx !== -1 ? limitIdx : Infinity,
            normalized.length
        );
        parsed.where = normalized.slice(start, end).trim();
    }

    if (orderIdx !== -1) {
        const start = orderIdx + 10;
        const end = limitIdx !== -1 ? limitIdx : normalized.length;
        const orderPart = normalized.slice(start, end).trim();
        const parts = orderPart.split(/\s+/);
        parsed.orderBy = parts[0];
        parsed.orderDir = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    }

    if (limitIdx !== -1) {
        parsed.limit = parseInt(normalized.slice(limitIdx + 7).trim(), 10);
    }

    return parsed;
};

const evaluateWhere = (row, whereClause) => {
    if (!whereClause) return true;

    const operators = [' >= ', ' <= ', ' != ', ' <> ', ' > ', ' < ', ' = '];

    for (const op of operators) {
        if (whereClause.includes(op)) {
            const [col, valRaw] = whereClause.split(op).map((s) => s.trim());
            const val = valRaw.replace(/^'(.*)'$/, '$1');
            const rowVal = String(row[col] ?? '');
            const numVal = parseFloat(val);

            switch (op.trim()) {
                case '=': return isNaN(numVal) ? rowVal.toLowerCase() === val.toLowerCase() : parseFloat(rowVal) === numVal;
                case '!=':
                case '<>': return isNaN(numVal) ? rowVal.toLowerCase() !== val.toLowerCase() : parseFloat(rowVal) !== numVal;
                case '>': return parseFloat(rowVal) > numVal;
                case '<': return parseFloat(rowVal) < numVal;
                case '>=': return parseFloat(rowVal) >= numVal;
                case '<=': return parseFloat(rowVal) <= numVal;
            }
        }
    }

    const inMatch = whereClause.match(/(\w+)\s+IN\s+\(([^)]+)\)/i);
    if (inMatch) {
        const col = inMatch[1];
        const vals = inMatch[2].split(',').map((v) => v.trim().replace(/^'(.*)'$/, '$1').toLowerCase());
        return vals.includes(String(row[col] ?? '').toLowerCase());
    }

    const betweenMatch = whereClause.match(/(\w+)\s+BETWEEN\s+(.+)\s+AND\s+(.+)/i);
    if (betweenMatch) {
        const col = betweenMatch[1];
        const low = parseFloat(betweenMatch[2].replace(/'/g, ''));
        const high = parseFloat(betweenMatch[3].replace(/'/g, ''));
        return parseFloat(row[col] ?? 0) >= low && parseFloat(row[col] ?? 0) <= high;
    }

    return true;
};

export const executeQuery = async (sql, datasetSlug = 'ecommerce') => {
    const validation = validateQuery(sql);
    if (!validation.valid) {
        return { success: false, error: validation.error, rows: [], columns: [], rowCount: 0 };
    }

    try {
        const dataset = await loadDataset(datasetSlug);
        const parsed = parseSelect(sql);

        const table = dataset.tables[parsed.table];
        if (!table) {
            const available = Object.keys(dataset.tables).join(', ');
            return {
                success: false,
                error: `Table "${parsed.table}" does not exist. Available tables: ${available}`,
                rows: [], columns: [], rowCount: 0,
            };
        }

        let rows = [...table.rows];

        if (parsed.where) {
            rows = rows.filter((row) => evaluateWhere(row, parsed.where));
        }

        if (parsed.orderBy) {
            rows.sort((a, b) => {
                const va = a[parsed.orderBy], vb = b[parsed.orderBy];
                const numeric = !isNaN(parseFloat(va));
                const cmp = numeric ? parseFloat(va) - parseFloat(vb) : String(va).localeCompare(String(vb));
                return parsed.orderDir === 'DESC' ? -cmp : cmp;
            });
        }

        if (parsed.isCount) {
            return { success: true, rows: [{ 'COUNT(*)': rows.length }], columns: ['COUNT(*)'], rowCount: 1 };
        }

        if (parsed.limit) {
            rows = rows.slice(0, parsed.limit);
        }

        const allColumns = Object.keys(table.rows[0] ?? {});
        const selectedColumns = parsed.columns[0] === '*' ? allColumns : parsed.columns;

        const filteredRows = rows.map((row) => {
            const out = {};
            selectedColumns.forEach((col) => { out[col] = row[col] ?? null; });
            return out;
        });

        if (parsed.isDistinct) {
            const seen = new Set();
            const unique = filteredRows.filter((row) => {
                const key = JSON.stringify(row);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            return { success: true, rows: unique, columns: selectedColumns, rowCount: unique.length };
        }

        return { success: true, rows: filteredRows, columns: selectedColumns, rowCount: filteredRows.length };
    } catch (err) {
        return {
            success: false,
            error: err.message.includes('Missing') ? err.message : `Query error: ${err.message}`,
            rows: [], columns: [], rowCount: 0,
        };
    }
};