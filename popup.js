document.addEventListener("DOMContentLoaded", async () => {
  // UI elements
  const input = document.getElementById("commandInput");
  const list = document.getElementById("commandList");
  const banner = document.getElementById("selectedTextBanner");
  const settingsBtn = document.getElementById("settingsBtn");
  const notifyBox = document.querySelector(".notify-box");
  const activeSpan = document.getElementById("activeTime");
  const workSpan = document.getElementById("workTime");
  const socialSpan = document.getElementById("socialTime");

  // --- NAVIGATION to Settings Page ---
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // --- OPEN planner (mock notification action) ---
  if (notifyBox) {
    notifyBox.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://calendar.google.com" });
    });
  }

  // --- Load stored metrics (simulated for now) ---
  chrome.storage.local.get(["activeTime", "workTime", "socialTime"], (data) => {
    activeSpan.textContent = data.activeTime || "2m";
    workSpan.textContent = data.workTime || "2m";
    socialSpan.textContent = data.socialTime || "0m";
  });

  // --- Display selected text from last active tab ---
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const selectedText = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim()
    });
    const text = selectedText?.[0]?.result || "";

    if (text.length > 0) {
      banner.classList.remove("hidden");
      banner.innerHTML = `
        <span>✨ Selected ${text.split(/\s+/).length} words</span>
        <span style="font-weight:500;">Ask with /ai</span>`;
    }

    // --- Command sections ---
    const sections = {
      NAVIGATION: {
        "/new": "Create new tab",
        "/back": "Go back",
        "/close": "Close tab",
        "/history": "Open browsing history",
        "/find": "Search text on page"
      },
      ORGANIZATION: {
        "/group": "Group tabs by domain",
        "/ungroup": "Ungroup tabs",
        "/arrange": "Arrange tabs by domain",
        "/session": "Save current session",
        "/session_restore": "Restore previous session"
      },
      SYSTEM: {
        "/note": "Save current site",
        "/recall": "Recall saved notes",
        "/mute": "Mute audible tabs",
        "/unmute": "Unmute all tabs",
        "/exit": "Close palette"
      },
      SERVICES: {
        "/gmail": "Open Gmail compose",
        "/yt": "Search YouTube",
        "/translate": "Translate text",
        "/task": "Create Google Calendar task",
        "/ai": "Ask AI about selected text"
      }
    };

    renderCommands(sections, text);

    // --- Filter commands on input ---
    if (input) {
      input.addEventListener("input", (ev) => {
        const val = ev.target.value.trim().toLowerCase();
        if (val.startsWith("/")) filterCommands(val, sections, text);
        else renderCommands(sections, text);
      });
    }

  } catch (e) {
    console.warn("Unable to access selection:", e);
  }

  // --- Render Commands ---
  function renderCommands(sections, text) {
    if (!list) return;
    list.innerHTML = "";

    for (const [category, cmds] of Object.entries(sections)) {
      const title = document.createElement("div");
      title.className = "sectionTitle";
      title.textContent = category;
      list.appendChild(title);

      for (const [cmd, desc] of Object.entries(cmds)) {
        const item = document.createElement("div");
        item.className = "commandItem";
        item.innerHTML = `
          <div>
            <strong>${cmd}</strong>
            <div class="commandDesc">${desc}</div>
          </div>
          <span class="commandTag">${cmd}</span>`;

        item.addEventListener("click", () => {
          chrome.runtime.sendMessage({
            type: "command",
            command: cmd,
            selectionText: text
          });
        });

        list.appendChild(item);
      }
    }
  }

  // --- Filter Commands ---
  function filterCommands(filter, sections, text) {
    list.innerHTML = "";
    for (const [cat, cmds] of Object.entries(sections)) {
      const matches = Object.entries(cmds).filter(([cmd]) =>
        cmd.toLowerCase().includes(filter)
      );
      if (matches.length) {
        const header = document.createElement("div");
        header.className = "sectionTitle";
        header.textContent = cat;
        list.appendChild(header);

        matches.forEach(([cmd, desc]) => {
          const el = document.createElement("div");
          el.className = "commandItem";
          el.innerHTML = `
            <div>
              <strong>${cmd}</strong>
              <div class="commandDesc">${desc}</div>
            </div>
            <span class="commandTag">${cmd}</span>`;

          el.addEventListener("click", () =>
            chrome.runtime.sendMessage({
              type: "command",
              command: cmd,
              selectionText: text
            })
          );
          list.appendChild(el);
        });
      }
    }
  }
});
