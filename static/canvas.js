// DOM Elements
let canvas, ctx, video, colorPicker, pointer, canvasContainer, usernameWrapper,
    launchWrapper, usernameInput, saveUsernameBtn, message,saveCanvas;

// Canvas state
let drawing = false;
let prevX = null, prevY = null;
let brushColor = "#000000";
let brushSize = 5;
let eraseMode = false;
let undoStack = [], redoStack = [];
let drawingMode = 'free'; // 'free', 'rectangle', 'circle'
let shapeStartPoint = null;
let colorSwitchCooldown = 0;
let handTracking = null;

// Color palette
const colors = {
    'green': '#00FF00',
    'blue': '#0000FF',
    'red': '#FF0000',
    'black': '#000000'
};
let currentColorIndex = 0;
const colorList = Object.values(colors);

// MediaPipe and Camera Configuration
let hands;
let camera;

document.addEventListener("DOMContentLoaded", () => {
    // Initialize DOM Elements
    canvas = document.getElementById("drawingCanvas");
    ctx = canvas.getContext("2d");
    video = document.getElementById("video");
    colorPicker = document.getElementById("colorPicker");
    pointer = document.getElementById("pointer");
    canvasContainer = document.getElementById("canvasContainer");
    usernameWrapper = document.getElementById("usernameWrapper");
    launchWrapper = document.getElementById("launchWrapper");
    usernameInput = document.getElementById("usernameInput");
    saveUsernameBtn = document.getElementById("saveUsername");
    message = document.getElementById("message");
    saveCanvas = document.getElementById("saveCanvas");


    // Initialize the application
    init();

    // Add event listeners
    if (saveUsernameBtn) {
        saveUsernameBtn.addEventListener("click", handleUsernameSubmit);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
});

function displayUsername() {
    const currentUsername = getStoredUsername();
    if (!currentUsername) return;
    console.log("Current username:", currentUsername);

    // Get the existing div
    let usernameDiv = document.getElementById("usernameDisplay");

    if (!usernameDiv) {
        usernameDiv = document.createElement("div");
        usernameDiv.id = "usernameDisplay";
        usernameDiv.className = "mt-4 text-lg font-semibold text-white";
        document.getElementById("usernameWrapper").appendChild(usernameDiv);
    }

    // Update text content
    usernameDiv.textContent = `Welcome, ${currentUsername}!`;

    // Remove the hidden class
    usernameDiv.classList.remove("hidden");
}

// Username Management
function init() {
    const currentUsername = getStoredUsername();
    if (currentUsername) {
        showLaunchButton();
        displayUsername();
    } else {
        showUsernameInput();
    }
}

function getStoredUsername() {
    try {
        const stored = localStorage.getItem("airCanvasUsername");
        return stored ? JSON.parse(stored).value : null;
    } catch (error) {
        console.error("Error retrieving username:", error);
        return null;
    }
}

function showUsernameInput() {
    if (usernameWrapper && launchWrapper) {
        usernameWrapper.classList.remove("hidden");
        launchWrapper.classList.add("hidden");
    }
}

function showLaunchButton() {
    if (usernameWrapper && launchWrapper) {
        usernameWrapper.classList.add("hidden");
        launchWrapper.classList.remove("hidden");

        if (!document.getElementById("startCanvas")) {
            const button = document.createElement("button");
            button.id = "startCanvas";
            button.className = "px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors";
            button.textContent = "Launch Air Canvas";
            button.addEventListener("click", startCanvas);
            launchWrapper.appendChild(button);
        }
    }
}

function handleUsernameSubmit() {
    const username = usernameInput.value.trim();
    if (!username) {
        showMessage("Please enter a username!", "error");
        return;
    }
    localStorage.setItem("airCanvasUsername", JSON.stringify({ value: username }));
    showMessage("Username saved successfully!", "success");
    showLaunchButton();
    displayUsername();
}

// Canvas Launch and Initialization
async function startCanvas() {
    if (!canvasContainer) return;

    try {
        canvasContainer.classList.remove("hidden");
        saveCanvas.classList.remove("hidden");

        // Initialize camera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 480,
                height: 360
            }
        });

        if (video) {
            video.srcObject = stream;
            await video.play();
            showMessage("Camera initialized successfully!", "success");
        }

        // Initialize MediaPipe Hands
        await initializeHandTracking();

        // Start camera feed
        camera = new Camera(video, {
            onFrame: async () => {
                await hands.send({image: video});
            },
            width: 480,
            height: 360
        });
        camera.start();

        // Initialize color buttons
        initializeColorButtons();

    } catch (error) {
        console.error("Error starting canvas:", error);
        showMessage("Error starting camera: " + error.message, "error");
    }
}

// Hand Tracking Functions
function initializeHandTracking() {
    hands = new Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults(handleHandResults);
    return hands;
}

function handleHandResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    const landmarks = results.multiHandLandmarks[0];
    const x = canvas.width - (landmarks[8].x * canvas.width);
    const y = landmarks[8].y * canvas.height;

    const gestures = detectGestures(landmarks);
    drawingMode = gestures.drawingMode;
    eraseMode = gestures.isErasing;

    if (gestures.isColorChange && colorSwitchCooldown <= 0) {
        currentColorIndex = (currentColorIndex + 1) % colorList.length;
        brushColor = colorList[currentColorIndex];
        colorSwitchCooldown = 20;
    }

    drawPointer(x, y, eraseMode);

    if (gestures.isDrawing || gestures.isErasing) {
        if (drawingMode === 'free' || eraseMode) {
            if (prevX !== null && prevY !== null) {
                saveCanvasState();
                drawLine(prevX, prevY, x, y, eraseMode);
            }
            prevX = x;
            prevY = y;
        } else {
            handleShapeDrawing(x, y);
        }
    } else {
        finalizeShapeDrawing(x, y);
    }

    if (colorSwitchCooldown > 0) colorSwitchCooldown--;
}

// Drawing Functions
function drawShape(start, end, mode) {
    ctx.beginPath();
    if (mode === 'rectangle') {
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.rect(start.x, start.y, width, height);
    } else if (mode === 'circle') {
        const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    }
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();
    ctx.closePath();
}

function handleShapeDrawing(x, y) {
    if (!shapeStartPoint) {
        shapeStartPoint = { x, y };
        saveCanvasState();
    } else if (undoStack.length > 0) {
        const img = new Image();
        img.src = undoStack[undoStack.length - 1];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            drawShape(shapeStartPoint, { x, y }, drawingMode);
        };
    }
}

function finalizeShapeDrawing(x, y) {
    if (shapeStartPoint) {
        drawShape(shapeStartPoint, { x, y }, drawingMode);
        shapeStartPoint = null;
    }
    prevX = null;
    prevY = null;
}

function detectGestures(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerStates = fingerTips.map(tip => landmarks[tip].y < landmarks[tip - 2].y ? 1 : 0);
    const fingerPattern = JSON.stringify(fingerStates);

    return {
        isDrawing: ['[1,0,0,0]', '[1,1,0,0]', '[1,1,1,0]'].includes(fingerPattern),
        isErasing: fingerStates.every(state => state === 1),
        isColorChange: fingerPattern === '[0,0,0,1]',
        drawingMode: fingerPattern === '[1,1,0,0]' ? 'rectangle' :
                     fingerPattern === '[1,1,1,0]' ? 'circle' : 'free'
    };
}

// Utility Functions
function drawLine(startX, startY, endX, endY, erase = false) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = erase ? "#FFFFFF" : brushColor;
    ctx.lineWidth = erase ? brushSize + 20 : brushSize;
    ctx.stroke();
    ctx.closePath();
}
function startVideoStream() {
    const videoElement = document.getElementById("video");

    if (!videoElement) {
        console.error("Video element not found.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoElement.srcObject = stream;
        })
        .catch(error => {
            console.error("Error accessing webcam:", error);
            alert("Could not access webcam. Please allow camera permissions.");
        });
}

// Start the video when the page loads


function drawPointer(x, y, isErasing) {
    pointer.style.left = `${x + canvas.offsetLeft}px`;
    pointer.style.top = `${y + canvas.offsetTop}px`;
    pointer.style.backgroundColor = isErasing ? "#FFFFFF" : brushColor;
    pointer.style.width = `${isErasing ? brushSize + 20 : brushSize}px`;
    pointer.style.height = `${isErasing ? brushSize + 20 : brushSize}px`;
    pointer.style.border = "2px solid black";
}

function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === 'z') undo();
    if (e.ctrlKey && e.key === 'y') redo();
    if (e.key === 'c') clearCanvas();
    if (e.key === '+') brushSize = Math.min(brushSize + 1, 20);
    if (e.key === '-') brushSize = Math.max(brushSize - 1, 1);
}

function initializeColorButtons() {
    const colorButtons = document.querySelectorAll('[onclick^="setColor"]');
    colorButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const color = e.target.style.backgroundColor;
            setColor(color);
        });
    });
}

function setColor(color) {
    brushColor = color;
    pointer.style.backgroundColor = color;
}

function showMessage(text, type = "info") {
    if (message) {
        message.textContent = text;
        message.className = `text-sm ${type === "error" ? "text-red-500" : "text-green-500"}`;
        setTimeout(() => {
            message.textContent = "";
        }, 3000);
    }
}

// Canvas State Management
function saveCanvasState() {
    undoStack.push(canvas.toDataURL());
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(canvas.toDataURL());
    restoreCanvasState(undoStack.pop());
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(canvas.toDataURL());
    restoreCanvasState(redoStack.pop());
}

function restoreCanvasState(imageData) {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

function clearCanvas() {
    saveCanvasState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
