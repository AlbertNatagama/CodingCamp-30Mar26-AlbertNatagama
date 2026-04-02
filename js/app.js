// ============================================================
// Expense & Budget Visualizer — app.js
// MVP: Input Form, Transaction List, Total Balance, Pie Chart
// Optional Challenges implemented:
//   1. Custom Categories
//   2. Sort transactions (by amount or category)
//   3. Highlight spending over a set limit
//   + Bonus: Dark/Light mode toggle
// ============================================================

// ===== State =====
var transactions    = JSON.parse(localStorage.getItem('ev_transactions'))    || [];
var customCats      = JSON.parse(localStorage.getItem('ev_custom_cats'))     || [];
var spendingLimit   = parseFloat(localStorage.getItem('ev_limit'))           || 0;
var isDark          = localStorage.getItem('ev_theme') === 'dark';
var chart           = null;

// ===== DOM References =====
var itemNameEl    = document.getElementById('itemName');
var amountEl      = document.getElementById('amount');
var categoryEl    = document.getElementById('category');
var addBtn        = document.getElementById('addTransactionBtn');
var listEl        = document.getElementById('transactionList');
var balanceEl     = document.getElementById('totalBalance');
var chartEmptyEl  = document.getElementById('chartEmpty');
var customCatIn   = document.getElementById('customCatInput');
var addCatBtn     = document.getElementById('addCatBtn');
var limitInput    = document.getElementById('limitInput');
var setLimitBtn   = document.getElementById('setLimitBtn');
var limitStatusEl = document.getElementById('limitStatus');
var limitBanner   = document.getElementById('limitBanner');
var sortSelect    = document.getElementById('sortSelect');
var themeBtn      = document.getElementById('themeBtn');

// ===== Utility: Format as Dollar =====
function fmt(amount) {
  return '$' + Number(amount).toFixed(2);
}

// ===== Save to LocalStorage =====
function saveAll() {
  localStorage.setItem('ev_transactions', JSON.stringify(transactions));
  localStorage.setItem('ev_custom_cats',  JSON.stringify(customCats));
  localStorage.setItem('ev_limit',        spendingLimit);
}

// ============================================================
// OPTIONAL CHALLENGE: Dark / Light Mode Toggle
// ============================================================
function applyTheme() {
  if (isDark) {
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeBtn.textContent = '🌙';
  }
  localStorage.setItem('ev_theme', isDark ? 'dark' : 'light');
  // Rebuild chart so legend colors match theme
  if (transactions.length > 0) renderChart();
}

themeBtn.addEventListener('click', function () {
  isDark = !isDark;
  applyTheme();
});

// ============================================================
// OPTIONAL CHALLENGE 1: Custom Categories
// ============================================================
function buildCategoryOptions() {
  var defaults  = ['Food', 'Transport', 'Fun'];
  var current   = categoryEl.value;

  categoryEl.innerHTML = '<option value="">-- Select Category --</option>';

  defaults.forEach(function (cat) {
    var opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryEl.appendChild(opt);
  });

  customCats.forEach(function (cat) {
    var opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryEl.appendChild(opt);
  });

  // Restore previous selection if still available
  if (current) categoryEl.value = current;
}

addCatBtn.addEventListener('click', function () {
  var name = customCatIn.value.trim();
  if (!name) return alert('Please enter a category name.');

  var allCats = ['Food', 'Transport', 'Fun'].concat(customCats);
  if (allCats.indexOf(name) !== -1) {
    return alert('Category "' + name + '" already exists.');
  }

  customCats.push(name);
  saveAll();
  buildCategoryOptions();
  categoryEl.value = name;
  customCatIn.value = '';
});

// ============================================================
// OPTIONAL CHALLENGE 3: Highlight Spending Over Limit
// ============================================================
setLimitBtn.addEventListener('click', function () {
  var val = parseFloat(limitInput.value);
  if (isNaN(val) || val < 0) return alert('Please enter a valid limit.');
  spendingLimit = val;
  saveAll();
  limitInput.value = '';
  render();
});

function renderLimitStatus() {
  var total = transactions.reduce(function (s, t) { return s + t.amount; }, 0);

  if (spendingLimit > 0) {
    var remaining = spendingLimit - total;
    if (remaining >= 0) {
      limitStatusEl.textContent = 'Limit: ' + fmt(spendingLimit) + ' | Remaining: ' + fmt(remaining);
      limitStatusEl.style.color = '#16a34a';
      limitBanner.classList.add('hidden');
    } else {
      limitStatusEl.textContent = 'Limit: ' + fmt(spendingLimit) + ' | Exceeded by: ' + fmt(Math.abs(remaining));
      limitStatusEl.style.color = '#dc2626';
      limitBanner.classList.remove('hidden');
    }
  } else {
    limitStatusEl.textContent = 'No spending limit set.';
    limitStatusEl.style.color = '';
    limitBanner.classList.add('hidden');
  }
}

