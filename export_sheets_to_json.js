const { google } = require('googleapis');
const fs = require('fs');

async function main() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetName = meta.data.sheets[0].properties.title;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName
  });

  const rows = res.data.values || [];
  if (!rows.length) { console.error('No data found.'); process.exit(1); }

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
