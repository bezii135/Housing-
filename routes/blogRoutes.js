const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./blog.db');

// Display the home page (blog page)
router.get('/', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY date DESC", [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('index', { posts: rows });
    });
});

module.exports = router;
