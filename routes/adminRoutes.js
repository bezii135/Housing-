const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./blog.db');

// Display the admin page
router.get('/', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY date DESC", [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('admin', { posts: rows });
    });
});

// Handle adding a new post
router.post('/add', (req, res) => {
    const { title, category, content } = req.body;
    const date = new Date().toISOString().split('T')[0]; // Get current date

    db.run(`INSERT INTO posts (title, category, content, date, author) VALUES (?, ?, ?, ?, ?)`,
        [title, category, content, date, 'Admin'],
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            res.redirect('/admin'); // Redirect to the admin page after adding the post
        }
    );
});

module.exports = router;
