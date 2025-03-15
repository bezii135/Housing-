const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Storage configuration for multer (image upload to memory)
const storage = multer.memoryStorage(); // Store the image in memory
const upload = multer({ storage: storage });

// Create a reusable SQLite database instance
const db = new sqlite3.Database('./blog.db');

// Route to display the blog posts
router.get('/', (req, res) => {
    db.all('SELECT * FROM posts', (err, rows) => {
        if (err) {
            console.error("Error fetching posts:", err);
            return res.status(500).send('Error fetching posts');
        }

        // Convert image BLOB to Base64 if images exist
        rows.forEach(row => {
            if (row.image) {
                row.image = row.image.toString('base64');
            }
        });

        res.render('blog', { posts: rows });
    });
});

// Route to display the add/update post form
router.get('/add-update-post/:id?', (req, res) => {
    const postId = req.params.id;
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

// Route to handle adding or updating posts with image upload
router.post('/add-update-post', upload.single('image'), (req, res) => {
    const { title, content, category, id } = req.body;
    const image = req.file ? req.file.buffer : null; // Image data in binary format

    if (!title || !content || !category) {
        return res.status(400).send('All fields (title, content, category) are required.');
    }

    const date = new Date().toISOString();

    if (id) {
        // Update existing post
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

