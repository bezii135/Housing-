const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Multer: store image in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET: Admin page and Add/Edit post form
router.get(['/admin', '/add-update-post/:id?'], (req, res) => {
    const postId = req.params.id;
    const db = new sqlite3.Database('./blog.db');

    db.all('SELECT * FROM posts', (err, posts) => {
        if (err) {
            console.error("Error loading posts:", err);
            return res.status(500).send('Database error');
        }

        if (postId) {
            db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, row) => {
                if (err) {
                    console.error("Error fetching post for edit:", err);
                    return res.status(500).send('Database error');
                }

                res.render('admin', { post: row, posts });
            });
        } else {
            res.render('admin', { post: null, posts });
        }
    });
});

// POST: Add or update post
router.post('/add-update-post', upload.single('image'), (req, res) => {
    const { title, content, category, id } = req.body;
    const image = req.file ? req.file.buffer : null;
    const date = new Date().toISOString();

    const db = new sqlite3.Database('./blog.db');

    if (id) {
        const query = `UPDATE posts SET title = ?, content = ?, category = ?, date = ?, image = ? WHERE id = ?`;
        db.run(query, [title, content, category, date, image, id], function (err) {
            if (err) {
                console.error("Error updating post:", err);
                return res.status(500).send("Error updating post");
            }
            res.redirect('/admin');
        });
    } else {
        const query = `INSERT INTO posts (title, content, category, date, image) VALUES (?, ?, ?, ?, ?)`;
        db.run(query, [title, content, category, date, image], function (err) {
            if (err) {
                console.error("Error adding post:", err);
                return res.status(500).send("Error adding post");
            }
            res.redirect('/admin');
        });
    }
});

// DELETE: Delete a post
router.get('/delete-post/:id', (req, res) => {
    const postId = req.params.id;
    const db = new sqlite3.Database('./blog.db');

    db.run('DELETE FROM posts WHERE id = ?', [postId], function(err) {
        if (err) {
            console.error("Error deleting post:", err);
            return res.status(500).send("Error deleting post");
        }
        res.redirect('/admin');
    });
});

// Blog Public View
router.get('/blog', (req, res) => {
    const db = new sqlite3.Database('./blog.db');
    db.all('SELECT * FROM posts', (err, rows) => {
        if (err) {
            console.error("Error fetching posts:", err);
            return res.status(500).send('Error fetching posts');
        }

        rows.forEach(row => {
            if (row.image) {
                row.image = Buffer.from(row.image).toString('base64');
            }
        });

        res.render('blog', { posts: rows });
    });
});

module.exports = router;
