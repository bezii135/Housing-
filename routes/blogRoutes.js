const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const path = require('path');

// Multer: store image in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Home - Display all blog posts
router.get('/blog', (req, res) => 
    {
    const db = new sqlite3.Database('./blog.db');
    db.all('SELECT * FROM posts', (err, rows) => {
        if (err) {
            console.error("Error fetching posts:", err);
            return res.status(500).send('Error fetching posts');
        }

        // Convert image BLOBs to base64
        rows.forEach(row => {
            if (row.image) {
                row.image = Buffer.from(row.image).toString('base64');
            }
        });

        res.render('blog', { posts: rows });
    });
});

// GET: Form for add/update post
router.get('/add-update-post/:id?', (req, res) => {
    const postId = req.params.id;
    const db = new sqlite3.Database('./blog.db');

    if (postId) {
        db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, row) => {
            if (err) {
                console.error("Error fetching post for update:", err);
                return res.status(500).send('Database error');
            }
            res.render('admin', { post: row });
        });
    } else {
        res.render('admin', { post: null });
    }
});

// POST: Add or update post
router.post('/add-update-post', upload.single('image'), (req, res) => {
    const { title, content, category, id } = req.body;
    const image = req.file ? req.file.buffer : null;
    const date = new Date().toISOString();

    const db = new sqlite3.Database('./blog.db');

    if (id) {
        // Update post
        const query = `UPDATE posts SET title = ?, content = ?, category = ?, date = ?, image = ? WHERE id = ?`;
        db.run(query, [title, content, category, date, image, id], function (err) {
            if (err) {
                console.error("Error updating post:", err);
                return res.status(500).send("Error updating post");
            }
            res.redirect('/');
        });
    } else {
        // Insert new post
        const query = `INSERT INTO posts (title, content, category, date, image) VALUES (?, ?, ?, ?, ?)`;
        db.run(query, [title, content, category, date, image], function (err) {
            if (err) {
                console.error("Error adding post:", err);
                return res.status(500).send("Error adding post");
            }
            res.redirect('/');
        });
    }
});

module.exports = router;
