// 🔴 REPLACE THIS WITH YOUR NEW DEPLOYMENT URL
const API = "https://script.google.com/macros/s/AKfycbzRDUwuBn7ffgIbbA8otOYO5e1bKT9WyNud03dffBRXmoDcRlWMNPLbmxraQXGsjCpl/exec";

// 🔴 REPLACE THIS WITH YOUR UPI ID
const UPI = "www.kunalwadasker2003-2@oksbi"; 

let dataList = [];
let actRow = null;

// --- INITIALIZATION ---
window.onload = () => {
  updateClock();
  setInterval(updateClock, 1000);
  fetchData();
};

// --- FETCH DATA (GET) ---
async function fetchData() {
  const listContainer = document.getElementById("bills-list");
  // Show loader only if list is empty
  if(dataList.length === 0) {
      listContainer.innerHTML = '<div class="loader"></div>';
  }

  try {
    const res = await fetch(API + "?action=getData");
    const json = await res.json();
    
    if (json.status === "success") {
      dataList = json.bills;
      render(dataList);
      
      // Update Stats
      document.getElementById("stat-active").innerText = json.stats.active;
      document.getElementById("stat-due").innerText = "₹" + json.stats.due;
    }
  } catch (e) { 
    console.error("Fetch Error:", e);
    // Only show error if list is empty
    if(dataList.length === 0) {
      listContainer.innerHTML = "<p style='text-align:center; margin-top:20px;'>Failed to load. Check connection.</p>";
    }
  }
}

// --- RENDER BILLS ---
function render(list) {
  const box = document.getElementById("bills-list");
  if (list.length === 0) { 
    box.innerHTML = "<p style='text-align:center;color:#999;margin-top:50px'>All Paid! 🎉</p>"; 
    return; 
  }
  
  box.innerHTML = list.map(d => {
    let msg = `Hello ${d.name}, Bill Due: ₹${d.due}. Please pay to: ${UPI}`;
    let link = `https://wa.me/${d.phone}?text=${encodeURIComponent(msg)}`;
    let badge = d.color === 'red' ? 'bg-red' : 'bg-blue';
    let status = d.color === 'red' ? 'OVERDUE' : `Due: ${d.day}th`;
    
    return `
    <div class="card">
      <div class="card-top">
        <div>
          <div class="name">${d.name}</div>
          <div class="type">${d.type}</div>
        </div>
        <div class="badge ${badge}">${status}</div>
      </div>
      <div class="amt-row">
        <div class="type">Amount Due</div>
        <div class="due-amt">₹${d.due}</div>
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

// --- NAVIGATION ---
function switchView(id) {
  document.querySelectorAll('.view').forEach(e => e.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  event.currentTarget.classList.add('active');

  if(id === 'bills') fetchData();
}

// --- CLOCK ---
function updateClock() {
  const d = new Date();
  document.getElementById('clock-time').innerText = d.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', hour12:true});
  document.getElementById('clock-date').innerText = d.toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'});
}

// --- ADD CUSTOMER (POST) ---
function setPlan(type, amt, el) {
  document.getElementById('add-type').value = type;
  document.getElementById('add-amount').value = amt;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

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
    date: document.getElementById('add-date').value
  };

  try {
    // We send as standard POST body stringified
    await fetch(API, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    
    closeModal('modal-add');
    document.getElementById('form-add').reset();
    toast("Customer Added!");
    fetchData(); // Refresh list immediately
  } catch (error) {
    console.error(error);
    toast("Error Saving");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

// --- PAYMENT HANDLING ---
function prePay(r, due) {
  actRow = r;
  document.getElementById('pay-amount').value = due;
  openModal('modal-pay');
}

async function submitPay(full) {
  const amt = document.getElementById('pay-amount').value;
  if(!amt) return toast("Enter Amount");

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
    toast("Payment Success!");
    fetchData();
  } catch (e) {
    toast("Error Paying");
  }
}

// --- DELETE HANDLING ---
async function del(r) {
  if(!confirm("Are you sure you want to delete this record?")) return;
  toast("Deleting...");
  
  try {
    await fetch(API, {
      method: "POST", 
      body: JSON.stringify({
        action: "delete", 
        row: r
      })
    });
    toast("Deleted Successfully");
    fetchData();
  } catch (e) {
    toast("Error Deleting");
  }
}

// --- SEARCH ---
function filterBills() {
  const term = document.getElementById('search').value.toLowerCase();
  const filtered = dataList.filter(i => i.name.toLowerCase().includes(term));
  render(filtered);
}

// --- UI UTILITIES ---
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function toast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg; 
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3000);
}
