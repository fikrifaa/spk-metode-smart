/* ── DATA & CONSTANTS ───────────────────────── */
const CRITERIA = [
  { key:'harga',      code:'C1', label:'Harga Paket Bulanan',    type:'cost',    defW:25 },
  { key:'kecepatan',  code:'C2', label:'Kecepatan (Bandwidth)',  type:'benefit', defW:25 },
  { key:'kuota',      code:'C3', label:'Kuota (FUP)',            type:'benefit', defW:15 },
  { key:'stabilitas', code:'C4', label:'Tingkat Stabilitas',     type:'benefit', defW:15 },
  { key:'jangkauan',  code:'C5', label:'Jangkauan (Coverage)',   type:'benefit', defW:10 },
  { key:'layanan',    code:'C6', label:'Layanan Pelanggan',      type:'benefit', defW:10 },
];

const QUAL_MAP = {
  'terbatas':20, 'cukup':40, 'standar':60,
  'stabil':80, 'sangat baik':100
};

const QUAL_OPTS = [
  'Terbatas', 'Cukup','Standar',
  'Stabil', 'Sangat Baik'
];

let weights = CRITERIA.map(c => c.defW);

/* 10 ISP — sesuai Tabel 1 (Data Mentah) di PPT.
   Label C4-C6 sudah dipetakan ke 5 opsi QUAL_OPTS yang valid:
   Sangat Luas/Sangat Stabil/Sangat Responsif -> Sangat Baik
   Luas/Responsif                              -> Stabil
   Cukup/Standar/Terbatas                      -> tetap */
let data = [
  { nama:'IndiHome',        harga:350000, kecepatan:20, kuota:100, stabilitas:'Standar',     jangkauan:'Sangat Baik', layanan:'Stabil'     },
  { nama:'Biznet Home',     harga:375000, kecepatan:30, kuota:150, stabilitas:'Stabil',      jangkauan:'Stabil',      layanan:'Standar'    },
  { nama:'First Media',     harga:400000, kecepatan:25, kuota:120, stabilitas:'Stabil',      jangkauan:'Cukup',       layanan:'Stabil'     },
  { nama:'MyRepublic',      harga:350000, kecepatan:30, kuota:150, stabilitas:'Stabil',      jangkauan:'Cukup',       layanan:'Standar'    },
  { nama:'CBN Fiber',       harga:300000, kecepatan:20, kuota:100, stabilitas:'Standar',     jangkauan:'Terbatas',    layanan:'Stabil'     },
  { nama:'XL Satu Fiber',   harga:320000, kecepatan:30, kuota:100, stabilitas:'Standar',     jangkauan:'Standar',     layanan:'Standar'    },
  { nama:'Oxygen.id',       harga:306000, kecepatan:25, kuota:150, stabilitas:'Stabil',      jangkauan:'Terbatas',    layanan:'Standar'    },
  { nama:'Biznet Metronet', harga:600000, kecepatan:50, kuota:500, stabilitas:'Sangat Baik', jangkauan:'Stabil',      layanan:'Sangat Baik'},
  { nama:'MNC Play',        harga:360000, kecepatan:20, kuota:100, stabilitas:'Stabil',      jangkauan:'Cukup',       layanan:'Standar'    },
  { nama:'Groovy',          harga:280000, kecepatan:20, kuota:100, stabilitas:'Standar',     jangkauan:'Terbatas',    layanan:'Standar'    },
];

/* ── HELPERS ────────────────────────────────── */
function resolveVal(v) {
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!isNaN(s) && s !== '') return parseFloat(s);
  const n = s.toLowerCase();
  for (const k in QUAL_MAP) if (n.includes(k)) return QUAL_MAP[k];
  return 40;
}

