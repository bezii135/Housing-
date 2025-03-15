const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const app = express();

// Debug logs
const dbPath = path.join(__dirname, 'blog.db');
console.log('Using database file:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));
console.log('Views directory:', path.join(__dirname, 'views'));
console.log('Current working directory:', process.cwd());

// Set up SQLite database
const db = new sqlite3.Database(dbPath);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public'))); // This serves static content like index.html

// Set up view engine and views directory for EJS (if you decide to convert HTML files to EJS in the future)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up multer for image upload (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
const blogRoutes = require('./routes/blogRoutes');
app.use('/', blogRoutes);

// Static HTML pages routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serving index from public folder
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'About.html')); // Serving About page from public folder
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'services.html')); // Serving Services page from public folder
});

app.get('/inventory', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Inventory.html')); // Serving Inventory page from public folder
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portfolio.html')); // Serving Portfolio page from public folder
});

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html')); // Serving Blog page from public folder
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
