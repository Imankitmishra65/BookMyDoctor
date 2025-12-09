// script.js - FRONTEND LOGIC

// 1. Select the container
const container = document.getElementById('doctorContainer');

// ⚠️ Use localhost for safety on your laptop
const API_URL = 'http://localhost:5000'; 

// Global list for search filter
let allDoctors = [];

// --- 1. LOAD DOCTORS ---
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/api/doctors`);
        allDoctors = await response.json();
        
        // Clear loading animation
        container.innerHTML = '';

        // Display them
        displayDoctors(allDoctors);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center; color:red;">Connection Failed. Is the server running?</p>';
    }
}

// --- 2. DISPLAY FUNCTION ---
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

// --- 3. SEARCH FILTER ---
function filterDoctors() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allDoctors.filter(doc => 
        doc.name.toLowerCase().includes(query) || 
        doc.specialty.toLowerCase().includes(query)
    );
    displayDoctors(filtered);
}

function filterByCategory(category) {
    document.getElementById('searchInput').value = category;
    filterDoctors();
}

// --- 4. BOOKING FUNCTION ---
async function bookAppointment(name) {
    const patient = prompt("Enter your name:");
    if(patient) {
        await fetch(`${API_URL}/api/book`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({patientName: patient, doctor: name})
        });
        alert("Booking Sent!");
    }
}

// --- 5. AUTHENTICATION (Login/Signup) ---
function openModal() { document.getElementById('authModal').style.display = 'flex'; }
function closeModal() { document.getElementById('authModal').style.display = 'none'; }
function showSignup() { document.getElementById('loginForm').style.display = 'none'; document.getElementById('signupForm').style.display = 'block'; }
function showLogin() { document.getElementById('signupForm').style.display = 'none'; document.getElementById('loginForm').style.display = 'block'; }

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
            alert(`Welcome ${data.name}!`);
            closeModal();
            document.querySelector('.btn-primary').innerText = `Hi, ${data.name}`;
        } else {
            alert(data.message);
        }
    } catch(err) { alert("Server Error"); }
}

// Start
loadDoctors();// --- FORGOT PASSWORD LOGIC ---

// 1. Show the Forgot Password Screen
function showForgot() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'block';
}

// 2. Handle the Reset Request
async function resetUserPassword() {
    const email = document.getElementById('forgotEmail').value;

    if(!email) {
        alert("Please enter your email address.");
        return;
    }

    try {
        // Ask Server if this email exists
        const res = await fetch(`${API_URL}/api/forgot-password`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: email })
        });
        
        const data = await res.json();

        if(data.success) {
            alert("✅ Success! A password reset link has been sent to your email.");
            showLogin(); // Go back to login
        } else {
            alert("❌ " + data.message); // Email not found
        }

    } catch(err) {
        console.error(err);
        alert("Server Error");
    }
}
