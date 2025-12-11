// 🔴 REPLACE WITH NEW DEPLOYMENT URL
const API = "https://script.google.com/macros/s/AKfycbzRDUwuBn7ffgIbbA8otOYO5e1bKT9WyNud03dffBRXmoDcRlWMNPLbmxraQXGsjCpl/exec"; 
const UPI = "www.kunalwadasker2003-2@oksbi"; 

let dataList = [];
let allRecents = [];
let actRow = null; // Stores the row number currently being edited/paid

// --- INITIALIZATION ---
window.onload = () => {
  updateClock();
  setInterval(updateClock, 1000);
  fetchData();
};

// --- FETCH DATA (GET) ---
async function fetchData() {
  const billContainer = document.getElementById("bills-list");
  
  // Show loader only if we don't have data yet to prevent flickering
  if (dataList.length === 0) {
    billContainer.innerHTML = '<div class="loader"></div>';
  }

  try {
    const res = await fetch(API + "?action=getData");
    const json = await res.json();
    
    if (json.status === "success") {
      dataList = json.bills;
      allRecents = json.recents;
      
      // Render Views
      renderBills(dataList);
      renderHistory(allRecents);
      
      // Update Dashboard Stats
      document.getElementById("stat-active").innerText = json.stats.active;
      document.getElementById("stat-due").innerText = "₹" + json.stats.totalDue;
      
      // Update Room Widget
      document.getElementById("room-count").innerText = json.stats.bedsOccupied + " / 20";
      const percentage = (json.stats.bedsOccupied / 20) * 100;
      document.getElementById("room-bar").style.width = percentage + "%";
    }
  } catch (e) { 
    console.error("Fetch Error:", e);
    if(dataList.length === 0) {
       billContainer.innerHTML = "<p style='text-align:center; margin-top:20px; color:#red'>Connection Failed. Check URL.</p>";
    }
  }
}

// --- RENDER BILL CARDS ---
function renderBills(list) {
  const box = document.getElementById("bills-list");
  
  if (list.length === 0) { 
    box.innerHTML = "<p style='text-align:center;color:#999;margin-top:40px'>All Clear! No pending bills. 🎉</p>"; 
    return; 
  }
  
  box.innerHTML = list.map(d => {
    // WhatsApp Message Generator
    let msg = `Hello ${d.name}, Your Total Bill: ₹${d.total}. Remaining Due: ₹${d.due}. Please pay to: ${UPI}`;
    let link = `https://wa.me/${d.phone}?text=${encodeURIComponent(msg)}`;
    
    // Status Logic
    let statusLabel = "";
    if (d.color === 'red') statusLabel = "OVERDUE";
    else if (d.color === 'yellow') statusLabel = "PARTIAL";
    else statusLabel = `DUE: ${d.day}th`;
    
    let roomBadge = d.room ? `• Room ${d.room}` : "";
    
    // Calculate Paid Amount for Display logic
    let paidAmt = d.total - d.due;
    let paidHTML = "";
    
    // Only show "Paid" section if they have actually paid something
    if (paidAmt > 0) {
        paidHTML = `
        <div style="text-align:center; opacity:0.9">
          <div class="amt-label">Paid</div>
          <div class="amt-val">₹${paidAmt}</div>
        </div>`;
    }

    return `
    <div class="card status-${d.color}">
      <div class="card-top">
        <div>
           <div class="name">${d.name}</div>
           <div class="type">${d.type} ${roomBadge}</div>
        </div>
        <div style="font-weight:800; opacity:0.9; font-size:12px; background:rgba(0,0,0,0.2); padding:5px 8px; border-radius:8px; height:fit-content;">${statusLabel}</div>
      </div>

      <div class="amt-section">
        <div style="text-align:center; opacity:0.9">
          <div class="amt-label">Total</div>
          <div class="amt-val">₹${d.total}</div>
        </div>
        
        ${paidHTML}
        
        <div style="text-align:center; transform: scale(1.1);">
          <div class="amt-label">Remaining</div>
          <div class="amt-val">₹${d.due}</div>
        </div>
      </div>

      <div class="actions">
        <a href="${link}" class="btn-act" style="text-align:center; text-decoration:none; padding-top:14px;">WhatsApp</a>
        <button class="btn-act" onclick="prePay(${d.row}, ${d.due})">Partial</button>
        <button class="btn-act" style="background:white; color:#333; box-shadow:0 4px 10px rgba(0,0,0,0.1)" onclick="prePay(${d.row}, ${d.due})">Full Pay</button>
      </div>
    </div>`;
  }).join('');
}

