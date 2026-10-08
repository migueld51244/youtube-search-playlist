const appendArea = document.querySelector(
  'chip-bar-view-model.ytChipBarViewModelHost',
);
console.log(appendArea);
console.log(
  '%c[Minha Extensão] HTML injetado com sucesso!',
  'color: #ff0000; font-weight: bold; font-size: 14px;',
);
console.log('Works?');
console.log('YES!');
console.log('debugs?');

const searchContainer = document.createElement("div");
searchContainer.classList.add("search-playlist-container");
const searchBar = document.createElement("input");
const searchBtn = document.createElement("button")
searchBtn.textContent = "Find Next"
searchContainer.append(searchBar, searchBtn);

const selector = 'chip-bar-view-model.ytChipBarViewModelHost';
let appendArea1;
function useAppendArea() {
  appendArea1 = document.querySelector(selector);
  if (!appendArea1) return false;
  appendArea1.append(searchContainer)

  observer.disconnect();
  console.log(appendArea1);
  // appendArea.append(searchBar);
  return true;
}

const observer = new MutationObserver(useAppendArea);

if (!useAppendArea()) {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}