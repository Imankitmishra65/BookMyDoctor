// main.js - FINAL VERSION

const container = document.getElementById('doctorContainer');

// ✅ LINK TO YOUR LIVE CLOUD SERVER
const API_URL = 'https://bookmydoctor-dot4.onrender.com'; 

let allDoctors = [];

// --- 1. CHECK LOGIN STATUS ON LOAD ---
function checkLoginStatus() {
    const savedUser = localStorage.getItem('userName');
    if (savedUser) {
        updateLoginButton(savedUser);
    }
}

function updateLoginButton(name) {
    const btn = document.querySelector('#loginBtn');
    if(btn) {
        btn.innerText = `Hi, ${name}`; // Shows Name
        btn.style.background = "#10b981"; 
        // ✅ NEW: Clicking name goes to Dashboard
        btn.onclick = function() {
            window.location.href = "patient.html";
        };
    }
}

// --- 2. LOAD DOCTORS FROM SERVER ---
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

        // ✅ NOTICE: The "View Profile" button is now a Link (<a>) to profile.html
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
                    
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <button class="btn-book-app" onclick="bookAppointment('${doc.name}')">Book Now</button>
                        <a href="profile.html?id=${doc.id}" class="btn-outline" style="padding: 10px; text-decoration: none; border: 1px solid #246bfd; background: white; color: #246bfd; border-radius: 8px; display: inline-block;">View Profile</a>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// --- 3. BOOKING LOGIC (With SweetAlert) ---
async function bookAppointment(doctorName) {
    let patientName = localStorage.getItem('userName');

    if (!patientName) {
        Swal.fire({
            title: 'Login Required',
            text: "You must login to book an appointment.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Login Now'
        }).then((result) => {
            if (result.isConfirmed) {
                openModal();
                showLogin();
            }
        });
        return;
    }

    // Confirm Booking
    const result = await Swal.fire({
        title: 'Confirm Booking?',
        text: `Book appointment with ${doctorName} for ${patientName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#246bfd',
        confirmButtonText: 'Yes, Pay ₹500'
    });

    if (result.isConfirmed) {
        processPayment(patientName, doctorName);
    }
}

// --- 4. PAYMENT & SAVING ---
function processPayment(patientName, doctorName) {
    const options = {
        "key": "rzp_test_1DP5mmOlF5G5ag", // Your Public Key
        "amount": 50000, // ₹500
        "currency": "INR",
        "name": "BookMyDoctor",
        "description": "Fee for " + doctorName,
        "image": "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
        
        "handler": async function (response) {
            
            // Show Loading
            Swal.fire({ title: 'Processing...', timer: 2000, didOpen: () => Swal.showLoading() });

            try {
                // Save to Database
                await fetch(`${API_URL}/api/book`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        patientName: patientName, 
                        doctor: doctorName,
                        paymentId: response.razorpay_payment_id
                    })
                });

                // Success
                Swal.fire({
                    title: 'Booking Confirmed!',
                    text: `Appointment with ${doctorName} is successful.`,
                    icon: 'success'
                });

            } catch(err) {
                Swal.fire('Error', 'Payment taken but booking failed to save.', 'error');
            }
        },
        "theme": { "color": "#246bfd" }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
}

// --- 5. AUTHENTICATION (Login/Signup) ---
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
            localStorage.setItem('userName', data.name);
            updateLoginButton(data.name);
            closeModal();
            Swal.fire({ icon: 'success', title: `Welcome back, ${data.name}!`, timer: 2000, showConfirmButton: false });
        } else {
            Swal.fire('Login Failed', data.message, 'error');
        }
    } catch(err) { Swal.fire('Error', 'Server Error', 'error'); }
}

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
        
        if(data.success) {
            Swal.fire('Account Created', 'Please login now.', 'success');
            showLogin();
        } else {
            Swal.fire('Oops', data.message, 'warning');
        }
    } catch(err) { Swal.fire('Error', 'Server Error', 'error'); }
}

function logoutUser() {
    Swal.fire({
        title: 'Logout?',
        text: "You will be logged out.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Logout'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('userName');
            location.reload();
        }
    });
}

// --- 6. HELPER FUNCTIONS ---
function openModal() { document.getElementById('authModal').style.display = 'flex'; }
function closeModal() { document.getElementById('authModal').style.display = 'none'; }
function showSignup() { document.getElementById('loginForm').style.display = 'none'; document.getElementById('signupForm').style.display = 'block'; }
function showLogin() { document.getElementById('signupForm').style.display = 'none'; document.getElementById('loginForm').style.display = 'block'; }
function showForgot() { document.getElementById('loginForm').style.display = 'none'; document.getElementById('forgotForm').style.display = 'block'; }

function filterDoctors() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allDoctors.filter(doc => doc.name.toLowerCase().includes(query) || doc.specialty.toLowerCase().includes(query));
    displayDoctors(filtered);
}
function filterByCategory(category) {
    document.getElementById('searchInput').value = category;
    filterDoctors();
}

// START THE APP
loadDoctors();
checkLoginStatus();

