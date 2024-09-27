document.addEventListener("DOMContentLoaded", () => {
  // Load header
  fetch("/includes/header.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("header").innerHTML = data;

      // Now that the header is loaded, add the event listener for dark mode toggle
      const darkModeToggle = document.getElementById("dark-mode-toggle");
      if (darkModeToggle) {
        darkModeToggle.addEventListener("click", toggleDarkMode);
      }
    });

  // Load footer
  fetch("/includes/footer.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("footer").innerHTML = data;
    });

  // Load the dark mode preference from localStorage and apply it
  if (localStorage.getItem("dark-mode") === "true") {
    document.body.classList.add("dark-mode");
  }
});

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  // Save preference
  localStorage.setItem(
    "dark-mode",
    document.body.classList.contains("dark-mode"),
  );
  // Dispatch an event to notify other scripts
  document.dispatchEvent(new Event("themeChanged"));
}

document
  .getElementById("dark-mode-toggle")
  .addEventListener("click", toggleDarkMode);

// Load preference on page load
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("dark-mode") === "true") {
    document.body.classList.add("dark-mode");
  }
  // Fetch CSS colors after setting dark mode
  document.dispatchEvent(new Event("themeChanged"));
});
