// 🔴 PASTE GOOGLE SCRIPT URL HERE
const API = "https://script.google.com/macros/s/AKfycbzRDUwuBn7ffgIbbA8otOYO5e1bKT9WyNud03dffBRXmoDcRlWMNPLbmxraQXGsjCpl/exec";
const UPI = "www.kunalwadasker2003-2@oksbi"; // 🔴 PASTE UPI ID HERE

let dataList = [];
let actRow = null;

// INIT
window.onload = () => {
  updateClock();
  setInterval(updateClock, 1000);
  fetchData();
};

async function fetchData() {
  try {
    const res = await fetch(API + "?action=getData");
    const json = await res.json();
    dataList = json.bills;
    render(dataList);
    document.getElementById("stat-active").innerText = json.stats.active;
    document.getElementById("stat-due").innerText = "₹" + json.stats.due;
  } catch (e) { console.log(e); }
}

function render(list) {
  const box = document.getElementById("bills-list");
  if (list.length === 0) { box.innerHTML = "<p style='text-align:center;color:#999;margin-top:50px'>All Paid! 🎉</p>"; return; }
  
  box.innerHTML = list.map(d => {
    let msg = `Hello ${d.name}, Bill Due: ₹${d.due}. Please pay to: ${UPI}`;
    let link = `https://wa.me/${d.phone}?text=${encodeURIComponent(msg)}`;
    let badge = d.color === 'red' ? 'bg-red' : 'bg-blue';
    let status = d.color === 'red' ? 'OVERDUE' : `Due: ${d.day}th`;
    
    return `
    <div class="card">
      <div class="card-top">
        <div><div class="name">${d.name}</div><div class="type">${d.type}</div></div>
        <div class="badge ${badge}">${status}</div>
      </div>
      <div class="amt-row">
        <div class="type">Amount</div><div class="due-amt">₹${d.due}</div>
      </div>
      <div class="actions">
        <a href="${link}" class="btn-icon bg-wa"><span class="material-icons-round">whatsapp</span></a>
        <button class="btn-icon bg-pay" onclick="prePay(${d.row}, ${d.due})">Pay</button>
        <button class="btn-icon bg-part" onclick="prePay(${d.row}, ${d.due})">Partial</button>
        <button class="btn-icon bg-del" onclick="del(${d.row})"><span class="material-icons-round">delete</span></button>
      </div>
    </div>`;
  }).join('');
}

// NAVIGATION
function switchView(id) {
  document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  if(id === 'bills') fetchData();
}

function updateClock() {
  const d = new Date();
  document.getElementById('clock-time').innerText = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  document.getElementById('clock-date').innerText = d.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
}

// ACTIONS
function setPlan(type, amt, el) {
  document.getElementById('add-type').value = type;
  document.getElementById('add-amount').value = amt;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

document.getElementById('form-add').onsubmit = async (e) => {
  e.preventDefault();
  toast("Saving...");
  const body = {
    action: "add",
    name: document.getElementById('add-name').value,
    phone: document.getElementById('add-phone').value,
    type: document.getElementById('add-type').value,
    amount: document.getElementById('add-amount').value,
    date: document.getElementById('add-date').value
  };
  await fetch(API, {method: "POST", body: JSON.stringify(body)});
  closeModal('modal-add');
  document.getElementById('form-add').reset();
  toast("Added!");
  fetchData();
};

function prePay(r, due) {
  actRow = r;
  document.getElementById('pay-amount').value = due;
  openModal('modal-pay');
}

async function submitPay(full) {
  closeModal('modal-pay');
  toast("Updating...");
  await fetch(API, {method:"POST", body:JSON.stringify({action:"pay", row:actRow, amount:document.getElementById('pay-amount').value, isFull:full})});
  toast("Paid!");
  fetchData();
}

async function del(r) {
  if(!confirm("Delete?")) return;
  toast("Deleting...");
  await fetch(API, {method:"POST", body:JSON.stringify({action:"delete", row:r})});
  toast("Deleted");
  fetchData();
}

// SEARCH
function filterBills() {
  const term = document.getElementById('search').value.toLowerCase();
  render(dataList.filter(i => i.name.toLowerCase().includes(term)));
}

// UI UTILS
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function toast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2000);
}
