import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import bcrypt from 'bcrypt';
import moment from 'moment';
import multer from 'multer';
import path from 'path';
import connection from './database.js';

import { join } from 'path';

import { getUsers, getCategories, getPosts, getPostContent, getReplies, adminPostList, isAdmin, getData } from './database.js';



dotenv.config();

const app = express();
const port = process.env.PORT;


// Serve static files from the 'public' directory
app.use(express.static(join(process.cwd(), 'public')));

// Serve static files from the "uploads" directory
app.use(express.static(join(process.cwd(), 'uploads')));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure express-session
app.use(session({
	secret: 'your-secret-key', // Add a secret key for session encryption
	resave: false,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.set('views', join(process.cwd(), 'views')); // Rendering templates in views directory (.ejs)

app.locals.moment = moment; // Global variable for moment library

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});



// Set storage engine
const storage = multer.diskStorage({
	destination: './uploads/',
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});

// Init upload
const upload = multer({
	storage: storage,
	limits: { fileSize: 1000000 }, // 1 MB limit
	fileFilter: function (req, file, cb) {
		checkFileType(file, cb);
	}
}).single('upload');

// Check file type
function checkFileType(file, cb) {
	const filetypes = /jpeg|jpg|png|gif/;
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = filetypes.test(file.mimetype);

	if (mimetype && extname) {
		return cb(null, true);
	} else {
		cb('Error: Images Only!');
	}
}

app.post('/uploadImage', (req, res) => {
	upload(req, res, (error) => {
		if (error) {
			// Check if the error object has a 'message' property
			const errorMessage = error.message || 'An error occurred during file upload';
			res.status(400).json({ uploaded: false, error: { message: errorMessage } });
		} else {
			if (req.file === undefined) {
				res.status(400).json({ uploaded: false, error: { message: 'No file selected!' } });
			} else {
				res.status(200).json({
					uploaded: true,
					url: `/${req.file.filename}`
				});
			}
		}
	});
});



// Check whether user is logged in or not
function isLoggedIn(req) {
	if (req.session.userID) {
		return true;
	} else {
		return false;
	}
}



// Serve index.ejs when accessing the root URL
app.get('/', async (req, res) => {
	try {
		const loggedIn = isLoggedIn(req);
		const admin = await isAdmin(req.session.userID);
		const categories = await getCategories();

		res.render('index', { 
			loggedIn: loggedIn,
			admin: admin,
			categories: categories,
			moment: moment
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).send('An error occurred while accessing index page.');
	}
});  


// terms and conditions page
app.get('/terms', async (req, res) => {
	try {
		const loggedIn = isLoggedIn(req);
		const admin = await isAdmin(req.session.userID);

		res.render('terms', { 
			loggedIn: loggedIn,
			admin: admin,
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).send('An error occurred while accessing index page.');
	}
});



// Register.ejs form page
app.get('/register-page', async (req, res) => {
	try {
		if (isLoggedIn(req)) {
			res.redirect('/');

		} else {
			res.render('register');
		}

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while accessing register page.' });
	}
});



// Route to user registration with duplicate check
app.post('/register', async (req, res) => {
	const { username, email, password } = req.body;

	try {
		// Check for existing user with the same username or email
		connection.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (error, results) => {
			if (error) {
				console.error('Error checking for duplicates:', error);
				return res.status(500).json({ error: 'An error occurred while processing registration.' });
			}

			if (results.length > 0) {
				return res.status(400).json({ error: 'Username or email already exists!' });
			}

			// Encrypt the password
			const hash = await bcrypt.hash(password, 10);

			// Insert the data into the database
			connection.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error) => {
				if (error) {
					console.error('Error inserting data:', error);
					return res.status(500).json({ error: 'An error occurred while registering the user.' });
				}
				console.log('User inserted successfully');
				res.status(200).json({ success: 'User created successfully' });
			});
		});
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while registering the user.' });
	}
});



// Login.ejs form page
app.get('/login-page', async (req, res) => {
	try {
		if (isLoggedIn(req)) {
			res.redirect('/');

		} else {
			res.render('login');
		}

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while accessing login page.' });
	}
});



// Route to handle user login
app.post('/login', (req, res) => {
	const { email, password } = req.body;

	try {
		// Check if the user exists in the database
		connection.query('SELECT id, password FROM users WHERE email = ?', [email], (error, results) => {
			if (error) {
				console.error('Error querying the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing login.' });
			}

			// Check if user exists
			if (results.length < 1) {
				return res.status(400).json({ error: 'Incorrect email!' });
			}

			const hash = results[0].password;
			const userID = results[0].id;

			// Compare the encrypted password
			bcrypt.compare(password, hash, (error, match) => {
				if (error) {
					console.error('Error comparing passwords:', error);
					return res.status(500).json({ error: 'An error occurred while processing login.' });
				}

				if (match) {
					// Store user ID in session
					req.session.userID = userID;
					return res.status(200).json({ message: 'Login successful!' });
				} else {
					return res.status(401).json({ error: 'Incorrect password!' });
				}
			});
		});
	} catch (error) {
		console.error('Error:', error);
		return res.status(500).json({ error: 'An error occurred while logging in the user.' });
	}
});



