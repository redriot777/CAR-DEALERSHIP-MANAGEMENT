// Car Dealership Management System - frontend logic (vanilla JS, no page reloads)

// Same origin when served by Express. Falls back to localhost if index.html is opened directly.
const API_URL = (location.protocol === 'file:' ? 'http://localhost:5000' : '') + '/api/cars';

let cars = [];          // latest records from the database
let editingId = null;   // id of the car being edited (null = adding)

const $ = (id) => document.getElementById(id);
const form = $('carForm');
const fields = {
  brand: $('brand'), model: $('model'), variant: $('variant'), year: $('year'),
  fuel: $('fuel'), transmission: $('transmission'), price: $('price'), status: $('status'),
};
const viewModal = new bootstrap.Modal($('viewModal'));
const MAX_YEAR = new Date().getFullYear() + 1;
const MIN_YEAR = 1990;
fields.year.min = MIN_YEAR;
fields.year.max = MAX_YEAR;
$('yearFeedback').textContent = `Enter a whole year between ${MIN_YEAR} and ${MAX_YEAR}.`;

// ---------- Helpers ----------
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const formatPrice = (p) => '₹ ' + Number(p).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const STATUS_CLASS = {
  'Available': 'text-bg-success', 'Reserved': 'text-bg-warning',
  'Sold': 'text-bg-secondary', 'Under Service': 'text-bg-info',
};
const statusBadge = (s) => `<span class="badge badge-status ${STATUS_CLASS[s] || 'text-bg-light'}">${escapeHtml(s)}</span>`;

function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `<div class="d-flex"><div class="toast-body"></div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  el.querySelector('.toast-body').textContent = message;
  $('toastContainer').appendChild(el);
  el.addEventListener('hidden.bs.toast', () => el.remove());
  new bootstrap.Toast(el, { delay: 4000 }).show();
}

// Wrapper around fetch() that turns every failure into a readable Error
async function api(path = '', options = {}) {
  let response;
  try {
    response = await fetch(API_URL + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch (e) {
    throw new Error('Cannot reach the server. Make sure it is running (npm start).');
  }
  let data = null;
  try { data = await response.json(); } catch (e) { /* no JSON body */ }
  if (!response.ok) {
    const details = data && Array.isArray(data.errors) ? ' ' + data.errors.join(' ') : '';
    throw new Error(((data && data.message) || `Request failed (${response.status}).`) + details);
  }
  return data;
}

// ---------- Rendering ----------
function renderStats() {
  const count = (s) => cars.filter((c) => c.status === s).length;
  $('statTotal').textContent = cars.length;
  $('statAvailable').textContent = count('Available');
  $('statReserved').textContent = count('Reserved');
  $('statSold').textContent = count('Sold');
}

function renderTable() {
  const q = $('searchInput').value.trim().toLowerCase();
  const rows = cars.filter((c) => !q ||
    [c.brand, c.model, c.variant, c.fuel_type, c.status].some((v) => String(v).toLowerCase().includes(q)));
  const body = $('carTableBody');

  if (rows.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="10" class="text-center text-muted">${
      cars.length === 0 ? 'No cars in the inventory yet. Add one using the form above.' : 'No cars match your search.'}</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((c) => `
    <tr>
      <td>${c.id}</td>
      <td>${escapeHtml(c.brand)}</td>
      <td>${escapeHtml(c.model)}</td>
      <td>${escapeHtml(c.variant)}</td>
      <td>${c.manufacturing_year}</td>
      <td>${escapeHtml(c.fuel_type)}</td>
      <td>${escapeHtml(c.transmission)}</td>
      <td class="text-nowrap">${formatPrice(c.price)}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-primary" data-action="view" data-id="${c.id}" title="View"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-warning" data-action="edit" data-id="${c.id}" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${c.id}" title="Delete"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
}

// Fetch everything from the database, then redraw the table and the statistics
async function loadCars() {
  try {
    cars = await api();
    renderStats();
    renderTable();
  } catch (err) {
    showToast('✕ Failed to load cars. ' + err.message, 'danger');
  }
}

