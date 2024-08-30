const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import CORS

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());  // Use CORS middleware
app.use(bodyParser.json());
app.use(express.static('public'));  // Serve static files if needed

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/expressReactDB')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

// Mongoose schema and model
const alumniSchema = new mongoose.Schema({
    name: String,
    email: String,
    batch: String,
    phone: String
});

const Alumni = mongoose.model('Alumni', alumniSchema);

// Route to handle form submission
app.post('/register', async (req, res) => {
    const { name, email, batch, phone } = req.body;

    try {
        const newAlumni = new Alumni({ name, email, batch, phone });
        await newAlumni.save();

        console.log('New alumni saved:', newAlumni);  // Log the saved document to the console

        res.json({ success: true, message: 'Registration successful!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving data.' });
    }
});

// Route to get all registered alumni
app.get('/alumni', async (req, res) => {
    try {
        const alumniList = await Alumni.find();
        res.json(alumniList);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching data.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
