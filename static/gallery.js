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
}document.getElementById("enhanceForm").addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent default form submission

  let canvas = document.getElementById("drawingCanvas");
  let formData = new FormData();

  if (!canvas) {
      console.error("Canvas not found!");
      return;
  }

  // Convert canvas to Blob
  if (canvas.toBlob) {
      canvas.toBlob(function(blob) {
          if (!blob) {
              console.error("Failed to convert canvas to Blob.");
              return;
          }

          formData.append("image", blob, "sketch.png");

          uploadImage(formData);
      }, "image/png");
  } else {
      console.error("Canvas.toBlob is not supported in this browser.");
  }
});

function uploadImage(formData) {
  fetch("/api/enhance_sketch/", {
      method: "POST",
      body: formData
  })
  .then(response => response.json())
  .then(data => {
      let enhancedImage = document.getElementById("enhancedImage");
      let errorMessage = document.getElementById("errorMessage");

      if (data.enhanced_image_url) {
          enhancedImage.src = data.enhanced_image_url;
          enhancedImage.classList.remove("hidden");

          // Hide error message if previously shown
          if (errorMessage) errorMessage.classList.add("hidden");
      } else {
          console.error("Error enhancing image:", data.error);
          if (errorMessage) {
              errorMessage.textContent = "Error enhancing image: " + data.error;
              errorMessage.classList.remove("hidden");
          }
      }
  })
  .catch(error => {
      console.error("Request failed", error);
      let errorMessage = document.getElementById("errorMessage");
      if (errorMessage) {
          errorMessage.textContent = "Request failed. Please try again.";
          errorMessage.classList.remove("hidden");
      }
  });
}

// Helper function for older browsers that don't support toBlob
if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function(callback, type, quality) {
          let dataURL = this.toDataURL(type, quality);
          let blob = dataURItoBlob(dataURL);
          callback(blob);
      }
  });
}

// Convert Base64 to Blob
function dataURItoBlob(dataURI) {
  let byteString = atob(dataURI.split(",")[1]);
  let arrayBuffer = new ArrayBuffer(byteString.length);
  let uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: "image/png" });
}
