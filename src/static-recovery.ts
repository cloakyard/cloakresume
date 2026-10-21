// Useful without scripts; enhancement only shows the requested address as plain text.
const path = document.getElementById("requested-path");
if (path) {
  path.textContent = `Requested address: ${window.location.pathname}${window.location.search}`;
  path.hidden = false;
}