// --- RENDER HISTORY LIST ---
function renderHistory(list) {
  const box = document.getElementById("recent-list");
  if(!list || list.length === 0) {
    box.innerHTML = "<p style='text-align:center; font-size:12px; color:#999'>No recent entries.</p>";
    return;
  }
  
  box.innerHTML = list.map(r => `
    <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
       <div>
         <div style="font-weight:700; font-size:16px;">${r.name}</div>
         <div style="font-size:12px; color:#999">${r.type}</div>
       </div>
       <div style="font-size:12px; font-weight:600; background:#F8F9FA; padding:6px 10px; border-radius:8px; color:#555;">${r.date}</div>
    </div>
  `).join('');
}

// --- ADD CUSTOMER LOGIC ---

// 1. Open Category Modal
function openModalCat() {
  openModal('modal-cat');
}

// 2. Open Specific Form based on Category
function openAddForm(cat) {
  closeModal('modal-cat');
  openModal('modal-add');
  
  document.getElementById('form-title').innerText = "Add " + cat;
  document.getElementById('add-category').value = cat;

  if(cat === "Mess") {
    document.getElementById('mess-options').classList.remove('hidden');
    document.getElementById('room-options').classList.add('hidden');
    // Reset room number
    document.getElementById('add-room-no').value = "";
  } else {
    document.getElementById('mess-options').classList.add('hidden');
    document.getElementById('room-options').classList.remove('hidden');
    // Auto set plan for room
    setPlan('Room Rent', 2000, null);
  }
}

// 3. Handle Plan Selection (Clicking Chips)
function setPlan(type, amt, el) {
  document.getElementById('add-type').value = type;
  document.getElementById('add-amount').value = amt;
  
  // Highlight selected chip
  if(el) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }
}

// 4. Submit New Customer
document.getElementById('form-add').onsubmit = async (e) => {
  e.preventDefault();
  
  const btn = document.querySelector("#form-add .btn-main");
  const originalText = btn.innerText;
  btn.innerText = "Saving...";
  btn.disabled = true;
  
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

  try {
    await fetch(API, { method: "POST", body: JSON.stringify(payload) });
    closeModal('modal-add');
    document.getElementById('form-add').reset();
    toast("Customer Added Successfully!");
    fetchData(); // Refresh data
  } catch (error) {
    toast("Error Saving");
    console.error(error);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

// --- PAYMENT LOGIC ---

function prePay(r, due) {
  actRow = r;
  document.getElementById('pay-amount').value = due; // Pre-fill with remaining due
  openModal('modal-pay');
}

async function submitPay(full) {
  const amtInput = document.getElementById('pay-amount');
  const amt = amtInput.value;
  
  if(!amt || amt <= 0) return toast("Enter valid amount");

  closeModal('modal-pay');
  toast("Recording Payment...");

  try {
    await fetch(API, { 
      method: "POST", 
      body: JSON.stringify({
        action: "pay", 
        row: actRow, 
        amount: amt, 
        isFull: full
      }) 
    });
    toast("Payment Saved!");
    fetchData();
  } catch (e) {
    toast("Error Processing Payment");
  }
}

// --- SEARCH LOGIC ---
function globalSearch() {
  const term = document.getElementById('search-inp').value.toLowerCase();
  
  // Filter Bills
  const filteredBills = dataList.filter(i => 
    i.name.toLowerCase().includes(term) || i.phone.includes(term)
  );
  
  // Filter History
  const filteredRecents = allRecents.filter(i => 
    i.name.toLowerCase().includes(term)
  );
  
  // Render based on current view
  if(document.getElementById('view-bills').classList.contains('active')) {
     renderBills(filteredBills);
  } else if (document.getElementById('view-history').classList.contains('active')) {
     renderHistory(filteredRecents);
  }
}

// --- NAVIGATION & UI UTILS ---

function switchView(id) {
  // Hide all views
  document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
  // Show selected view
  document.getElementById('view-' + id).classList.add('active');
  
  // Update Nav Icons
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  // If switching to bills or history, re-run search/render in case filters exist
  if(id === 'bills' || id === 'history') globalSearch();
}

function updateClock() {
  const d = new Date();
  document.getElementById('clock-time').innerText = d.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', hour12:true});
  document.getElementById('clock-date').innerText = d.toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'});
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function toast(msg) { 
  const t = document.getElementById('toast'); 
  t.innerText = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), 2000); 
}
