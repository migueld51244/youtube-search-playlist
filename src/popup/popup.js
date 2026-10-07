const statusParagraph = document.querySelector(".status-p");
const statusImage = document.querySelector(".status-img");

const statusIconsPaths = {
  success: "../assets/success-status-icon.svg",
  error: "../assets/error-status-icon.svg",
};

// Get current tab url
async function getPopupUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url;
}

getPopupUrl().then((url) => {
  if (url && url.includes("youtube")) {
    statusParagraph.textContent = "Status: Working! User is on YouTube";
    statusImage.src = statusIconsPaths.success;
  } else {
    statusParagraph.textContent = "Status: Error! Not on YouTube page";
    statusImage.src = statusIconsPaths.error;
  }
});

/* Add alt text to object and add helper function to handle status */
