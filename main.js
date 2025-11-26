// main.js - FINAL VERSION (With Payments & Cloud)

const container = document.getElementById('doctorContainer');
// ✅ CLOUD BACKEND URL
const API_URL = 'https://bookmydoctor-dot4.onrender.com'; 

let allDoctors = [];

// --- 1. CHECK LOGIN ON LOAD ---
function checkLoginStatus() {
    const savedUser = localStorage.getItem('userName');
    if (savedUser) {
        updateLoginButton(savedUser);
    }
}

function updateLoginButton(name) {
    const btn = document.querySelector('#loginBtn');
    if(btn) {
        btn.innerText = `Hi, ${name}`;
        btn.style.background = "#10b981"; 
        btn.setAttribute('onclick', 'logoutUser()');
    }
}

// --- 2. BOOKING FUNCTION (With Payment) ---
async function bookAppointment(doctorName) {
    // 1. Check Login
    let patientName = localStorage.getItem('userName');
    
    if (!patientName) {
        alert("🔒 You must Login to book an appointment.");
        openModal();
        showLogin();
        return;
    }

    // 2. Razorpay Configuration
    const options = {
        "key": "rzp_test_1DP5mmOlF5G5ag", // Public Test Key
        "amount": 50000, // ₹500.00
        "currency": "INR",
        "name": "BookMyDoctor",
        "description": "Consultation Fee for " + doctorName,
        "image": "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
        
        "handler": async function (response) {
            const paymentId = response.razorpay_payment_id;
            
            // 3. Save to Backend
            try {
                const res = await fetch(`${API_URL}/api/book`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        patientName: patientName, 
                        doctor: doctorName,
                        paymentId: paymentId
                    })
                });
                alert(`✅ Payment Successful! Booking Confirmed for ${patientName}.`);
            } catch(err) {
                alert("Server Error: Payment taken but booking not saved.");
            }
        },
        "prefill": {
            "name": patientName,
            "email": "patient@example.com",
            "contact": "9999999999"
        },
        "theme": { "color": "#246bfd" }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
}

// --- 3. LOGIN FUNCTION ---
async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if(data.success) {
            alert(`Welcome back, ${data.name}!`);
            localStorage.setItem('userName', data.name);
            updateLoginButton(data.name);
            closeModal();
        } else {
            alert("❌ " + data.message);
        }
    } catch(err) { alert("Server Error"); }
}

// --- 4. LOGOUT ---
function logoutUser() {
    if(confirm("Do you want to logout?")) {
        localStorage.removeItem('userName'); 
        location.reload(); 
    }
}

// --- 5. LOAD DOCTORS ---
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/api/doctors`);
        allDoctors = await response.json();
        container.innerHTML = '';
        displayDoctors(allDoctors);
    } catch (error) {
        container.innerHTML = '<p style="text-align:center; color:red;">Connection Failed. Is server running?</p>';
    }
}

function displayDoctors(doctorsList) {
    container.innerHTML = '';
    if(doctorsList.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No doctors found.</p>';
        return;
    }
    doctorsList.forEach(doc => {
        const badge = doc.rating > 4.8 
            ? `<span class="badge-success"><i class="fa-solid fa-check-circle"></i> Top Rated</span>` 
            : `<span class="badge-info">Available Today</span>`;

        const card = `
            <div class="doctor-business-card">
                <div class="doc-left">
                    <img src="${doc.image}" alt="${doc.name}" class="doc-avatar" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3774/3774299.png'">
                </div>
                <div class="doc-center">
                    <h3 class="doc-name">${doc.name} ${badge}</h3>
                    <p class="doc-spec">${doc.specialty}</p>
                    <p class="doc-exp">${doc.experience}</p>
                    <div class="doc-loc"><span><i class="fa-solid fa-location-dot"></i> ${doc.hospital || 'City Clinic'}</span></div>
                    <p class="doc-fee"><span>₹500</span> Consultation Fee</p>
                </div>
                <div class="doc-right">
                    <div class="time-slot"><i class="fa-regular fa-clock"></i> ${doc.time || '10:00 AM'}</div>
                    <button class="btn-book-app" onclick="bookAppointment('${doc.name}')">Book Visit</button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// --- 6. HELPERS ---
function openModal() { document.getElementById('authModal').style.display = 'flex'; }
function closeModal() { document.getElementById('authModal').style.display = 'none'; }
function showSignup() { document.getElementById('loginForm').style.display = 'none'; document.getElementById('signupForm').style.display = 'block'; }
function showLogin() { document.getElementById('signupForm').style.display = 'none'; document.getElementById('loginForm').style.display = 'block'; }
function showForgot() { document.getElementById('loginForm').style.display = 'none'; document.getElementById('forgotForm').style.display = 'block'; }

async function signupUser() {
    const name = document.getElementById('signName').value;
    const email = document.getElementById('signEmail').value;
    const password = document.getElementById('signPass').value;
    try {
        const res = await fetch(`${API_URL}/api/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        alert(data.message);
        if(data.success) showLogin();
    } catch(err) { alert("Server Error"); }
}

async function resetUserPassword() {
    const email = document.getElementById('forgotEmail').value;
    try {
        const res = await fetch(`${API_URL}/api/forgot-password`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if(data.success) { alert("✅ Reset link sent!"); showLogin(); } 
        else { alert("❌ " + data.message); }
    } catch(err) { alert("Server Error"); }
}

function filterDoctors() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allDoctors.filter(doc => doc.name.toLowerCase().includes(query) || doc.specialty.toLowerCase().includes(query));
    displayDoctors(filtered);
}
function filterByCategory(category) {
    document.getElementById('searchInput').value = category;
    filterDoctors();
}

// START
loadDoctors();
checkLoginStatus();

