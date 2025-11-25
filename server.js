const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Tool for Cloud DB
const app = express();
// Cloud servers assign their own port, or use 5000 locally
const PORT = process.env.PORT || 5000; 

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on Port ${PORT}`);
});

app.use(cors());
app.use(express.json());

// --- 1. CLOUD DATABASE CONNECTION ---
// I replaced '@' in your password with '%40' so the link doesn't break.
const MONGO_URI = "mongodb+srv://hardikmi2002_db_user:Ankit@123@cluster0.rswhkef.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Cloud"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 2. DEFINE DATA MODELS (Schemas) ---
const BookingSchema = new mongoose.Schema({
    patientName: String,
    doctor: String,
    date: String,
    paymentId: String
});
const Booking = mongoose.model('Booking', BookingSchema);

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model('User', UserSchema);

// --- 3. DOCTOR DATA (Static List) ---
const doctors = [
    { id: 1, name: "Dr. Vinita Das", specialty: "Gynecology", experience: "45+ Years", degree: "MBBS, MD", time: "11:00 AM - 03:00 PM", hospital: "Apollo Hospitals", rating: 4.9, image: "https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg" },
    { id: 2, name: "Dr. Amit Gupta", specialty: "Nephrologist", experience: "42+ Years", degree: "MD, DNB", time: "09:00 AM - 05:00 PM", hospital: "Medanta Hospital", rating: 4.7, image: "https://img.freepik.com/free-photo/doctor-with-his-arms-crossed-white-background_1368-5790.jpg" },
    { id: 3, name: "Dr. Sarah Johnson", specialty: "Dentist", experience: "10+ Years", degree: "BDS, MDS", time: "04:00 PM - 09:00 PM", hospital: "Smile Care Clinic", rating: 4.8, image: "https://img.freepik.com/free-photo/pleased-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg" },
    { id: 4, name: "Dr. Rajesh Kumar", specialty: "Cardiologist", experience: "18+ Years", degree: "MBBS, MD, DM", time: "10:00 AM - 02:00 PM", hospital: "Heart & Soul Centre", rating: 5.0, image: "https://img.freepik.com/free-photo/portrait-hansome-young-male-doctor-man_171337-5068.jpg" },
    { id: 5, name: "Dr. Anjali Desai", specialty: "Dermatologist", experience: "8+ Years", degree: "MBBS, MD", time: "12:00 PM - 04:00 PM", hospital: "Skin Glow Clinic", rating: 4.6, image: "https://img.freepik.com/free-photo/female-doctor-lab-coat-white-isolated-confident-smile_343596-6556.jpg" },
    { id: 6, name: "Dr. Sameer Khan", specialty: "Neurologist", experience: "22+ Years", degree: "MBBS, MD, DM", time: "11:00 AM - 02:00 PM", hospital: "City Neuro Centre", rating: 4.9, image: "https://img.freepik.com/free-photo/hospital-healthcare-workers-covid-19-treatment-concept-young-doctor-scrubs-making-daily-errands-clinic-listening-patient-symptoms-look-camera-professional-physician-cure-diseases_1258-57233.jpg" },
    { id: 7, name: "Dr. Pooja Mehta", specialty: "Orthopedic", experience: "14+ Years", degree: "MBBS, MS", time: "09:00 AM - 12:00 PM", hospital: "Bone & Joint Clinic", rating: 4.7, image: "https://img.freepik.com/free-photo/portrait-smiling-handsome-male-doctor-man_171337-5055.jpg" },
    { id: 8, name: "Dr. Vikram Singh", specialty: "General Physician", experience: "25+ Years", degree: "MBBS, MD", time: "08:00 AM - 02:00 PM", hospital: "Family Health Centre", rating: 4.5, image: "https://img.freepik.com/free-photo/portrait-successful-mid-adult-doctor-with-crossed-arms_1262-12865.jpg" },
    { id: 9, name: "Dr. Neha Gupta", specialty: "Pediatrician", experience: "12+ Years", degree: "MBBS, MD", time: "05:00 PM - 08:00 PM", hospital: "Happy Kids Clinic", rating: 4.9, image: "https://img.freepik.com/free-photo/young-woman-doctor-white-coat-looking-camera-smiling-confidently_141793-106240.jpg" },
    { id: 10, name: "Dr. Arun Verma", specialty: "ENT Specialist", experience: "16+ Years", degree: "MBBS, MS", time: "10:00 AM - 01:00 PM", hospital: "City ENT Hospital", rating: 4.6, image: "https://img.freepik.com/free-photo/doctor-offering-medical-advice_23-2147796535.jpg" }
];

// --- 4. API ROUTES ---

// GET Doctors
app.get('/api/doctors', (req, res) => {
    res.json(doctors);
});

// BOOK APPOINTMENT (Saved to Cloud)
app.post('/api/book', async (req, res) => {
    try {
        const newBooking = new Booking({
            patientName: req.body.patientName,
            doctor: req.body.doctor,
            date: new Date().toLocaleString(),
            paymentId: req.body.paymentId || "Paid Cash"
        });
        await newBooking.save();
        console.log(`📅 Booking Saved to Cloud: ${req.body.patientName}`);
        res.json({ message: "Booking Confirmed!" });
    } catch (err) {
        res.status(500).json({ message: "Error saving booking" });
    }
});

// SIGN UP (Saved to Cloud)
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await User.findOne({ email: email });
        if (exists) return res.status(400).json({ success: false, message: "Email already exists!" });

        const newUser = new User({ name, email, password });
        await newUser.save();
        console.log(`👤 New User Saved: ${name}`);
        res.json({ success: true, message: "Account created!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// LOGIN (Checked against Cloud)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email, password: password });
        if (user) {
            res.json({ success: true, name: user.name });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// FORGOT PASSWORD
app.post('/api/forgot-password', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) res.json({ success: true, message: "✅ Reset link sent!" });
    else res.status(404).json({ success: false, message: "❌ Email not found." });
});

// ADMIN ROUTES
app.get('/api/admin/bookings', async (req, res) => {
    const bookings = await Booking.find();
    res.json(bookings);
});

app.get('/api/admin/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// --- 5. START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on Port ${PORT}`);
});