// ---------- Form ----------
function clearValidation() {
  Object.values(fields).forEach((f) => f.classList.remove('is-invalid'));
}

function validateForm() {
  clearValidation();
  const year = Number(fields.year.value);
  const price = Number(fields.price.value);
  const checks = {
    brand: fields.brand.value.trim() !== '',
    model: fields.model.value.trim() !== '',
    variant: fields.variant.value.trim() !== '',
    year: fields.year.value !== '' && Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR,
    fuel: fields.fuel.value !== '',
    transmission: fields.transmission.value !== '',
    price: fields.price.value !== '' && Number.isFinite(price) && price > 0,
    status: fields.status.value !== '',
  };
  let valid = true;
  for (const [name, ok] of Object.entries(checks)) {
    if (!ok) { fields[name].classList.add('is-invalid'); valid = false; }
  }
  return valid;
}

function resetForm() {
  form.reset();
  clearValidation();
  editingId = null;
  $('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Add Car';
  $('cancelBtn').classList.add('d-none');
  $('formTitle').textContent = 'Add a New Car';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    brand: fields.brand.value.trim(),
    model: fields.model.value.trim(),
    variant: fields.variant.value.trim(),
    manufacturing_year: Number(fields.year.value),
    fuel_type: fields.fuel.value,
    transmission: fields.transmission.value,
    price: Number(fields.price.value),
    status: fields.status.value,
  };
  const isEdit = editingId !== null;

  try {
    await api(isEdit ? `/${editingId}` : '', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    resetForm();
    showToast(isEdit ? '✓ Car updated successfully!' : '✓ Car added successfully!');
    await loadCars();
  } catch (err) {
    showToast(`✕ Failed to ${isEdit ? 'update' : 'add'} car. ${err.message}`, 'danger');
  }
});

$('cancelBtn').addEventListener('click', resetForm);
$('searchInput').addEventListener('input', renderTable);

// ---------- View / Edit / Delete (event delegation on the table) ----------
$('carTableBody').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === 'view') viewCar(id);
  if (btn.dataset.action === 'edit') editCar(id);
  if (btn.dataset.action === 'delete') deleteCar(id);
});

async function viewCar(id) {
  try {
    const c = await api(`/${id}`);
    const row = (label, value) => `<dt class="col-5">${label}</dt><dd class="col-7">${value}</dd>`;
    $('viewModalBody').innerHTML =
      row('ID', c.id) + row('Brand', escapeHtml(c.brand)) + row('Model', escapeHtml(c.model)) +
      row('Variant', escapeHtml(c.variant)) + row('Manufacturing Year', c.manufacturing_year) +
      row('Fuel Type', escapeHtml(c.fuel_type)) + row('Transmission', escapeHtml(c.transmission)) +
      row('Price', formatPrice(c.price)) + row('Status', statusBadge(c.status)) +
      row('Created', formatDate(c.created_at));
    viewModal.show();
  } catch (err) {
    showToast('✕ Failed to load car details. ' + err.message, 'danger');
  }
}

async function editCar(id) {
  try {
    const c = await api(`/${id}`);
    fields.brand.value = c.brand;
    fields.model.value = c.model;
    fields.variant.value = c.variant;
    fields.year.value = c.manufacturing_year;
    fields.fuel.value = c.fuel_type;
    fields.transmission.value = c.transmission;
    fields.price.value = Number(c.price);
    fields.status.value = c.status;
    clearValidation();
    editingId = c.id;
    $('submitBtn').innerHTML = '<i class="bi bi-check-circle"></i> Update Car';
    $('cancelBtn').classList.remove('d-none');
    $('formTitle').textContent = `Edit Car #${c.id}`;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    fields.brand.focus({ preventScroll: true });
  } catch (err) {
    showToast('✕ Failed to load car for editing. ' + err.message, 'danger');
  }
}

async function deleteCar(id) {
  if (!confirm('Are you sure you want to delete this car?')) return;
  try {
    await api(`/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    showToast('✓ Car deleted successfully!');
    await loadCars();
  } catch (err) {
    showToast('✕ Failed to delete car. ' + err.message, 'danger');
  }
}

// ---------- Start ----------
loadCars();