function computeScales() {
  const sc = data.map(() => ({}));
  CRITERIA.forEach(c => {
    const raw = data.map(r => resolveVal(r[c.key]));
    const mn = Math.min(...raw), mx = Math.max(...raw);
    raw.forEach((v, i) => {
      sc[i][c.key] = mx === mn ? 100 :
        c.type === 'benefit' ? 100 * (v - mn) / (mx - mn)
                              : 100 * (mx - v) / (mx - mn);
    });
  });
  return sc;
}

function computeResults() {
  const sc = computeScales();
  const tw = weights.reduce((a, b) => a + b, 0) || 1;
  return data.map((r, i) => {
    let v = 0; const contrib = {};
    CRITERIA.forEach((c, j) => {
      const u = sc[i][c.key];
      contrib[c.key] = { u };
      v += (weights[j] / tw) * u;
    });
    return { nama: r.nama, value: v, contrib };
  }).sort((a, b) => b.value - a.value);
}

/* ── NAVIGATION ─────────────────────────────── */
const navItems    = document.querySelectorAll('.nav-item');
const tabPanes    = document.querySelectorAll('.tab-pane');
const pageTitleEl = document.getElementById('pageTitle');
const PAGE_TITLES = {
  'tab-kriteria':   'Bobot Kriteria',
  'tab-alternatif': 'Data Alternatif',
  'tab-hasil':      'Hasil Evaluasi'
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const target = item.dataset.tab;
    tabPanes.forEach(p => {
      p.classList.remove('active');
      if (p.id === target) p.classList.add('active');
    });
    pageTitleEl.textContent = PAGE_TITLES[target] || '';
  });
});

/* ── STALE WEIGHT INDICATOR ─────────────────── */
let weightsStale     = false;
let snapshotWeights  = null;

const staleBarEl = document.getElementById('staleBar');

function setWeightsStale(val) {
  weightsStale = val;
  staleBarEl.classList.toggle('visible', val);
}

document.getElementById('btnHitung').addEventListener('click', () => {
  doCalculate();
  navItems.forEach(n => n.classList.remove('active'));
  document.querySelector('[data-tab="tab-hasil"]').classList.add('active');
  tabPanes.forEach(p => p.classList.remove('active'));
  document.getElementById('tab-hasil').classList.add('active');
  pageTitleEl.textContent = 'Hasil Evaluasi';
});

/* ── DARK MODE ──────────────────────────────── */
let dark = false;
document.getElementById('darkBtn').addEventListener('click', () => {
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  document.getElementById('darkIcon').className   = dark ? 'ti ti-sun' : 'ti ti-moon';
  document.getElementById('darkLabel').textContent = dark ? 'Mode Terang' : 'Mode Gelap';
});

/* ── WEIGHT SLIDERS ─────────────────────────── */
const slidersEl = document.getElementById('weightSliders');
const totalWEl  = document.getElementById('totalWeight');

function initSliders() {
  slidersEl.innerHTML = '';
  CRITERIA.forEach((c, i) => {
    const badgeCls = c.type === 'cost' ? 'badge-cost' : 'badge-benefit';
    const div = document.createElement('div');
    div.className = 'weight-item';
    div.innerHTML = `
      <div class="weight-meta">
        <span class="weight-code">${c.code}</span>
        <span class="weight-label-text">${c.label}</span>
        <span class="badge ${badgeCls} weight-type">${c.type}</span>
      </div>
      <input type="range" min="0" max="100" step="1" value="${weights[i]}" data-idx="${i}">
      <span class="weight-val" id="wv${i}">${weights[i]}%</span>
    `;
    slidersEl.appendChild(div);
  });

  slidersEl.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', e => {
      weights[+e.target.dataset.idx] = +e.target.value;
      updateSliderDisplay();
      setWeightsStale(true);
    });
  });
  updateSliderDisplay();
}

