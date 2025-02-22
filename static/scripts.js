async function applyChanges() {
  const command = document.getElementById("command").value.trim();

  if (!command) {
    alert("Command cannot be empty.");
    return;
  }

  // Show loader
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/apply-changes/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Change-Type": "js", // Only handling JS now
        },
        body: JSON.stringify({ command }),
      }
    );

    if (response.ok) {
      const data = await response.json();

      // Apply JavaScript dynamically
      let scriptTag = document.getElementById("dynamic-script");
      if (scriptTag) {
        scriptTag.remove(); // Remove old script to avoid conflicts
      }

      scriptTag = document.createElement("script");
      scriptTag.id = "dynamic-script";
      scriptTag.textContent = data.js; // Apply generated JS
      document.body.appendChild(scriptTag);

      // Create success toast message
      const toast = document.createElement("div");
      toast.id = "toast-success";
      toast.className =
        "flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800";
      toast.setAttribute("role", "alert");
      toast.classList.add(
        "fixed",
        "bottom-0",
        "left-1/2",
        "-translate-x-1/2",
        "mb-6",
        "z-40"
      );

      toast.innerHTML = `
              <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-blue-800 dark:text-blue-200">
                  <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                  </svg>
                  <span class="sr-only">Check icon</span>
              </div>
              <div class="ms-3 text-sm font-normal">Effect successfully applied.</div>
              <button type="button" class="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close">
                  <span class="sr-only">Close</span>
                  <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
              </button>
          `;

      const playground = document.getElementById("playground");
      if (playground) {
        playground.appendChild(toast);
      } else {
        console.error("Playground element not found.");
      }

      setTimeout(() => {
        toast.classList.add("animate__animated", "animate__fadeOut");
        setTimeout(() => toast.remove(), 1000); // Remove after fade-out animation
      }, 5000);
    } else {
      const errorData = await response.json();
      alert(`Failed to apply JS: ${errorData.detail}`);
    }
  } catch (error) {
    console.error("Error applying JS:", error);
    alert(
      "An error occurred while applying JS. Check the console for details."
    );
  } finally {
    // Hide loader
    loader.classList.add("hidden");
  }
}

const scrollToFooter = document.getElementById("scrollToFooter");

document
  .getElementById("scrollToFooter")
  .addEventListener("click", function (e) {
    e.preventDefault(); // Prevent default link behavior
    console.log("clicked");
    document.getElementById("footer").scrollIntoView({
      behavior: "smooth", // Enables smooth scrolling
      block: "start", // Scrolls to the top of the footer section
    });
  });
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    const targetId = link.getAttribute("href").substring(1); // Remove the '#' from href
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

document.querySelectorAll("[data-dial-toggle]").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const menu = document.getElementById(toggle.getAttribute("aria-controls"));
    menu.classList.toggle("hidden");
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", !expanded);
  });
});

async function fetchAnimeGif() {
  const container = document.getElementById("animeGifContainer");
  const btn = document.getElementById("generateAnimeBtn");
  btn.disabled = true;
  btn.textContent = "Loading...";

  try {
    const response = await fetch(
      "https://alwen.pythonanywhere.com/anime-of-the-day"
    );
    if (response.ok) {
      const data = await response.json();
      if (data.gif_url) {
        container.innerHTML = `<img src="${data.gif_url}" alt="Anime GIF" class="max-w-full rounded-lg shadow-lg">`;
      } else {
        container.innerHTML = `<p class="text-red-500">No GIFs found. Try again.</p>`;
      }
    } else {
      container.innerHTML = `<p class="text-red-500">Failed to fetch GIF. Please try again later.</p>`;
    }
  } catch (error) {
    container.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate";
  }
}

document
  .getElementById("generateAnimeBtn")
  .addEventListener("click", fetchAnimeGif);

document.getElementById("surprise").addEventListener("click", function () {
  document.getElementById("surprise").classList.add("hidden");
  document.getElementById("anime").classList.remove("hidden");
  fetchAnimeGif();
});