// ===== Add Transaction (MVP) =====
addBtn.addEventListener('click', function () {
  var name     = itemNameEl.value.trim();
  var amount   = parseFloat(amountEl.value);
  var category = categoryEl.value;

  // Validate all fields (MVP requirement)
  if (!name) {
    alert('Please enter an Item Name.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid Amount greater than 0.');
    return;
  }
  if (!category) {
    alert('Please select a Category.');
    return;
  }

  var tx = {
    id:       Date.now().toString(),
    name:     name,
    amount:   amount,
    category: category,
    date:     new Date().toISOString()
  };

  transactions.unshift(tx);
  saveAll();

  // Reset form
  itemNameEl.value = '';
  amountEl.value   = '';
  categoryEl.value = '';

  render();
});

// ===== Delete Transaction (MVP) =====
function deleteTransaction(id) {
  transactions = transactions.filter(function (t) { return t.id !== id; });
  saveAll();
  render();
}

// ===== Render Balance (MVP) =====
function renderBalance() {
  var total = transactions.reduce(function (s, t) { return s + t.amount; }, 0);
  balanceEl.textContent = fmt(total);
}

// ============================================================
// OPTIONAL CHALLENGE 2: Sort Transactions
// ============================================================
function getSorted() {
  var list = transactions.slice(); // copy
  var mode = sortSelect.value;

  if (mode === 'oldest') {
    list.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  } else if (mode === 'amount-high') {
    list.sort(function (a, b) { return b.amount - a.amount; });
  } else if (mode === 'amount-low') {
    list.sort(function (a, b) { return a.amount - b.amount; });
  } else if (mode === 'category') {
    list.sort(function (a, b) { return a.category.localeCompare(b.category); });
  } else {
    // newest (default — already unshifted, but sort to be safe)
    list.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  }
  return list;
}

sortSelect.addEventListener('change', renderList);

// ===== Render Transaction List (MVP) =====
function renderList() {
  var list = getSorted();

  if (list.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No transactions yet.</div>';
    return;
  }

  listEl.innerHTML = '';

  list.forEach(function (tx) {
    // Optional Challenge 3: flag items that individually exceed the limit
    var isOver = spendingLimit > 0 && tx.amount > spendingLimit;

    var div = document.createElement('div');
    div.className = 'tx-item' + (isOver ? ' over-limit' : '');
    div.innerHTML =
      '<div class="tx-left">' +
        '<div class="tx-name">' + tx.name + (isOver ? ' ⚡' : '') + '</div>' +
        '<div class="tx-amount">' + fmt(tx.amount) + '</div>' +
        '<span class="tx-category">' + tx.category + '</span>' +
      '</div>' +
      '<button class="btn-delete" onclick="deleteTransaction(\'' + tx.id + '\')">Delete</button>';
    listEl.appendChild(div);
  });
}

// ===== Render Chart (MVP) =====
function renderChart() {
  var totals = {};
  transactions.forEach(function (t) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  var labels = Object.keys(totals);
  var data   = Object.values(totals);

  if (labels.length === 0) {
    chartEmptyEl.style.display = 'block';
    if (chart) { chart.destroy(); chart = null; }
    return;
  }
  chartEmptyEl.style.display = 'none';

  var colorMap = {
    Food:      '#27ae60',
    Transport: '#3b8fe8',
    Fun:       '#e67e22'
  };
  var extras = ['#9b59b6', '#e74c3c', '#1abc9c', '#f39c12', '#2ecc71', '#e91e63'];
  var ei = 0;
  var bgColors = labels.map(function (l) {
    return colorMap[l] || extras[ei++ % extras.length];
  });

  var ctx = document.getElementById('spendingChart').getContext('2d');
  if (chart) { chart.destroy(); chart = null; }

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data:            data,
        backgroundColor: bgColors,
        borderColor:     isDark ? '#1f2937' : '#ffffff',
        borderWidth:     2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:          isDark ? '#f9fafb' : '#222222',
            font:           { size: 11 },
            padding:        12,
            usePointStyle:  true
          }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ' ' + ctx.label + ': ' + fmt(ctx.parsed);
            }
          }
        }
      }
    }
  });
}

// ===== Full Render =====
function render() {
  renderBalance();
  renderLimitStatus();
  renderList();
  renderChart();
}

// ===== Init =====
applyTheme();
buildCategoryOptions();
render();
