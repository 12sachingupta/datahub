// public/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('main.js loaded – full featured');

  // ==== 1) TAB SWITCHING ====
  const tabs = {
    CSV: { btn: '[data-id="AbTV"]', panel: '[data-id="Yqpc"]' },
    API: { btn: '[data-id="x3Y4"]' },
    SFTP: { btn: '[data-id="X2-8"]' }
  };
  Object.keys(tabs).forEach(key => {
    const btn = document.querySelector(tabs[key].btn);
    if (!btn) return console.error(`Tab button ${key} not found`);
    btn.addEventListener('click', () => activateTab(key));
  });
  function activateTab(active) {
    Object.entries(tabs).forEach(([key, sel]) => {
      const btn   = document.querySelector(sel.btn);
      const panel = sel.panel && document.querySelector(sel.panel);
      if (btn) {
        btn.classList.toggle('border-blue-400', key === active);
        btn.classList.toggle('text-blue-400', key === active);
        btn.classList.toggle('text-gray-400', key !== active);
      }
      if (panel) panel.style.display = key === active ? 'block' : 'none';
    });
  }
  activateTab('CSV');

  // ==== 2) CSV SECTION ====
  const csvSection     = document.querySelector('[data-id="Yqpc"]');
  const uploadZone     = csvSection.querySelector('[data-id="YZvx"]');
  const liveSyncToggle = csvSection.querySelector('[data-id="HaUG"]');
  const testSaveBtn    = csvSection.querySelector('[data-id="A1GA"]');
  const cancelBtn      = csvSection.querySelector('[data-id="Y_Ho"]');
  let   fileInput      = csvSection.querySelector('input[type="file"]');
  const statusDiv      = ensure(csvSection, 'csv-status-container', 'mt-2 text-sm text-green-400');
  const previewDiv     = ensure(csvSection, 'csv-preview-container mt-4 overflow-x-auto w-full bg-white bg-opacity-10 p-4 rounded mx-auto');

  let allRows = [];
  let syncInterval;

  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = '.csv'; fileInput.style.display = 'none';
    uploadZone.appendChild(fileInput);
  }
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => e.preventDefault());
  uploadZone.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  liveSyncToggle.checked = false;
  liveSyncToggle.addEventListener('change', () => {
    clearInterval(syncInterval);
    if (liveSyncToggle.checked) startLiveSync();
    else statusDiv.textContent = 'Live sync stopped';
  });

  testSaveBtn.addEventListener('click', () => {
    statusDiv.textContent = 'Testing…';
    setTimeout(() => {
      const ok = Math.random() < 0.8;
      statusDiv.textContent = ok
        ? '✅ Test succeeded: Configuration saved'
        : '❌ Test failed: Please adjust your mapping';
    }, 800);
  });

  cancelBtn.addEventListener('click', () => {
    clearInterval(syncInterval);
    previewDiv.innerHTML = '';
    statusDiv.textContent = 'Operation cancelled';
    liveSyncToggle.checked = false;
  });

  async function handleFile(file) {
    clearInterval(syncInterval);
    statusDiv.textContent = `Uploading ${file.name}…`;
    const text = await file.text();
    setTimeout(() => {
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (!lines.length) {
        previewDiv.innerHTML = '<p class="text-red-400">No data to preview</p>';
        statusDiv.textContent = 'Upload succeeded: but file empty';
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim());
      allRows = lines.slice(1, 11).map(r => {
        const cols = r.split(',');
        return headers.reduce((o,h,i) => ({ ...o, [h]: cols[i]||'' }), {});
      });
      statusDiv.textContent = 'Upload succeeded: 200 OK';
      renderCSV(headers, allRows);
    }, 500);
  }

  function renderCSV(headers, rows) {
    previewDiv.innerHTML = '';
    renderSummary(rows.length);
    renderFilter(headers);
    renderTable(headers, rows);
  }

  function renderSummary(total) {
    const valid = Math.floor(total * 0.7);
    const highp = Math.floor(total * 0.2);
    const html = `
      <div class="grid grid-cols-3 gap-4 mb-4 text-white text-sm">
        <div class="p-3 bg-gray-800 rounded"><div>Total Rows</div><div class="text-lg font-bold">${total}</div></div>
        <div class="p-3 bg-gray-800 rounded"><div>Valid Emails</div><div class="text-lg font-bold">${valid}</div></div>
        <div class="p-3 bg-gray-800 rounded"><div>High-Priority</div><div class="text-lg font-bold">${highp}</div></div>
      </div>`;
    previewDiv.insertAdjacentHTML('beforeend', html);
  }

  function renderFilter(headers) {
    const inp = document.createElement('input');
    inp.placeholder = 'Filter rows…';
    inp.className = 'w-full mb-4 px-3 py-2 rounded bg-white/10 text-white placeholder-gray-400';
    inp.addEventListener('input', () => {
      const term = inp.value.toLowerCase();
      const filtered = allRows.filter(r => Object.values(r).some(v => v.toLowerCase().includes(term)));
      renderTable(headers, filtered);
    });
    previewDiv.appendChild(inp);
  }

  function renderTable(headers, rows) {
    const old = previewDiv.querySelector('table');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.className = 'overflow-x-auto w-full';
    const table = document.createElement('table');
    table.className = 'table-auto min-w-full text-sm border-collapse';
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-800';
    const tr  = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.className = 'px-4 py-2 text-left text-cyan-400 border border-gray-700';
      th.textContent = h;
      tr.appendChild(th);
    });
    thead.appendChild(tr); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row,i) => {
      const tr = document.createElement('tr');
      tr.className = i % 2 ? 'bg-gray-600' : 'bg-gray-700';
      headers.forEach(h => {
        const td = document.createElement('td');
        td.className = 'px-4 py-2 text-white border border-gray-700';
        td.textContent = row[h];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    previewDiv.appendChild(wrap);
  }

  function startLiveSync() {
    syncInterval = setInterval(() => {
      if (!allRows.length) return;
      const headers = Object.keys(allRows[0]);
      const batch = [0,1].map(() => {
        const obj = {};
        headers.forEach(h => obj[h] = `${h.slice(0,3).toUpperCase()}_${Math.floor(Math.random()*999)}`);
        return obj;
      });
      allRows.push(...batch);
      renderCSV(headers, allRows);
      statusDiv.textContent = `Live sync: +${batch.length} rows @ ${new Date().toLocaleTimeString()}`;
    }, 5000);
  }

  // ==== 3) INTEGRATIONS ====
  const integrationStatus = createIntegrationStatus();
  const integrations = [
    { id: 'external-feeds',   btn: '[data-id="0Uom"]', title: 'External Feeds' },
    { id: 'inventory-systems',btn: '[data-id="l7DW"]', title: 'Inventory Systems' },
    { id: 'analytics-platforms', btn: '[data-id="E_XK"]', title: 'Analytics Platforms' },
    { id: 'custom-apis',      btn: '[data-id="dbps"]', title: 'Custom APIs' }
  ];

  integrations.forEach(cfg => {
    const btn = document.querySelector(cfg.btn);
    btn.addEventListener('click', () => handleIntegration(cfg));
  });

  function createIntegrationStatus() {
    const container = document.createElement('div');
    container.className = 'mt-8 p-6 bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl border border-white/10 text-white';
    container.innerHTML = `<h3 class="text-lg font-semibold mb-4">Integration Status</h3><div id="integration-content">Select an integration to connect...</div>`;
    document.querySelector('[data-id="J5kj"]').parentNode.appendChild(container);
    return container.querySelector('#integration-content');
  }

  function handleIntegration({ id, title }) {
    integrationStatus.innerHTML = `<p>Connecting to <strong>${title}</strong>…</p>`;
    // simulate connection delay
    setTimeout(() => {
      integrationStatus.innerHTML = `
        <p>✅ <strong>${title}</strong> connected!</p>
        <ul class="mt-2 list-disc list-inside text-sm">
          <li>Last Sync: ${new Date().toLocaleTimeString()}</li>
          <li>Records: ${Math.floor(Math.random()*5000 + 1000)}</li>
          <li>Status: <span class="text-green-400">Active</span></li>
        </ul>
      `;
      // start live updates for this integration
      let count = 0;
      const intv = setInterval(() => {
        count++;
        integrationStatus.innerHTML = `
          <p>✅ <strong>${title}</strong> connected!</p>
          <ul class="mt-2 list-disc list-inside text-sm">
            <li>Last Sync: ${new Date().toLocaleTimeString()}</li>
            <li>Records: ${Math.floor(Math.random()*5000 + 1000)}</li>
            <li>Status: <span class="text-green-400">Active</span></li>
          </ul>
        `;
        if (count===10) clearInterval(intv);
      }, 5000);
    }, 1000);
  }

  // ==== 4) HELPERS ====
  function ensure(root, classes, extra='') {
    let el = root.querySelector(`.${classes.split(' ')[0]}`);
    if (!el) {
      el = document.createElement('div');
      el.className = `${classes} ${extra}`.trim();
      root.appendChild(el);
    }
    return el;
  }
});
