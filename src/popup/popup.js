const statusParagraph = document.querySelector(".status-p");
const statusImage = document.querySelector(".status-img");
const statusContainer = document.querySelector(".status");

const statusMap = {
  success: {
    src: "../assets/success-status-icon.svg",
    alt: "a tick icon with a round black border",
    color: "green",
    text: "Status: Working! User is on YouTube",
  },
  error: {
    src: "../assets/error-status-icon.svg",
    alt: "a red icon with a white cross inside",
    color: "red",
    text: "Status: Error! Not on YouTube page",
  },
};

function updateStatus(status) {
  if (!status) return;
  statusContainer.style.borderColor = statusMap[status].color;
  statusParagraph.textContent = statusMap[status].text;
  statusImage.src = statusMap[status].src;
  statusImage.alt = statusMap[status].alt;
}

// Get current tab url
async function getPopupUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url;
}

// Resolve promise and update status
getPopupUrl().then((url) => {
  if (!url) return;
  let status;
  status = url.includes("youtube") ? "success" : "error";
  updateStatus(status);
  console.log("status:", status, "entry:", statusMap[status]);
});
