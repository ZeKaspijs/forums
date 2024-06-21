let postEditor, editPostEditor; // CKEditor 5

ClassicEditor.create(document.querySelector('#postEditor'), {
	simpleUpload: {
	  	uploadUrl: '/uploadImage' // Your server-side upload handler URL
	 },

	mediaEmbed: {
	 	previewsInData: true // Enable previews in data
	},
})
.then(newEditor => {
	postEditor = newEditor;
})
.catch(error => {
	console.error(error);
});



ClassicEditor.create(document.querySelector('#editPostEditor'), {
	simpleUpload: {
	  	uploadUrl: '/uploadImage' // Your server-side upload handler URL
	},

	mediaEmbed: {
	 	previewsInData: true // Enable previews in data
 	},
})
.then(newEditor => {
	editPostEditor = newEditor;
})
.catch(error => {
	console.error(error);
});



// Listening for new category popup form submittion
document.getElementById("new-category-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const title = document.getElementById("title").value.trim();
	const description = document.getElementById("description").value.trim();
	const can_post = document.getElementById("private").checked;

	// Send data to server
	fetch('/admin/create-category', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ title, description, can_post })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show Google popup with success message
		alert('New category created successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});



// Listening for edit category form submission
document.getElementById("edit-category-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const category_id = document.getElementById("edit-category-select").value.trim();
	const title = document.getElementById("edit-title").value.trim();
	const description = document.getElementById("edit-description").value.trim();
	const can_post = document.getElementById("edit-private").checked;

	// Send data to server
	fetch('/admin/edit-category', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ category_id, title, description, can_post })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show popup with success message
		alert('Category edited successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});



// Listening for category deletion popup
document.getElementById("delete-category-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const category = document.getElementById("category").value.trim();

	// Send data to server
	fetch('/admin/delete-category', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ category })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show Google popup with success message
		alert('Category deleted successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});



// Listening for new post popup form submission
document.getElementById("new-post-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const title = document.getElementById("post-title").value.trim();
	const content = postEditor.getData(); // Fetch CKEditor content and trim whitespace
	const category_id = document.getElementById("post-category-select").value;

	// Check if CKEditor content is empty
	if (content === '') {
		alert('Text field cannot be empty!');
		return;
	}

	// Send data to server
	fetch('/admin/create-post', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ title, content, category_id })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show popup with success message
		alert('New post created successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});



// Listening for edit post form submission
document.getElementById("edit-post-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const post_id = document.getElementById("edit-post-select").value.trim();
	const title = document.getElementById("edit-post-title").value.trim();
	const content = editPostEditor.getData();
	const category_id = document.getElementById("edit-post-category-select").value;

	// Send data to server
	fetch('/admin/edit-post', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ post_id, title, content, category_id })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show popup with success message
		alert('Post edited successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});




// Listening for post deletion popup form submission
document.getElementById("delete-post-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const post_id = document.getElementById("delete-post-select").value.trim();

	// Send data to server
	fetch('/admin/delete-post', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ post_id })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show popup with success message
		alert('Post deleted successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});



// Listening for new user popup form submission
document.getElementById("new-user-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const username = document.getElementById("username").value.trim();
	const email = document.getElementById("email").value.trim();
	const password = document.getElementById("password").value.trim();
	const role = document.getElementById("role").value;

	// Validation checks
	if (username.length < 4) {
		alert('Username must be at least 4 characters long!');
		return;
	}

	const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	if (!emailPattern.test(email)) {
		alert('Please enter a valid email address!');
		return;
	}

	if (password.length < 8) {
		alert('Password must be at least 8 characters long!');
		return;
	}

	// Send data to server
	fetch('/admin/create-user', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ username, email, password, role })
	})
	.then(response => {
		return response.json().then(data => {
			if (!response.ok) {
				// If the response is not ok, throw an error with the message from the response
				throw new Error(data.error || 'Network response was not ok');
			}
			return data;
		});
	})
	.then(data => {
		alert(data.success);
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert(`An error occurred: ${error.message}`);
	});
});



// Listening for edit user form submission
document.getElementById("edit-user-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const user_id = document.getElementById("edit-user-select").value.trim();
	const username = document.getElementById("edit-username").value.trim();
	const email = document.getElementById("edit-email").value.trim();
	const role = document.getElementById("edit-role").value;

	// Send data to server
	fetch('/admin/edit-user', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ user_id, username, email, role })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show popup with success message
		alert('User edited successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});



// Listening for category deletion popup
document.getElementById("delete-user-form").addEventListener("submit", function(event) {
	event.preventDefault();

	// Get values from form fields
	const userID = document.getElementById("user").value.trim();

	// Send data to server
	fetch('/admin/delete-user', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userID })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		// Show Google popup with success message
		alert('User deleted successfully!');
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});


// Toggle the sidebar navigation menu
function toggleMenu(menuId) {
	var menu = document.getElementById(menuId);
	if (menu.style.display === "block") {
		menu.style.display = "none";
	} else {
		menu.style.display = "block";
	}
}


// Load category data when selecting category from dropdown list
function loadCategoryData(categoryID) {
	if (!categoryID) return;

	fetch(`/admin/get-category`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			category_id: categoryID,
		}),
	})
	.then(response => response.json())
	.then(data => {
		if (data) {
			document.getElementById('edit-title').value = data.title;
			document.getElementById('edit-description').value = data.description;
			document.getElementById('edit-private').checked = data.can_post;
		}
	})
	.catch(error => console.error('Error fetching category data:', error));
}



// Load post data when selecting post from dropdown list
function loadPostData(postID) {
	if (!postID) return;

	fetch(`/admin/get-post`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			post_id: postID,
		}),
	})
	.then(response => response.json())
	.then(data => {
		if (data) {
			document.getElementById('edit-post-title').value = data.title;
			// Set CKEditor content
			editPostEditor.setData(data.content);
			document.getElementById('edit-post-category-select').value = data.category_id;
		}
	})
	.catch(error => console.error('Error fetching post data:', error));
}




// Load user data when selecting user from dropdown list
function loadUserData(userID) {
	if (!userID) return;

	fetch(`/admin/get-user`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user_id: userID,
		}),
	})
	.then(response => response.json())
	.then(data => {
		if (data) {
			document.getElementById('edit-username').value = data.username;
			document.getElementById('edit-email').value = data.email;
			document.getElementById('edit-role').value = data.role;
		}
	})
	.catch(error => console.error('Error fetching category data:', error));
}