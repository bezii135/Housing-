const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const sqlite3 = require('sqlite3').verbose();

// Create SQLite database or connect to it
const db = new sqlite3.Database('./blog.db');

// Set up body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes for the blog page and admin panel
app.use('/', require('./routes/blogRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