function updateSliderDisplay() {
  const inputs = slidersEl.querySelectorAll('input');
  inputs.forEach((inp, i) => {
    inp.value = weights[i];
    document.getElementById('wv' + i).textContent = weights[i] + '%';
  });
  const tot = weights.reduce((a, b) => a + b, 0);
  totalWEl.textContent = tot + '%';
  totalWEl.style.color = tot === 100
    ? 'var(--green)'
    : (tot > 100 ? 'var(--red)' : 'var(--amber)');
}

document.getElementById('btnReset').addEventListener('click', () => {
  weights = CRITERIA.map(c => c.defW);
  initSliders();
  setWeightsStale(true);
});

document.getElementById('btnNorm').addEventListener('click', () => {
  const tot = weights.reduce((a, b) => a + b, 0);
  if (!tot) { weights = CRITERIA.map(() => Math.round(100 / CRITERIA.length)); }
  else { weights = weights.map(w => Math.round(w / tot * 100)); }
  const diff = 100 - weights.reduce((a, b) => a + b, 0);
  weights[0] += diff;
  initSliders();
  setWeightsStale(true);
});

/* ── TABLE ──────────────────────────────────── */
const dataBody = document.getElementById('dataBody');
const nbAlt    = document.getElementById('nb-alternatif');

function qualSelect(val, i, k) {
  const opts = QUAL_OPTS.map(o =>
    `<option value="${o}" ${String(val).toLowerCase() === o.toLowerCase() ? 'selected' : ''}>${o}</option>`
  ).join('');
  return `<select class="tbl-input" data-i="${i}" data-k="${k}">${opts}</select>`;
}

