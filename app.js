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

// Debug logs
const dbPath = path.join(__dirname, 'blog.db');
console.log('Using database file:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));
console.log('Views directory:', path.join(__dirname, 'views'));
console.log('Current working directory:', process.cwd());

// Set up SQLite database
const db = new sqlite3.Database(dbPath);

// Optional: create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Define route to delete a post (POST request)
app.post('/delete-post/:id', (req, res) => {
    const postId = req.params.id;
  
    // Query the database to delete the post by the given ID
    db.run('DELETE FROM posts WHERE id = ?', [postId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error deleting post.');
      }
      res.redirect('/blog'); // Redirect to the blog page or another page after deleting
    });
  });

// Set up multer for image upload (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
const blogRoutes = require('./routes/blogRoutes');
app.use('/', blogRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/', blogRoutes);


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

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add-update-post.html'));
});

app.get('/admin', (req, res) => {
    if (req.session.user && req.session.user.isAdmin) { // Check if the user is an admin
      res.render('admin');  // This will render admin.ejs
    } else {
      res.redirect('/add-update-post'); // If not an admin, redirect to login
    }
  });

// Route to display the edit form
app.get('/admin/edit/:id', (req, res) => {
  const postId = req.params.id;

  db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
    if (err || !post) {
      return res.send("Post not found.");
    }
    res.render('admin', { post }); // Render admin.ejs with post data for editing
  });
});

// Route to handle the add/update post form submission
app.post('/add-update-post', upload.single('image'), (req, res) => {
  const { id, title, content, category } = req.body;
  const image = req.file; // Handling image upload
  const postData = [title, content, category];

  if (id) {
    // Update the existing post
    let updateQuery = "UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?";
    postData.push(id);

    if (image) {
      updateQuery = "UPDATE posts SET title = ?, content = ?, category = ?, image = ? WHERE id = ?";
      postData.push(image.filename); // Assuming the image is saved with the filename
    }

    db.run(updateQuery, postData, (err) => {
      if (err) return res.send("Error updating post.");
      res.redirect('/admin');
    });
  } else {
    // Insert a new post
    let insertQuery = "INSERT INTO posts (title, content, category) VALUES (?, ?, ?)";
    if (image) {
      insertQuery = "INSERT INTO posts (title, content, category, image) VALUES (?, ?, ?, ?)";
      postData.push(image.filename);
    }

    db.run(insertQuery, postData, (err) => {
      if (err) return res.send("Error adding post.");
      res.redirect('/admin');
    });
  }
});

// Route to delete a post
app.post('/admin/delete/:id', (req, res) => {
  const postId = req.params.id;

  db.run("DELETE FROM posts WHERE id = ?", [postId], (err) => {
    if (err) return res.send("Error deleting post.");
    res.redirect('/admin');
  });
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
