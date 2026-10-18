/* app.js — extrait depuis index.html */
const fmtEur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const sliderRevenu = document.getElementById('slider-revenu');
const sliderTaux = document.getElementById('slider-taux');
const sliderDuree = document.getElementById('slider-duree');

const valRevenu = document.getElementById('val-revenu');
const valTaux = document.getElementById('val-taux');
const valDuree = document.getElementById('val-duree');
const pctInfo = document.getElementById('pct-info');
const valCoeff = document.getElementById('val-coeff');

const resMensualite = document.getElementById('res-mensualite');
const resCapital = document.getElementById('res-capital');
const resInterets = document.getElementById('res-interets');

function setSliderText(slider, value) {
  slider.setAttribute('aria-valuetext', value);
}

function debounce(fn, wait = 150) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const ctx = document.getElementById('amortizationChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Capital restant dû (€)',
      data: [],
      borderColor: '#1e3a8a',
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      fill: true,
      tension: 0.25,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 6
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => ' Capital restant : ' + fmtEur.format(item.raw)
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Années écoulées' },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: 'Montant restant dû' },
        ticks: {
          callback: (v) => fmtEur.format(v)
        }
      }
    }
  }
});

function applyChart(labels, data) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update('none');
}

const debouncedApplyChart = debounce(applyChart, 200);

function update(instantChart = false) {
  const revenu = parseFloat(sliderRevenu.value);
  const tauxAnnuel = parseFloat(sliderTaux.value) / 100;
  const dureeAnnees = parseInt(sliderDuree.value, 10);

  const revenuLabel = fmtEur.format(revenu);
  const tauxLabel = (tauxAnnuel * 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
  const dureeLabel = dureeAnnees + ' ans';

  valRevenu.textContent = revenuLabel;
  valTaux.textContent = tauxLabel;
  valDuree.textContent = dureeLabel;

  setSliderText(sliderRevenu, revenuLabel);
  setSliderText(sliderTaux, tauxLabel);
  setSliderText(sliderDuree, dureeLabel);

  // keep aria-valuenow in sync for improved accessibility
  sliderRevenu.setAttribute('aria-valuenow', String(sliderRevenu.value));
  sliderTaux.setAttribute('aria-valuenow', String(sliderTaux.value));
  sliderDuree.setAttribute('aria-valuenow', String(sliderDuree.value));

  const mensualiteMax = (revenu * 0.35) / 12;
  pctInfo.textContent = fmtEur.format(mensualiteMax);

  const i = tauxAnnuel / 12;
  const n = dureeAnnees * 12;

  const coeff = (i > 0) ? (1 - Math.pow(1 + i, -n)) / i : n;

  if (valCoeff) {
    valCoeff.textContent = coeff.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  const capital = mensualiteMax * coeff;
  const totalRembourse = mensualiteMax * n;
  const totalInterets = Math.max(0, totalRembourse - capital);

  resMensualite.textContent = fmtEur.format(mensualiteMax);
  resCapital.textContent = fmtEur.format(capital);
  resInterets.textContent = fmtEur.format(totalInterets);

  const labels = [];
  const crdData = [];
  for (let yr = 0; yr <= dureeAnnees; yr++) {
    labels.push('Année ' + yr);
    const mElapsed = yr * 12;
    const crd = (i > 0)
      ? capital * Math.pow(1 + i, mElapsed) - mensualiteMax * ((Math.pow(1 + i, mElapsed) - 1) / i)
      : capital - mensualiteMax * mElapsed;
    crdData.push(Math.max(0, Math.round(crd)));
  }

  if (instantChart) {
    applyChart(labels, crdData);
  } else {
    debouncedApplyChart(labels, crdData);
  }
}

sliderRevenu.addEventListener('input', () => update(false));
sliderTaux.addEventListener('input', () => update(false));
sliderDuree.addEventListener('input', () => update(false));

sliderRevenu.addEventListener('change', () => update(true));
sliderTaux.addEventListener('change', () => update(true));
sliderDuree.addEventListener('change', () => update(true));

update(true);
