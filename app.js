// 🔴 REPLACE WITH NEW DEPLOYMENT URL
const API = "https://script.google.com/macros/s/AKfycbzRDUwuBn7ffgIbbA8otOYO5e1bKT9WyNud03dffBRXmoDcRlWMNPLbmxraQXGsjCpl/exec"; 
const UPI = "www.kunalwadasker2003-2@oksbi"; 

let dataList = [];
let allRecents = [];
let actRow = null;

// --- INITIALIZATION ---
window.onload = () => {
  updateClock();
  setInterval(updateClock, 1000);
  fetchData();
};

// --- FETCH DATA ---
async function fetchData() {
  const billContainer = document.getElementById("bills-list");
  if (dataList.length === 0) billContainer.innerHTML = '<div class="loader"></div>';

  try {
    const res = await fetch(API + "?action=getData");
    const json = await res.json();
    
    if (json.status === "success") {
      dataList = json.bills;
      allRecents = json.recents;
      
      renderBills(dataList);
      renderHistory(allRecents);
      
      // Update Stats
      document.getElementById("stat-active").innerText = json.stats.active;
      document.getElementById("stat-due").innerText = "₹" + json.stats.totalDue;
      document.getElementById("room-count").innerText = json.stats.bedsOccupied + " / 20";
      document.getElementById("room-bar").style.width = (json.stats.bedsOccupied / 20 * 100) + "%";
    }
  } catch (e) { 
    console.error(e);
    if(dataList.length === 0) billContainer.innerHTML = "<p style='text-align:center; margin-top:20px; color:red'>Connection Failed.</p>";
  }
}

// --- RENDER BILLS (COLOR CODED) ---
function renderBills(list) {
  const box = document.getElementById("bills-list");
  if (list.length === 0) { box.innerHTML = "<p style='text-align:center;color:#999;margin-top:40px'>All Clear! 🎉</p>"; return; }
  
  box.innerHTML = list.map(d => {
    let msg = `Hello ${d.name}, Total: ₹${d.total}. Paid: ₹${d.total - d.due}. Due: ₹${d.due}. Please pay to: ${UPI}`;
    let link = `https://wa.me/${d.phone}?text=${encodeURIComponent(msg)}`;
    let statusLabel = d.color === 'red' ? 'OVERDUE' : (d.color === 'yellow' ? 'PARTIAL' : `DUE: ${d.day}th`);
    let roomBadge = d.room ? `• Room ${d.room}` : "";
    let paidAmt = d.total - d.due;

    let paidHTML = paidAmt > 0 ? `
      <div style="text-align:center; opacity:0.9">
        <div class="amt-label">Paid</div><div class="amt-val">₹${paidAmt}</div>
      </div>` : "";

    return `
    <div class="card status-${d.color}">
      <div class="card-top">
        <div><div class="name">${d.name}</div><div class="type">${d.type} ${roomBadge}</div></div>
        <div style="font-weight:800; opacity:0.9; font-size:12px; background:rgba(0,0,0,0.2); padding:5px 8px; border-radius:8px; height:fit-content;">${statusLabel}</div>
      </div>
      <div class="amt-section">
        <div style="text-align:center; opacity:0.9"><div class="amt-label">Total</div><div class="amt-val">₹${d.total}</div></div>
        ${paidHTML}
        <div style="text-align:center; transform: scale(1.1);"><div class="amt-label">Remaining</div><div class="amt-val">₹${d.due}</div></div>
      </div>
      <div class="actions">
        <a href="${link}" class="btn-act" style="text-align:center; text-decoration:none; padding-top:14px;">WhatsApp</a>
        <button class="btn-act" onclick="prePay(${d.row}, ${d.due})">Partial</button>
        <button class="btn-act" style="background:white; color:#333;" onclick="prePay(${d.row}, ${d.due})">Full Pay</button>
      </div>
    </div>`;
  }).join('');
}

// --- RENDER HISTORY ---
function renderHistory(list) {
  const box = document.getElementById("recent-list");
  if(!list || list.length === 0) { box.innerHTML = "<p style='text-align:center; font-size:12px; color:#999'>No recent entries.</p>"; return; }
  box.innerHTML = list.map(r => `
    <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
       <div><div style="font-weight:700; font-size:16px;">${r.name}</div><div style="font-size:12px; color:#999">${r.type}</div></div>
       <div style="font-size:12px; font-weight:600; background:#F8F9FA; padding:6px 10px; border-radius:8px; color:#555;">${r.date}</div>
    </div>`).join('');
}

// --- ADD CUSTOMER ---
function openModalCat() { openModal('modal-cat'); }

function openAddForm(cat) {
  closeModal('modal-cat');
  openModal('modal-add');
  document.getElementById('form-title').innerText = "Add " + cat;
  document.getElementById('add-category').value = cat;

  if(cat === "Mess") {
    document.getElementById('mess-options').classList.remove('hidden');
    document.getElementById('room-options').classList.add('hidden');
    document.getElementById('add-room-no').value = "";
  } else {
    document.getElementById('mess-options').classList.add('hidden');
    document.getElementById('room-options').classList.remove('hidden');
    setPlan('Room Rent', 2000, null);
  }
}

function setPlan(type, amt, el) {
  document.getElementById('add-type').value = type;
  document.getElementById('add-amount').value = amt;
  if(el) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }
}

document.getElementById('form-add').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.querySelector("#form-add .btn-main");
  btn.innerText = "Saving...";
  
  const payload = {
    action: "add",
    name: document.getElementById('add-name').value,
    phone: document.getElementById('add-phone').value,
    type: document.getElementById('add-type').value,
    amount: document.getElementById('add-amount').value,
    date: document.getElementById('add-date').value,
    category: document.getElementById('add-category').value,
    roomNo: document.getElementById('add-room-no').value
  };

  await fetch(API, { method: "POST", body: JSON.stringify(payload) });
  closeModal('modal-add');
  document.getElementById('form-add').reset();
  btn.innerText = "Save";
  toast("Customer Added Successfully!");
  fetchData();
};

// --- PAY ---
function prePay(r, due) {
  actRow = r;
  document.getElementById('pay-amount').value = due;
  openModal('modal-pay');
}

async function submitPay(full) {
  const amt = document.getElementById('pay-amount').value;
  closeModal('modal-pay');
  toast("Recording Payment...");
  await fetch(API, { method: "POST", body: JSON.stringify({action:"pay", row:actRow, amount:amt, isFull:full}) });
  toast("Payment Saved!");
  fetchData();
}

// --- SEARCH ---
function globalSearch(type) {
  const term = document.getElementById(type === 'bills' ? 'search-inp-bills' : 'search-inp-hist').value.toLowerCase();
  
  if (type === 'bills') {
    const filtered = dataList.filter(i => i.name.toLowerCase().includes(term) || i.phone.includes(term));
    renderBills(filtered);
  } else {
    const filtered = allRecents.filter(i => i.name.toLowerCase().includes(term));
    renderHistory(filtered);
  }
}

// --- UTILS ---
function switchView(id) {
  document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function updateClock() {
  const d = new Date();
  document.getElementById('clock-time').innerText = d.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', hour12:true});
  document.getElementById('clock-date').innerText = d.toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'});
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function toast(msg) { const t = document.getElementById('toast'); t.innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); }