app.get('/log-out', (req, res) => {
	// Destroy the session
	if (isLoggedIn(req)) {
		req.session.destroy((err) => {
			if (err) {
				console.error('Error destroying session:', err);
				res.status(500).json({ error: 'An error occurred while logging out.' });
				return;
			}
		});
	}
	// Redirect the user to the home page after logout
	res.redirect('/login-page');
});



app.get('/settings', async (req, res) => {
	try {
		const loggedIn = isLoggedIn(req);
		const admin = await isAdmin(req.session.userID);
		const user_data = await getData('users', req.session.userID);

		if (isLoggedIn(req)) {
			res.render('settings', {
				loggedIn: loggedIn,
				admin: admin,
				user_data: user_data
			});

		} else {
			res.redirect('/');
		}

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while accessing settings page.' });
	}
});



app.post('/settings/update-profile', (req, res) => {
	try {
		const { username, email, image } = req.body;
		const user_id = req.session.userID;

		// Check if username is at least 4 characters long
		if (username.length < 4) {
			return res.status(400).json({ error: 'Username must be at least 4 characters long.' });
		}

		// Check if email is in correct format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: 'Invalid email format.' });
		}

		// Check for existing user with the same username or email
		connection.query('SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?', [username, email, user_id], (error, results) => {
			if (error) {
				console.error('Error querying database:', error);
				return res.status(500).json({ error: 'An error occurred while checking for duplicates.' });
			}

			if (results.length > 0) {
				return res.status(400).json({ error: 'Username or email already exists.' });
			}

			// Update the data in the database
			connection.query('UPDATE users SET username = ?, email = ?, image = ? WHERE id = ?', [username, email, image, user_id], (error) => {
				if (error) {
					console.error('Error updating data:', error);
					return res.status(500).json({ error: 'An error occurred while updating the profile.' });
				}
				console.log('Profile updated successfully');
				res.status(200).json({ success: 'Profile updated successfully' });
			});
		});
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while updating the profile.' });
	}
});



// Route handler for changing password
app.post('/settings/change-password', (req, res) => {
	try {
		const { oldPassword, newPassword } = req.body;
		const user_id = req.session.userID;

		// Check if the old password matches the current password for the user
		connection.query('SELECT password FROM users WHERE id = ?', [user_id], async (error, results) => {
			if (error) {
				console.error('Error querying database:', error);
				return res.status(500).json({ error: 'An error occurred while checking the current password.' });
			}

			if (results.length === 0) {
				return res.status(400).json({ error: 'User not found.' });
			}

			const hashedPassword = results[0].password;
			const passwordMatch = await bcrypt.compare(oldPassword, hashedPassword);

			if (!passwordMatch) {
				return res.status(400).json({ error: 'Incorrect old password.' });
			}

			// Encrypt the new password
			const newHashedPassword = await bcrypt.hash(newPassword, 10);

			// Update the password in the database
			connection.query('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, user_id], (error) => {
				if (error) {
					console.error('Error updating password:', error);
					return res.status(500).json({ error: 'An error occurred while updating the password.' });
				}
				console.log('Password updated successfully');
				res.status(200).json({ success: 'Password updated successfully' });
			});
		});
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while changing the password.' });
	}
});



