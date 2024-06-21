const form = document.getElementById('login');
const errorMessageElement = document.getElementById('error');


form.addEventListener('submit', function(event) {
	event.preventDefault(); // Prevent form submission

	// Get form values
	const email = form.email.value.trim();
	const password = form.password.value.trim();

	const fieldsToCheck = [
		{ field: form.email, message: 'Email is required!' },
		{ field: form.password, message: 'Password is required!' },
	];

	let errorMessages = [];

	fieldsToCheck.forEach(({ field, message }) => {
		if (field.type === 'email' || field.type === 'password') {
			if (!field.value.trim()) {
				errorMessages.push(message);
			}
		}
	});

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

		// AJAX request to check for duplicates
		fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password })
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
				// Redirect to home page on successful login
				window.location.href = '/';
			}
		})
		.catch(error => {
			console.error('Error:', error);
		});
	}
});