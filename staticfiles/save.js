document.addEventListener("DOMContentLoaded", function() {
    const saveButton = document.getElementById("saveCanvas");
    if (!saveButton) {
        console.error("Save button not found!");
        return;
    }

    saveButton.addEventListener("click", async function () {
        console.log("Save button clicked");
        const storedData = localStorage.getItem("airCanvasUsername");
        console.log("Stored username data:", storedData);

        if (!storedData) {
            alert("Please enter your username first.");
            return;
        }

        try {
            const { value: username } = JSON.parse(storedData);

            const canvas = document.getElementById("drawingCanvas");
            if (!canvas) {
                alert("Canvas not found!");
                return;
            }

            const imageData = canvas.toDataURL("image/png");

            const response = await fetch("https://alwen.pythonanywhere.com/savedrawing/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                credentials: 'include', // Important for CSRF
                body: JSON.stringify({ username, image: imageData }),
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error("Error details:", error);
            alert("An error occurred while saving the canvas: " + error.message);
        }
    });

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
});