function scrollToSection(sectionId) {
  const section = document.querySelector(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}



document
  .getElementById("speed-dial-toggle")
  .addEventListener("click", function () {
    const menu = document.getElementById("footer-speed-dial");

    // Toggle the hidden class for visibility
    menu.classList.toggle("hidden");

    // Animate the opacity and scale properties
    if (menu.classList.contains("hidden")) {
      // If the menu is hidden, reset opacity and scale
      menu.classList.remove("opacity-100", "scale-100");
      menu.classList.add("opacity-0", "scale-90");
    } else {
      // If the menu is visible, apply smooth transition for opacity and scale
      setTimeout(() => {
        menu.classList.remove("opacity-0", "scale-90");
        menu.classList.add("opacity-100", "scale-100");
      }, 10); // Delay to ensure class toggle happens after visibility change
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    const scrollToFooterBtn = document.querySelector('#scrollToFooter'); // Your button
    const footer = document.querySelector('#footer'); // Your footer
    const header = document.querySelector('#header'); // Your header
  
    // Function to handle button visibility based on screen size
    function updateVisibility() {
      if (window.innerWidth < 1024) {
        scrollToFooterBtn.style.display = "none"; // Hide on smaller screens
      } else {
        scrollToFooterBtn.style.display = "flex"; // Default state for larger screens
      }
    }
  
    // Call updateVisibility when the script loads
    updateVisibility();
  
    // Update visibility dynamically on window resize
    window.addEventListener("resize", updateVisibility);
  
    // IntersectionObserver for footer visibility
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (window.innerWidth >= 1024) { // Only apply logic for larger screens
            if (entry.isIntersecting) {
              scrollToFooterBtn.style.display = "none"; // Hide when footer is visible
            } else {
              scrollToFooterBtn.style.display = "flex"; // Show otherwise
            }
          }
        });
      },
      {
        root: null, // Use the viewport as the root
        threshold: 0.1, // Trigger when 10% of the footer is visible
      }
    );
  
    // Observe the footer
    footerObserver.observe(footer);
  
    // IntersectionObserver for header visibility
    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (window.innerWidth >= 1024) {
          if (entry.isIntersecting) {
            scrollToFooterBtn.style.display = "none"; // Hide when header is visible
          } else {
            scrollToFooterBtn.style.display = "flex"; // Show otherwise
          }
        }
      },
      {
        root: null,
        threshold: 0.1, // Trigger when 10% of the header is visible
      }
    );
  
    // Observe the header
    headerObserver.observe(header);
  
    // Function to hide button when scrolled to the bottom
    function checkScrollPosition() {
      if (window.innerWidth >= 1024) {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
  
        if (scrollPosition >= documentHeight - 10) {
          // Hide button when scrolled to the bottom
          scrollToFooterBtn.style.display = "none";
        } else {
          // Show button when not at the bottom
          scrollToFooterBtn.style.display = "flex";
        }
      }
    }
  
    // Add a scroll event listener to check the scroll position
    window.addEventListener("scroll", checkScrollPosition);
  });
  document.addEventListener("mousemove", (event) => {
    const gradient = document.getElementById("cursor-gradient");
  
    // Update gradient position
    gradient.style.left = `${event.clientX}px`;
    gradient.style.top = `${event.clientY}px`;
  });

  
  // custom cursor

  const body = document.body;

const MathUtils = {
  lineEq: (y2, y1, x2, x1, currentVal) => {
    // y = mx + b
    var m = (y2 - y1) / (x2 - x1),
      b = y1 - m * x1;
    return m * currentVal + b;
  },
  lerp: (a, b, n) => (1 - n) * a + n * b,
  getRandomFloat: (min, max) => (Math.random() * (max - min) + min).toFixed(2)
};

const getMousePos = e => {
  let posx = 0;
  let posy = 0;
  if (!e) e = window.event;
  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx = e.clientX + body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + body.scrollTop + document.documentElement.scrollTop;
  }
  return { x: posx, y: posy };
};

let winsize;
const calcWinsize = () =>
  (winsize = { width: window.innerWidth, height: window.innerHeight });
calcWinsize();
window.addEventListener("resize", calcWinsize);

let mousepos = { x: winsize.width / 2, y: winsize.height / 2 };
window.addEventListener("mousemove", ev => (mousepos = getMousePos(ev)));

// Custom cursor
class Cursor {
  constructor(el) {
    this.DOM = { el: el };
    this.DOM.circle = this.DOM.el.querySelector(".js-cursor-inner");
    this.DOM.arrows = {
      right: this.DOM.el.querySelector(".js-cursor-right"),
      left: this.DOM.el.querySelector(".js-cursor-left")
    };
    this.bounds = this.DOM.circle.getBoundingClientRect();
    this.lastMousePos = { x: 0, y: 0 };
    this.scale = 1;
    this.lastScale = 1;
    requestAnimationFrame(() => this.render());
  }
  render() {
    this.lastMousePos.x = MathUtils.lerp(
      this.lastMousePos.x,
      mousepos.x - this.bounds.width / 2,
      0.2
    );
    this.lastMousePos.y = MathUtils.lerp(
      this.lastMousePos.y,
      mousepos.y - this.bounds.height / 2,
      0.2
    );
    this.lastScale = MathUtils.lerp(this.lastScale, this.scale, 0.15);
    this.DOM.circle.style.transform = `translateX(${
      this.lastMousePos.x
    }px) translateY(${this.lastMousePos.y}px) scale(${this.lastScale})`;
    requestAnimationFrame(() => this.render());
  }
  enter() {
    this.scale = 1.9;
  }
  leave() {
    this.scale = 1;
  }
  click() {
    this.lastScale = 0.4;
  }
  showArrows() {
    TweenMax.to(Object.values(this.DOM.arrows), 1, {
      ease: Expo.easeOut,
      startAt: { x: i => (i ? 10 : -10) },
      opacity: 1,
      x: 0
    });
  }
  hideArrows() {
    TweenMax.to(Object.values(this.DOM.arrows), 1, {
      ease: Expo.easeOut,
      x: i => (i ? 10 : -10),
      opacity: 0
    });
  }
}

// Custom mouse cursor
const cursor = new Cursor(document.querySelector(".js-cursor"));

// Activate the enter/leave/click methods of the custom cursor when hovering in/out on every <a> (and the close content ctrl)
const links = document.querySelectorAll(".js-link");

[...links].forEach(link => {
    link.addEventListener("mouseenter", () => cursor.enter());
    link.addEventListener("mouseleave", () => cursor.leave());
});


  