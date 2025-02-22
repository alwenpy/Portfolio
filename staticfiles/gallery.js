function submitComment(form) {
  const drawingId = form.dataset.drawingId;
  const input = form.querySelector('input[name="comment_text"]');
  const commentText = input.value.trim();
  const storedUser = localStorage.getItem("airCanvasUsername"); // Fetch username from localStorage

  if (!storedUser) {
    alert("Please set a username before commenting.");
    return;
  }

  const username = JSON.parse(storedUser).value; // Extract username from stored JSON
  console.log("Using Username:", username);

  if (!commentText || !username) {
    alert("Please enter a comment and make sure you are logged in.");
    return;
  }

  fetch("/add-comment/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": form.querySelector("[name=csrfmiddlewaretoken]").value,
    },
    body: JSON.stringify({
      drawing_id: drawingId,
      text: commentText,
      username: "harshit" // Send extracted username
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // Create new comment element
      const commentsList = form
        .closest(".drawing-card")
        .querySelector(".comments-list");
      const newComment = createCommentElement({
        username: username, // Use extracted username
        text: commentText,
        created_at: new Date().toISOString(), // Use ISO format for consistency
      });

      // Add to comments list
      commentsList.appendChild(newComment);

      // Clear input
      input.value = "";

      // Scroll to bottom of comments
      commentsList.scrollTop = commentsList.scrollHeight;
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while submitting the comment.");
    });

  function createCommentElement(comment) {
    const div = document.createElement("div");
    div.className = "comment bg-gray-700 rounded p-2 mb-2";
    div.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-blue-400 text-sm">@${comment.username}</span>
            <span class="text-gray-400 text-xs">${formatDate(
              comment.created_at
            )}</span>
        </div>
        <p class="text-white text-sm mt-1">${comment.text}</p>
    `;
    return div;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    );
  }

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
  }
}
