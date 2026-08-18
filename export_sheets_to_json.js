const https = require('https');
const fs = require('fs');

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTS5d70pMMOcasNUJGbF4Cm8RPzq30CHO4d1QQ78VAxAw5Xf5vDEMJNTwhKUfHg9w/pub?output=csv';

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCSV(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const rows = lines.map(line => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
  return rows;
}

async function main() {
  const csv = await fetchCSV(CSV_URL);
  const rows = parseCSV(csv);

  const headerTokens = ['patient id','identificador paciente','file name','nome arquivo','idade','diagnostico','tumor stage','estadio','hcg'];
  const headerRowIndex = rows.findIndex(row =>
    row.map(c => String(c || '').trim().toLowerCase()).some(v => headerTokens.some(t => v.includes(t)))
  );

  if (headerRowIndex === -1) { console.error('Header row not found.'); process.exit(1); }

  const headers = rows[headerRowIndex].map(v => String(v || '').trim());
  const data = rows.slice(headerRowIndex + 1)
    .filter(row => row.some(c => String(c || '').trim() !== ''))
    .map(row => {
      const item = {};
      headers.forEach((header, i) => {
        if (!header) return;
        const value = row[i] !== undefined ? String(row[i]).trim() || null : null;
        item[header] = value;
      });
      return item;
    });

  fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
  console.log(`Exported ${data.length} records to data.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
