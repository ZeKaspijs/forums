// Once document is fully loaded, continue
document.addEventListener('DOMContentLoaded', () => {
	const profileImageContainer = document.getElementById('profile-image-container');
	const uploadInput = document.getElementById('upload-input');
	const profilePic = document.getElementById('profile-pic');


	// Click on image to upload a new image
	profileImageContainer.addEventListener('click', () => {
		uploadInput.click();
	});


	// Image upload fetch
	uploadInput.addEventListener('change', () => {
		const file = uploadInput.files[0];
		if (file) {
			const formData = new FormData();
			formData.append('upload', file);

			fetch('/uploadImage', {
				method: 'POST',
				body: formData
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
			profilePic.src = data.url;
		})
		.catch(error => {
			console.error('Error:', error);
			alert(error.message);
		});
		}
	});


	// Save changes, including the uploaded image
	document.getElementById('settings-form').addEventListener('submit', function(event) {
		event.preventDefault();
		
		// Extract the path after the domain
		const imagePath = profilePic.src.split('/').slice(3).join('/');
		
		const formData = {
			username: document.getElementById('username').value,
			email: document.getElementById('email').value,
			image: imagePath

		};

		fetch('/settings/update-profile', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(formData)
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
			alert(error.message);
		});
	});


	// Handle form submission
	document.getElementById('new-password-form').addEventListener('submit', (event) => {
		event.preventDefault();

		const oldPassword = document.getElementById('old-password').value;
		const newPassword = document.getElementById('new-password').value;

		// Form data to send to the server
		const formData = {
			oldPassword: oldPassword,
			newPassword: newPassword
		};

		// Send the form data to the server using fetch
		fetch('/settings/change-password', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(formData)
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
			alert(error.message);
		});
	});
});