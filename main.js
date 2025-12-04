// main.js - PRO VERSION (With SweetAlert2)

const container = document.getElementById('doctorContainer');
const API_URL = 'https://bookmydoctor-dot4.onrender.com'; 
let allDoctors = [];

// --- 1. CHECK LOGIN ---
function checkLoginStatus() {
    const savedUser = localStorage.getItem('userName');
    if (savedUser) updateLoginButton(savedUser);
}

function updateLoginButton(name) {
    const btn = document.querySelector('#loginBtn');
    if(btn) {
        btn.innerText = `Hi, ${name}`;
        btn.style.background = "#10b981"; 
        btn.onclick = logoutUser;
    }
}

// --- 2. BOOKING FUNCTION (Animated) ---
async function bookAppointment(doctorName) {
    let patientName = localStorage.getItem('userName');

    if (patientName) {
        // CONFIRM DIALOG (Animated)
        const result = await Swal.fire({
            title: 'Confirm Booking?',
            text: `Book appointment with ${doctorName} for ${patientName}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#246bfd',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Book it!'
        });

        if (!result.isConfirmed) return;

    } else {
        // INPUT DIALOG (Animated)
        const { value: name } = await Swal.fire({
            title: 'Guest Booking',
            input: 'text',
            inputLabel: 'Please enter your name',
            inputPlaceholder: 'John Doe',
            showCancelButton: true
        });

        if (!name) return; // User cancelled
        patientName = name;
    }

    // Process Payment & Save
    processPayment(patientName, doctorName);
}

// Separate Payment Logic
function processPayment(patientName, doctorName) {
    const options = {
        "key": "rzp_test_1DP5mmOlF5G5ag",
        "amount": 50000, 
        "currency": "INR",
        "name": "BookMyDoctor",
        "description": "Fee for " + doctorName,
        "image": "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
        "handler": async function (response) {
            
            // SHOW LOADING
            Swal.fire({ title: 'Processing...', timer: 2000, didOpen: () => Swal.showLoading() });

            try {
                await fetch(`${API_URL}/api/book`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        patientName: patientName, 
                        doctor: doctorName,
                        paymentId: response.razorpay_payment_id
                    })
                });

                // SUCCESS ALERT
                Swal.fire({
                    title: 'Booking Confirmed!',
                    text: `${doctorName} will see you soon.`,
                    icon: 'success',
                    confirmButtonColor: '#10b981'
                });

            } catch(err) {
                // ERROR ALERT
                Swal.fire('Error', 'Payment taken but booking failed to save.', 'error');
            }
        },
        "theme": { "color": "#246bfd" }
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
}

// --- 3. LOGIN (Animated) ---
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
            
            // TOAST NOTIFICATION (Top Right)
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
            });
            Toast.fire({ icon: 'success', title: `Welcome back, ${data.name}!` });

        } else {
            Swal.fire('Login Failed', data.message, 'error');
        }
    } catch(err) { Swal.fire('Error', 'Server not responding', 'error'); }
}

// --- 4. SIGNUP (Animated) ---
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
            Swal.fire('Account Created!', 'Please login now.', 'success');
            showLogin();
        } else {
            Swal.fire('Oops...', data.message, 'warning');
        }
    } catch(err) { Swal.fire('Error', 'Server Error', 'error'); }
}

// --- 5. LOGOUT ---
function logoutUser() {
    Swal.fire({
        title: 'Logout?',
        text: "You will need to login again to check history.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Logout'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('userName');
            location.reload();
        }
    })
}

// --- LOAD DOCTORS ---
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/api/doctors`);
        allDoctors = await response.json();
        container.innerHTML = '';
        displayDoctors(allDoctors);
    } catch (error) {
        container.innerHTML = '<p style="text-align:center; color:red;">Connection Failed.</p>';
    }
}

function displayDoctors(doctorsList) {
    container.innerHTML = '';
    doctorsList.forEach(doc => {
        const badge = doc.rating > 4.8 
            ? `<span class="badge-success"><i class="fa-solid fa-check-circle"></i> Top Rated</span>` 
            : `<span class="badge-info">Available Today</span>`;

        const card = `
            <div class="doctor-business-card">
                <div class="doc-left">
                    <img src="${doc.image}" alt="${doc.name}" class="doc-avatar">
                </div>
                <div class="doc-center">
                    <h3 class="doc-name">${doc.name} ${badge}</h3>
                    <p class="doc-spec">${doc.specialty}</p>
                    <p class="doc-exp">${doc.experience}</p>
                    <div class="doc-loc"><span><i class="fa-solid fa-location-dot"></i> ${doc.hospital}</span></div>
                    <p class="doc-fee"><span>₹500</span> Consultation Fee</p>
                </div>
                <div class="doc-right">
                    <div class="time-slot"><i class="fa-regular fa-clock"></i> ${doc.time}</div>
                    <button class="btn-book-app" onclick="bookAppointment('${doc.name}')">Book Visit</button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// HELPERS
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

// START
loadDoctors();
checkLoginStatus();

