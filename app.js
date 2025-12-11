// 🔴 REPLACE WITH NEW DEPLOYMENT URL
const API = "https://script.google.com/macros/s/AKfycbzRDUwuBn7ffgIbbA8otOYO5e1bKT9WyNud03dffBRXmoDcRlWMNPLbmxraQXGsjCpl/exec"; 
const UPI = "www.kunalwadasker2003-2@oksbi"; 

let dataList = [];
let allRecents = [];
let actRow = null;

window.onload = () => fetchData();

async function fetchData() {
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
  } catch (e) { console.error(e); }
}

function renderBills(list) {
  const box = document.getElementById("bills-list");
  if (list.length === 0) { box.innerHTML = "<p style='text-align:center;color:#999;margin-top:40px'>All Clear! 🎉</p>"; return; }
  
  box.innerHTML = list.map(d => {
    let msg = `Hello ${d.name}, Total Due: ₹${d.due}. Please pay to: ${UPI}`;
    let link = `https://wa.me/${d.phone}?text=${encodeURIComponent(msg)}`;
    let statusClass = `status-${d.color}`; 
    let roomBadge = d.room ? `<span class="badge" style="background:#EEE; color:#333; margin-left:5px;">Room ${d.room}</span>` : "";

    return `
    <div class="card ${statusClass}">
      <div class="card-top">
        <div>
           <div class="name">${d.name} ${roomBadge}</div>
           <div class="type">${d.type}</div>
        </div>
        <div class="badge" style="background:var(--${d.color}); color:white; height:fit-content">${d.color.toUpperCase()}</div>
      </div>
      <div class="amt">₹${d.due}</div>
      <div class="actions">
        <a href="${link}" class="btn-act" style="background:#DCFCE7; color:#16A34A; text-align:center; text-decoration:none; display:block; padding-top:12px;">WhatsApp</a>
        <button class="btn-act bg-part" onclick="prePay(${d.row}, ${d.due})">Partial</button>
        <button class="btn-act bg-pay" onclick="prePay(${d.row}, ${d.due})">Paid</button>
      </div>
    </div>`;
  }).join('');
}

function renderHistory(list) {
  const box = document.getElementById("recent-list");
  if(!list) return;
  box.innerHTML = list.map(r => `
    <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
       <div><div style="font-weight:700">${r.name}</div><div style="font-size:12px; color:#999">${r.type}</div></div>
       <div style="font-size:12px; font-weight:600; background:#F8F9FA; padding:5px 10px; border-radius:8px;">${r.date}</div>
    </div>
  `).join('');
}

// --- ADD FORM LOGIC ---
let selectedCat = "";

function openAddForm(cat) {
  selectedCat = cat;
  closeModal('modal-cat');
  openModal('modal-add');
  document.getElementById('form-title').innerText = "Add " + cat;
  document.getElementById('add-category').value = cat;

  if(cat === "Mess") {
    document.getElementById('mess-options').classList.remove('hidden');
    document.getElementById('room-options').classList.add('hidden');
  } else {
    document.getElementById('mess-options').classList.add('hidden');
    document.getElementById('room-options').classList.remove('hidden');
    setPlan('Room Rent', 2000, null); // Auto set room price
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
  toast("Saving...");
  
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
  toast("Added Successfully");
  fetchData();
};

// --- PAY & SEARCH ---
function prePay(r, due) {
  actRow = r;
  document.getElementById('pay-amount').value = due;
  openModal('modal-pay');
}

async function submitPay(full) {
  closeModal('modal-pay');
  toast("Updating...");
  await fetch(API, { method: "POST", body: JSON.stringify({action:"pay", row:actRow, amount:document.getElementById('pay-amount').value, isFull:full}) });
  fetchData();
}

function globalSearch() {
  const term = document.getElementById('search-inp').value.toLowerCase();
  
  // Filter Bills
  const filteredBills = dataList.filter(i => i.name.toLowerCase().includes(term) || i.phone.includes(term));
  
  // Filter History
  const filteredRecents = allRecents.filter(i => i.name.toLowerCase().includes(term));
  
  if(document.getElementById('view-bills').classList.contains('active')) {
     renderBills(filteredBills);
  } else {
     renderHistory(filteredRecents);
  }
}

// --- UTILS ---
function switchView(id) {
  document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function toast(msg) { const t = document.getElementById('toast'); t.innerText=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000); }
