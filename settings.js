document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");

  chrome.storage.local.get(
    ["showCmdBar", "defaultMode", "navbarPos", "navbarColor"],
    (data) => {
      document.getElementById("showCmdBar").checked = data.showCmdBar ?? false;
      document.getElementById("defaultMode").value = data.defaultMode || "tab";
      document.getElementById("navbarPos").value = data.navbarPos || "left";
      document.getElementById("navbarColor").value = data.navbarColor || "#e1c8a7";
    }
  );

  backBtn.addEventListener("click", () => window.close());

  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("change", () => {
      chrome.storage.local.set({
        showCmdBar: document.getElementById("showCmdBar").checked,
        defaultMode: document.getElementById("defaultMode").value,
        navbarPos: document.getElementById("navbarPos").value,
        navbarColor: document.getElementById("navbarColor").value
      });
    });
  });
});
