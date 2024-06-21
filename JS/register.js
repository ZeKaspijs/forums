const form = document.getElementById('register');
const errorMessageElement = document.getElementById('error');

form.addEventListener('submit', function(event) {
	event.preventDefault(); // Prevent form submission

	// Get form values
	const username = form.username.value.trim();
	const email = form.email.value.trim();
	const password = form.password.value.trim();

	const fieldsToCheck = [
		{ field: form.username, message: 'Username is required!' },
		{ field: form.email, message: 'Email is required!' },
		{ field: form.password, message: 'Password is required!' },
		{ field: form.terms, message: 'You must agree to the Terms and Conditions!' }
	];

	let errorMessages = [];

	fieldsToCheck.forEach(({ field, message }) => {
		if (field.type === 'text' || field.type === 'email' || field.type === 'password') {
			if (!field.value.trim()) {
				errorMessages.push(message);
			}
		} else if (field.type !== 'text' && !field.checked) {
			errorMessages.push(message);
		}
	});

	// Check username length
	if (username.length < 4) {
		errorMessages.push('Username must be at least 4 characters long!');
	}

	// Validate email format
	const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	if (!emailPattern.test(email)) {
		errorMessages.push('Please enter a valid email address!');
	}

	// Check password length
	if (password.length < 8) {
		errorMessages.push('Password must be at least 8 characters long!');
	}

	if (errorMessages.length > 0) {
		errorMessageElement.innerHTML = ''; // Clear the error message
		errorMessages.forEach(message => {
			let errorLine = document.createElement('li');
			errorLine.textContent = message;
			errorMessageElement.appendChild(errorLine);
		});
		errorMessageElement.classList.add('slide-in'); // Add slide-in class
	} else {
		errorMessageElement.classList.remove('slide-in'); // Remove slide-in class
		errorMessageElement.textContent = ''; // Clear the error message

		// AJAX request to check for duplicates and register the user
		fetch('/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username, email, password })
		})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				// Display server-side validation errors
				errorMessages.push(data.error);
				errorMessageElement.innerHTML = ''; // Clear the error message

				errorMessages.forEach(message => {
					let errorLine = document.createElement('li');
					errorLine.textContent = message;
					errorMessageElement.appendChild(errorLine);
				});

				errorMessageElement.classList.add('slide-in'); // Add slide-in class
			} else {
				// Redirect to home page on successful registration
				window.location.href = '/';
			}
		})
		.catch(error => {
			console.error('Error:', error);
		});
	}
});