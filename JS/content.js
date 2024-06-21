let editor; // CKEditor 5

ClassicEditor.create(document.querySelector('#editor'), {
	simpleUpload: {
		uploadUrl: '/uploadImage' // Server-side upload handler URL
	},

	mediaEmbed: {
		previewsInData: true // Enable previews in data
	},
	})
	.then(newEditor => {
		editor = newEditor;

		// Monitor editor changes and toggle the button accordingly
		editor.model.document.on('change:data', () => {
			toggleButton(editor);
		});

		// Initial check to set the button state
		toggleButton(editor);
	})
	.catch(error => {
		console.error(error);
	});



const form = document.getElementById('reply-form');
const button = document.getElementById('submit');

// Listening for reply form submittion
form.addEventListener("submit", function(event) {
	event.preventDefault();

	const message = editor.getData();
	const postID = document.getElementById("postID").value.trim();
	
	// Send data to server
	fetch('/submit-reply', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ message , postID })
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		location.reload();
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred while processing your request.');
	});
});



// Make button clickable only when there is text in textarea
function toggleButton() {
	if (editor) {
		const message = editor.getData();

		if (message === "") {
			button.disabled = true;
		} else {
			button.disabled = false;
		}
	}
}



function deleteReply(replyId) {
	// Confirm deletion with the user
	if (confirm("Are you sure you want to delete this reply?")) {
		// Send an AJAX request to delete the reply
		fetch(`/delete-reply/${replyId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then(data => {
			alert('Reply has been deleted!');
			location.reload();
		})
		.catch(error => {
			console.error('Error:', error);
			alert('An error occurred while processing your request.');
		});
	}
}