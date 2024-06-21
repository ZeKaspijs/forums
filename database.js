import mysql from 'mysql';
import dotenv from 'dotenv';


dotenv.config();

// Create a database connection
const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD
});



// Connect to MySQL server
connection.connect((error) => {
	if (error) {
		console.error('Error connecting to MySQL server:', error);
		return;
	}
	console.log('Connected to MySQL server');
	
	// Create the database after successful connection
	createDatabase();
});



// Function to create the database
function createDatabase() {
	connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (error) => {
		if (error) {
			console.error('Error creating database:', error);
			return;
		}
		console.log('Database created successfully');
		
		// Reconnect to the newly created database
		connection.changeUser({ database: process.env.DB_NAME }, (error) => {
			if (error) {
				console.error('Error reconnecting to the database:', error);
				return;
			}
			console.log('Reconnected to the newly created database');
			
			// Create the tables
			createTable('users', usersTable);
			createTable('categories', categoriesTable);
			createTable('posts', postsTable);
			createTable('replies', repliesTable);
		});
	});
}



// Function to create a table
function createTable(tableName, tableDefinition) {
	const createTableQuery = `
		CREATE TABLE IF NOT EXISTS ${tableName} (
			${tableDefinition}
		)
	`;

	connection.query(createTableQuery, (error) => {
		if (error) {
			console.error(`Error creating table ${tableName}:`, error);
			return;
		}
		console.log(`Table ${tableName} created successfully`);
	});
}



// Check whether user is admin or not
export function isAdmin(userID) {
	return new Promise((resolve, reject) => {
		// If user is not logged in
		if (!userID) {
			return resolve(false);
		}
		connection.query('SELECT role FROM users WHERE id = ?', [userID], (error, results) => {
			if (error) {
				reject(error); // Reject the promise with the error
			} else {
		 		if (results[0].role == 'admin') {
					resolve(true); // Resolve the promise with the fetched results
				} else {
					resolve(false);
				}
			}
		});
	});
}



export function getUsers() {
	return new Promise((resolve, reject) => {
		const query = `SELECT id, username FROM users`;

		connection.query(query, (error, results) => {
			if (error) {
				reject(error); // Reject the promise with the error
			} else {
				resolve(results); // Resolve the promise with the results
			}
		});
	});
}



export function getCategories() {
	return new Promise((resolve, reject) => {
		const query = `
			SELECT 
				c.*, 
				COUNT(p.id) AS post_count,
				lp.title AS latest_post_title,
				lp.created_at AS latest_post_created_at,
				u.username AS latest_post_username
			FROM 
				categories c
			LEFT JOIN 
				posts p ON c.id = p.category_id
			LEFT JOIN 
				posts lp ON c.id = lp.category_id 
				AND lp.created_at = (
					SELECT 
						MAX(created_at)
					FROM 
						posts
					WHERE 
						category_id = c.id
				)
			LEFT JOIN
				users u ON lp.user_id = u.id
			GROUP BY 
				c.id
		`;

		connection.query(query, (error, results) => {
			if (error) {
				reject(error); // Reject the promise with the error
			} else {
				resolve(results); // Resolve the promise with the results
			}
		});
	});
}



export function getPosts(categoryID, limit, offset) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                p.*,
                u.username,
                COUNT(r.id) as reply_count,
                lr.created_at AS latest_reply_created_at,
                ur.username AS latest_reply_username
            FROM 
                posts p
            LEFT JOIN 
                categories c ON p.category_id = c.id
            LEFT JOIN
                users u ON p.user_id = u.id
            LEFT JOIN
                replies r ON r.post_id = p.id
            LEFT JOIN
                replies lr ON p.id = lr.post_id 
                AND lr.created_at = (
                    SELECT 
                        MAX(created_at)
                    FROM 
                        replies
                    WHERE 
                        post_id = p.id
                )
            LEFT JOIN
                users ur ON lr.user_id = ur.id
            WHERE 
                c.id = ?
            GROUP BY
                p.id
            ORDER BY
                p.created_at DESC
            LIMIT ?, ?
        `;

        connection.query(query, [categoryID, offset, limit], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}



// Fetch all posts with in each category
export function getPostContent(postID) {
	return new Promise((resolve, reject) => {
		const query = `
			SELECT 
				p.*,
				u.username
			FROM 
				posts p
			LEFT JOIN 
				categories c ON p.category_id = c.id
			LEFT JOIN
				users u ON p.user_id = u.id
			WHERE 
				p.id = ?
		`;

		connection.query(query, [postID], (error, results) => {
			if (error) {
				reject(error); // Reject the promise with the error
			} else {
				resolve(results); // Resolve the promise with the results
			}
		});
	});
}



// Fetch all replies from specific post
export function getReplies(postID) {
	return new Promise((resolve, reject) => {
		const query = `
			SELECT 
				r.*,
				u.username,
				u.image
			FROM 
				replies r
			LEFT JOIN
				users u ON r.user_id = u.id
			LEFT JOIN
				posts p ON r.post_id = p.id
			WHERE
				r.post_id = ?
		`;

		connection.query(query, [postID], (error, results) => {
			if (error) {
				reject(error); // Reject the promise with the error
			} else {
				resolve(results); // Resolve the promise with the results
			}
		});
	});
}



// Check whether user is admin or not
export function getData(table, ID) {
	return new Promise((resolve, reject) => {
		connection.query(`SELECT * FROM ${table} WHERE id = ?`, [ID], (error, results) => {
			if (error) {
				reject(error); // Reject the promise with the error
			} else {
				resolve(results);
			}
		});
	});
}



// Fetch all posts from a category for admin panel list
export function adminPostList() {
	return new Promise((resolve, reject) => {
		const query = `SELECT id, title FROM posts`;

		connection.query(query, (error, results) => {
			if (error) {
				reject(error);
			} else {
				resolve(results);
			}
		});
	});
}



// Database tables
const usersTable = `
	id INT AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(33) NOT NULL,
	email VARCHAR(33) NOT NULL,
	password VARCHAR(155) NOT NULL,
	role VARCHAR(33) DEFAULT 'user',
	image VARCHAR(255) DEFAULT 'default.jpg'
`;

const categoriesTable = `
	id INT AUTO_INCREMENT PRIMARY KEY,
	title VARCHAR(33) NOT NULL,
	description VARCHAR(122) NOT NULL,
	can_post BOOLEAN NOT NULL
`;

const postsTable = `
	id INT AUTO_INCREMENT PRIMARY KEY,
	title VARCHAR(33) NOT NULL,
	content TEXT NOT NULL,
	category_id INT,
	user_id INT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (category_id) REFERENCES categories(id),
	FOREIGN KEY (user_id) REFERENCES users(id)
`;

const repliesTable = `
	id INT AUTO_INCREMENT PRIMARY KEY,
	content TEXT NOT NULL,
	post_id INT,
	user_id INT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (post_id) REFERENCES posts(id),
	FOREIGN KEY (user_id) REFERENCES users(id)
`;

export default connection;