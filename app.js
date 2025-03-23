const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const PORT = 3000;
const app = express();

// Set up SQLite database
const dbPath = path.join(__dirname, 'blog.db');
console.log('Using database file:', dbPath);

// Set up SQLite database
const db = new sqlite3.Database(dbPath);

// Ensure uploads folder exists
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));


// Serve static files from the "public" and "uploads" folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ✅ Added to serve uploaded images

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create posts table if not exists ✅ Now includes image_filename and category
db.run(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT DEFAULT CURRENT_TIMESTAMP,
  image_filename TEXT
)`);

// Optional: create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

// Blog routes
app.get('/blog', (req, res) => {
  db.all('SELECT * FROM posts', (err, rows) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).send('Error fetching posts');
    }

    // Convert image filename to the correct URL for displaying the image
    rows.forEach(row => {
      if (row.image_filename) {
        row.image = '/uploads/' + row.image_filename;
      }
    });

    res.render('blog', { posts: rows });
  });
});

// Admin routes
app.get('/admin', (req, res) => {
  if (req.session.user) { // ✅ Simplified (was checking isAdmin, which doesn’t exist yet)
    db.all("SELECT * FROM posts", (err, posts) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching posts");
      }
      res.render('admin', { posts: posts, post: null }); // <- added post: null

    });
  } else {
    res.redirect('/login');
  }
});

app.get('/add-update-post/:id?', (req, res) => {
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

app.post('/add-update-post', upload.single('image'), (req, res) => {
    const { title, content, category, id } = req.body;
    const imageFilename = req.file ? req.file.filename : null;
  
    if (!title || !content || !category) {
      return res.status(400).send('All fields (title, content, category) are required.');
    }
  
    const date = new Date().toISOString();
  
    if (id) {
      // Update existing post
      let updateQuery = "UPDATE posts SET title = ?, content = ?, category = ?, date = ?" + (imageFilename ? ", image_filename = ?" : "") + " WHERE id = ?";
      const updateParams = imageFilename ? [title, content, category, date, imageFilename, id] : [title, content, category, date, id];
  
      db.run(updateQuery, updateParams, (err) => {
        if (err) return res.send("Error updating post.");
        res.redirect('/blog?successMessage=Post updated successfully!');
      });
    } else {
      // Insert new post
      let insertQuery = "INSERT INTO posts (title, content, category, date, image_filename) VALUES (?, ?, ?, ?, ?)";
      db.run(insertQuery, [title, content, category, date, imageFilename], (err) => {
        if (err) return res.send("Error adding post.");
        res.redirect('/blog?successMessage=Post added successfully!');
      });
    }
  });
  
// Route to delete a post
app.post('/delete-post/:id', (req, res) => {
    const postId = req.params.id;
  
    // First, get the image filename (if it exists) to delete the image
    db.get('SELECT image_filename FROM posts WHERE id = ?', [postId], (err, row) => {
      if (err) return res.status(500).send('Error fetching post.');
  
      if (row && row.image_filename) {
        const imagePath = path.join(__dirname, 'uploads', row.image_filename);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting image:", err);
        });
      }
  
      // Delete the post from the database
      db.run('DELETE FROM posts WHERE id = ?', [postId], (err) => {
        if (err) return res.status(500).send('Error deleting post.');
        res.redirect('/admin?successMessage=Post deleted successfully!');
      });
    });
  });
  
  app.get('/admin', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY date DESC', (err, rows) => {
      if (err) return res.status(500).send('Error fetching posts.');
  
      res.render('admin', {
        posts: rows, // Pass the posts to admin.ejs
        successMessage: req.query.successMessage // If there's a success message
      });
    });
  });
  

  app.get('/admin/:id', (req, res) => {
    const postId = req.params.id;
  
    // Fetch the post to edit
    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, row) => {
      if (err) return res.status(500).send('Error fetching post.');
      if (!row) return res.status(404).send('Post not found.');
  
      res.render('admin', {
        post: row // Send the post to the admin template for editing
      });
    });
  });
  
  

// Static HTML page routes
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'About.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Inventory.html'));
});

app.get('/portfolio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

// Registration routes
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error(err);
      return res.send("Error encrypting password.");
    }

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (err) => {
      if (err) {
        console.error(err);
        return res.send("Username already exists or database error.");
      }
      res.redirect("/login");
    });
  });
});

// Login routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error(err);
      return res.send("Database error.");
    }

    if (!user) {
      return res.send("Invalid username or password.");
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        req.session.user = user;
        res.redirect("/add-update-post");
      } else {
        res.send("Invalid username or password.");
      }
    });
  });
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