app.get('/admin-panel', async (req, res) => {
	try {
		const admin = await isAdmin(req.session.userID);
		const users = await getUsers();
		const categories = await getCategories();
		const posts = await adminPostList();

		if (!admin) {
			// If user is not an admin, send a message
			res.status(403).send("You are not authorized to access this page.");
			return;
		}
		
		// If user is an admin, render the admin panel
		res.render('admin/panel', {
			users: users,
			categories: categories,
			posts: posts
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while accessing admin panel.' });
	}
});



function getPostCount(categoryID) {
    return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) as total_posts FROM posts WHERE category_id = ?`;

        connection.query(query, [categoryID], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0].total_posts);
            }
        });
    });
}

const POSTS_PER_PAGE = 5; // Number of posts per page

app.get('/categories/:id', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get page number from query parameter (default to 1)
        const categoryInfo = await getData('categories', req.params.id);
        const loggedIn = isLoggedIn(req);
        const admin = await isAdmin(req.session.userID);
        
        // Calculate offset for pagination
        const offset = (page - 1) * POSTS_PER_PAGE;

		const totalPosts = await getPostCount(req.params.id);

        // Get posts for the current page
        const posts = await getPosts(req.params.id, POSTS_PER_PAGE, offset);
        
        res.render('posts', {
            categoryInfo: categoryInfo,
            loggedIn: loggedIn,
            admin: admin,
            posts: posts,
            currentPage: page, // Pass current page number to the template
            totalPages: Math.ceil(totalPosts / POSTS_PER_PAGE) // Calculate total number of pages
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while accessing the post.' });
    }
});



app.get('/categories/*/posts/:id', async (req, res) => {
	try {
		const postInfo = await getData('posts', req.params.id);
		const loggedIn = isLoggedIn(req);
		const admin = await isAdmin(req.session.userID);
		const posts = await getPostContent(req.params.id);
		const replies = await getReplies(req.params.id);
			
		res.render('content', {
			postInfo: postInfo,
			loggedIn: loggedIn,
			admin: admin,
			posts: posts,
			replies: replies
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while accessing the post.' });
	}
});



// Post creation with assistant reply
app.post('/submit-post', async (req, res) => {
	try {
		const { title, content, categoryID } = req.body;

		// Insert the post into the database
		connection.query('INSERT INTO posts (title, content, category_id, user_id) VALUES (?, ?, ?, ?)', [title, content, categoryID, req.session.userID], async (error, results) => {
			if (error) {
				console.error('Error inserting data into the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'Post submitted.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



app.post('/submit-reply', (req, res) => {
	try {
		const { message, postID } = req.body;

		connection.query('INSERT INTO replies (content, user_id, post_id) VALUES (?, ?, ?)', [message, req.session.userID, postID], (error) => {
			if (error) {
				console.error('Error inserting data into the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'Reply submitted.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



app.get('/delete-reply/:id', (req, res) => {
	try {
		const reply_id = req.params.id;

		connection.query('DELETE FROM replies WHERE id = ?', [reply_id], (error) => {
			if (error) {
				console.error('Error deleting data from the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'Reply deleted.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



app.post('/admin/create-category', (req, res) => {
	try {
		const { title, description, can_post } = req.body;

		connection.query('INSERT INTO categories (title, description, can_post) VALUES (?, ?, ?)', [title, description, can_post], (error) => {
			if (error) {
				console.error('Error inserting data into the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'New category created successfully.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



// Get selected categories data from database
app.post('/admin/get-category', (req, res) => {
	try {
		const categoryID = req.body.category_id; // Get category ID from query parameters

		// Query the database to retrieve category data based on the ID
		connection.query('SELECT title, description, can_post FROM categories WHERE id = ?', [categoryID], (error, results) => {
			if (error) {
				console.error('Error fetching category data from the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			const categoryData = results[0]; // Only one category is needed
			res.status(200).json(categoryData);
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});


// Update category with changes
app.post('/admin/edit-category', (req, res) => {
	try {
		const { category_id, title, description, can_post } = req.body;

		connection.query('UPDATE categories SET title = ?, description = ?, can_post = ? WHERE id = ?', [title, description, can_post, category_id], (error) => {
				if (error) {
					console.error('Error updating data in the database:', error);
					return res.status(500).json({ error: 'An error occurred while processing your request.' });
				}

				res.status(200).json({ success: 'Category updated successfully.' });
			}
		);

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



app.post('/admin/delete-category', (req, res) => {
	try {
		const { category } = req.body;

		// Transaction is used for rolling back data if error happens
		connection.beginTransaction(function(err) {
			if (err) {
				console.error('Error starting transaction:', err);
				return res.status(500).json({ error: 'An error occurred while starting transaction.' });
			}

			// Delete replies related to the posts in the category
			connection.query('DELETE FROM AIreplies WHERE post_id IN (SELECT id FROM posts WHERE category_id = ?)', [category], (error) => {
				if (error) {
					console.error('Error deleting replies:', error);
					return connection.rollback(function() {
						res.status(500).json({ error: 'An error occurred while deleting replies.' });
					});
				}

				// Delete replies related to the posts in the category
				connection.query('DELETE FROM replies WHERE post_id IN (SELECT id FROM posts WHERE category_id = ?)', [category], (error) => {
					if (error) {
						console.error('Error deleting replies:', error);
						return connection.rollback(function() {
							res.status(500).json({ error: 'An error occurred while deleting replies.' });
						});
					}

					// Delete posts related to the category
					connection.query('DELETE FROM posts WHERE category_id = ?', [category], (error) => {
						if (error) {
							console.error('Error deleting posts:', error);
							return connection.rollback(function() {
								res.status(500).json({ error: 'An error occurred while deleting posts.' });
							});
						}

						// Delete the category itself
						connection.query('DELETE FROM categories WHERE id = ?', [category], (error) => {
							if (error) {
								console.error('Error deleting category:', error);
								return connection.rollback(function() {
									res.status(500).json({ error: 'An error occurred while deleting category.' });
								});
							}

							// If all deletions were successful, commit the transaction
							connection.commit(function(err) {
								if (err) {
									console.error('Error committing transaction:', err);
									return connection.rollback(function() {
										res.status(500).json({ error: 'An error occurred while committing transaction.' });
									});
								}

								// Transaction successfully completed
								res.status(200).json({ success: 'All related data deleted successfully.' });
							});
						});
					});
				});
			});
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



// Create a new post
app.post('/admin/create-post', (req, res) => {
	try {
		const { title, content, category_id } = req.body;

		connection.query('INSERT INTO posts (title, content, category_id, user_id) VALUES (?, ?, ?, ?)', [title, content, category_id, req.session.userID], (error) => {
			if (error) {
				console.error('Error inserting data into the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'New post created successfully.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



// Get selected post data from database
app.post('/admin/get-post', (req, res) => {
	try {
		const postID = req.body.post_id;

		connection.query('SELECT title, content, category_id FROM posts WHERE id = ?', [postID], (error, results) => {
			if (error) {
				console.error('Error fetching post data from the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			const postData = results[0];
			res.status(200).json(postData);
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



// Edit an existing post
app.post('/admin/edit-post', (req, res) => {
	try {
		const { post_id, title, content, category_id } = req.body;

		connection.query('UPDATE posts SET title = ?, content = ?, category_id = ? WHERE id = ?', [title, content, category_id, post_id], (error) => {
			if (error) {
				console.error('Error updating data in the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'Post updated successfully.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



// Delete a post
app.post('/admin/delete-post', (req, res) => {
	try {
		const { post_id } = req.body;

		connection.query('DELETE FROM posts WHERE id = ?', [post_id], (error) => {
			if (error) {
				console.error('Error deleting post:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'Post deleted successfully.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



// Route handler for creating a new user
app.post('/admin/create-user', async (req, res) => {
	try {
		const { username, email, password, role } = req.body;

		// Check for existing user with the same username or email
		connection.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (error, results) => {
			if (error) {
				console.error('Error querying database:', error);
				return res.status(500).json({ error: 'An error occurred while checking for duplicates.' });
			}

			if (results.length > 0) {
				return res.status(400).json({ error: 'Username or email already exists.' });
			}

			// Encrypt the password
			const hash = await bcrypt.hash(password, 10);

			// Insert the data into the database
			connection.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hash, role], (error) => {
				if (error) {
					console.error('Error inserting data:', error);
					return res.status(500).json({ error: 'An error occurred while registering the user.' });
				}
				console.log('User inserted successfully');
				res.status(200).json({ success: 'User created successfully' });
			});
		});
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while registering the user.' });
	}
});



// Get selected users data from database
app.post('/admin/get-user', (req, res) => {
	try {
		const userID = req.body.user_id; // Get user ID from query parameters

		// Query the database to retrieve user data based on the ID
		connection.query('SELECT username, email, role FROM users WHERE id = ?', [userID], (error, results) => {
			if (error) {
				console.error('Error fetching user data from the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			const userData = results[0]; // Only one user is needed
			res.status(200).json(userData);
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



// Update user with changes
app.post('/admin/edit-user', (req, res) => {
	try {
		const { user_id, username, email, role } = req.body;

		// Checks if there are any users with the same username or email, excluding the current user being updated (to avoid false positives)
		connection.query('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', [username, email, user_id], (error, results) => {
			if (error) {
				console.error('Error checking for duplicates in the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			if (results.length > 0) {
				// There are duplicates
				return res.status(400).json({ error: 'Username or email already exists.' });
			}

				// No duplicates found, proceed with the update
			connection.query('UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?', [username, email, role, user_id], (error) => {
				if (error) {
					console.error('Error updating data in the database:', error);
					return res.status(500).json({ error: 'An error occurred while processing your request.' });
				}

				res.status(200).json({ success: 'User updated successfully.' });
			});
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});



app.post('/admin/delete-user', (req, res) => {
	try {
		const userID = req.body.userID;

		connection.query('DELETE FROM users WHERE id = ?', [userID], (error) => {
			if (error) {
				console.error('Error updating data in the database:', error);
				return res.status(500).json({ error: 'An error occurred while processing your request.' });
			}

			res.status(200).json({ success: 'User deleted successfully.' });
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'An error occurred while processing your request.' });
	}
});