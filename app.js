const express = require('express'); // ✅ Declare express BEFORE using it
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const app = express(); // ✅ Now this works because express is already declared

// Debug logs
const dbPath = path.join(__dirname, 'blog.db');
console.log('Using database file:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));
console.log('Views directory:', path.join(__dirname, 'views'));
console.log('Current working directory:', process.cwd());

// Set up SQLite database
const db = new sqlite3.Database('./blog.db');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Set up view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up multer for image upload (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
const blogRoutes = require('./routes/blogRoutes');
app.use('/', blogRoutes);

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
