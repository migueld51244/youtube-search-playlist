const statusParagraph = document.querySelector(".status-p");

// Get current tab url
async function getPopupUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url;
}

getPopupUrl().then((url) => {
  if (url) {
    statusParagraph.textContent = "Status: Working! User is on YouTube";
  } else {
    statusParagraph.textContent = "Status: Error! Not on YouTube page";
  }
});