function renderTable() {
  dataBody.innerHTML = '';
  data.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="tbl-input" value="${row.nama}" data-i="${i}" data-k="nama"></td>
      <td><input type="number" class="tbl-input" value="${row.harga}"     data-i="${i}" data-k="harga"     min="0"></td>
      <td><input type="number" class="tbl-input" value="${row.kecepatan}" data-i="${i}" data-k="kecepatan" min="0"></td>
      <td><input type="number" class="tbl-input" value="${row.kuota}"     data-i="${i}" data-k="kuota"     min="0"></td>
      <td>${qualSelect(row.stabilitas, i, 'stabilitas')}</td>
      <td>${qualSelect(row.jangkauan,  i, 'jangkauan')}</td>
      <td>${qualSelect(row.layanan,    i, 'layanan')}</td>
      <td>
        <button class="btn btn-danger-ghost btn-icon" data-i="${i}" title="Hapus baris">
          <i class="ti ti-trash" style="font-size:15px"></i>
        </button>
      </td>
    `;
    dataBody.appendChild(tr);
  });

  dataBody.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', e => {
      const { i, k } = e.target.dataset;
      data[i][k] = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    });
  });

  dataBody.querySelectorAll('.btn-danger-ghost').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = +e.currentTarget.dataset.i;
      data.splice(idx, 1);
      renderTable();
    });
  });

  nbAlt.textContent = data.length;
}

document.getElementById('btnAdd').addEventListener('click', () => {
  data.push({
    nama:'Alternatif Baru', harga:300000, kecepatan:20,
    kuota:100, stabilitas:'Standar', jangkauan:'Standar', layanan:'Standar'
  });
  renderTable();
});

document.getElementById('btnImport').addEventListener('click', () => {
  document.getElementById('fileImport').click();
});

document.getElementById('fileImport').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const imported = JSON.parse(evt.target.result);
      if (Array.isArray(imported) && imported.length) {
        data = imported;
        renderTable();
        alert('Data berhasil diimpor: ' + imported.length + ' alternatif.');
      } else {
        alert('Format JSON tidak valid atau kosong.');
      }
    } catch {
      alert('Gagal membaca file. Pastikan file berformat JSON yang valid.');
    }
  };
  reader.readAsText(file);
  this.value = '';
});

/* ── RESULTS ────────────────────────────────── */
function renderWeightSnapshot() {
  const chipsEl = document.getElementById('weightChips');
  const tsEl    = document.getElementById('snapshotTs');
  if (!snapshotWeights) {
    chipsEl.innerHTML = '<span style="font-size:12.5px;color:var(--text-3)">Belum ada perhitungan — klik "Hitung" untuk memulai.</span>';
    tsEl.textContent = '—';
    return;
  }
  chipsEl.innerHTML = CRITERIA.map((c, i) => `
    <div class="weight-chip">
      <span class="weight-chip-code">${c.code}</span>
      <span class="weight-chip-label" title="${c.label}">${c.label}</span>
      <span class="weight-chip-val">${snapshotWeights[i]}%</span>
    </div>
  `).join('');
  const now = new Date();
  tsEl.innerHTML = `<i class="ti ti-clock"></i> Dihitung ${now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}`;
}

function renderResults() {
  const metricsEl  = document.getElementById('metricsGrid');
  const rankEl     = document.getElementById('rankList');
  const breakThead = document.querySelector('#tblBreak thead');
  const breakTbody = document.querySelector('#tblBreak tbody');

  renderWeightSnapshot();

  if (!data.length) {
    metricsEl.innerHTML = '';
    rankEl.innerHTML = `<div class="empty-state"><i class="ti ti-database-off"></i><p>Belum ada data alternatif untuk dihitung.</p></div>`;
    breakThead.innerHTML = '';
    breakTbody.innerHTML = '';
    return;
  }

  const results = computeResults();
  const maxVal  = Math.max(...results.map(r => r.value), 1);
  const winner  = results[0];

  /* Metric cards */
  metricsEl.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Jumlah Alternatif</div>
      <div class="metric-val">${data.length}</div>
      <div class="metric-sub">${CRITERIA.length} kriteria dievaluasi</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Skor Tertinggi</div>
      <div class="metric-val" style="color:var(--blue); font-family:var(--mono)">${winner.value.toFixed(2)}</div>
      <div class="metric-sub">dari skala 0 – 100</div>
    </div>
    <div class="metric-card" style="border-left:3px solid var(--amber)">
      <div class="metric-label">Rekomendasi Terbaik</div>
      <div class="metric-val" style="font-size:18px;color:var(--amber-text)">${winner.nama}</div>
      <div class="metric-sub">nilai utilitas agregat tertinggi</div>
    </div>
  `;

  /* Rank cards */
  rankEl.innerHTML = results.map((r, i) => `
    <div class="rank-card rank-${i+1}">
      <div class="rank-num">${i + 1}</div>
      <div class="rank-info">
        <div class="rank-top">
          <span class="rank-name">${r.nama}</span>
          <span class="rank-score">${r.value.toFixed(2)}</span>
        </div>
        <div class="prog-bg">
          <div class="prog-bar" style="width:${((r.value / maxVal) * 100).toFixed(1)}%"></div>
        </div>
      </div>
    </div>
  `).join('');

  /* Breakdown table */
  breakThead.innerHTML = `
    <tr>
      <th>Rank</th>
      <th>Alternatif</th>
      ${CRITERIA.map(c => `<th style="text-align:right">${c.code}</th>`).join('')}
      <th style="text-align:right">Total Vᵢ</th>
    </tr>
  `;
  breakTbody.innerHTML = results.map((r, i) => `
    <tr>
      <td class="rank-col">${i + 1}</td>
      <td><strong>${r.nama}</strong></td>
      ${CRITERIA.map(c => `<td class="val-col">${r.contrib[c.key].u.toFixed(1)}</td>`).join('')}
      <td class="total-col">${r.value.toFixed(2)}</td>
    </tr>
  `).join('');
}

function doCalculate() {
  snapshotWeights = [...weights];
  setWeightsStale(false);
  renderResults();
}

document.getElementById('btnCalc').addEventListener('click', doCalculate);

/* ── INIT ───────────────────────────────────── */
initSliders();
renderTable();
doCalculate();