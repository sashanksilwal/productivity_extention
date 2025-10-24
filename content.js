let paletteVisible = false;
let lastCmdTime = 0;
let selectedText = "";
let currentIndex = -1;

const paletteStyle = `
  #cmdPalette {
    all: unset;
    position: fixed;
    top: 18%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    background: rgba(250, 250, 250, 0.96);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(200,200,200,0.4);
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.12);
    color: #1d1d1f;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
    padding: 18px 20px;
    z-index: 2147483647;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  #cmdInput {
    all: unset;
    width: 100%;
    font-size: 16px;
    font-weight: 500;
    padding: 10px 12px;
    background: #fff;
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
  }
  #cmdInput::placeholder { color: #aaa; }

  #cmdList {
    margin-top: 14px;
    max-height: 440px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .cmdSectionTitle {
    margin: 14px 0 6px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.3px;
    color: #6b5f57;
    border-bottom: 1px solid #eee3d5;
    padding-bottom: 4px;
  }

  .cmdItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: 10px;
    transition: background 0.12s ease;
    cursor: pointer;
  }
  .cmdItem:hover { background: #f8f5f1; }
  .cmdItem.active {
    background: #d4b08f !important;
    color: #fff !important;
  }
  .cmdItem.active strong { color: #fff; }
  .cmdItem.active .cmdDesc { color: #fff8f0; }

  .cmdItem strong {
    font-size: 14px;
    font-weight: 600;
    color: #1d1d1f;
  }
  .cmdDesc {
    font-size: 13px;
    color: #7b6f65;
    margin-top: 3px;
  }
  .cmdTag {
    background: #f4ede4;
    color: #6a594a;
    font-size: 12px;
    border-radius: 6px;
    padding: 2px 6px;
    margin-left: 10px;
  }

  #selectionBanner {
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff9e6;
    color: #5c4a32;
    margin-bottom: 10px;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
  }
`;

document.addEventListener("mouseup", () => {
  const sel = window.getSelection().toString().trim();
  if (sel.length > 0) selectedText = sel;
});

// Double-Cmd trigger (ignores Cmd+C etc.)
document.addEventListener("keydown", (e) => {
  if (e.key === "Meta" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
    const now = Date.now();
    if (now - lastCmdTime < 400) {
      togglePalette();
      e.preventDefault();
    }
    lastCmdTime = now;
  }
});

function togglePalette() {
  if (paletteVisible) return closePalette();
  paletteVisible = true;

  const styleTag = document.createElement("style");
  styleTag.textContent = paletteStyle;
  document.head.appendChild(styleTag);

  const div = document.createElement("div");
  div.id = "cmdPalette";
  div.innerHTML = `
    <input id="cmdInput" placeholder="Type /command or search...">
    <div id="cmdList"></div>
  `;
  document.body.appendChild(div);

  const input = document.getElementById("cmdInput");
  input.focus();
  renderSections();

  // keyboard navigation
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closePalette();
    else if (["ArrowDown", "ArrowUp", "Enter"].includes(ev.key))
      arrowNavHandler(ev);
  });

  // live filtering
  input.addEventListener("input", (ev) => {
    const val = ev.target.value.trim().toLowerCase();
    if (val.startsWith("/")) filterCommands(val);
    else renderSections();
    currentIndex = -1;
  });

  // click outside to close
  document.addEventListener("mousedown", outsideClickHandler);
}

function closePalette() {
  document.getElementById("cmdPalette")?.remove();
  document.removeEventListener("mousedown", outsideClickHandler);
  paletteVisible = false;
  currentIndex = -1;
}

function outsideClickHandler(e) {
  const palette = document.getElementById("cmdPalette");
  if (palette && !palette.contains(e.target)) closePalette();
}

function arrowNavHandler(ev) {
  const items = Array.from(document.querySelectorAll(".cmdItem"));
  if (!items.length) return;

  if (ev.key === "ArrowDown") {
    ev.preventDefault();
    currentIndex = (currentIndex + 1) % items.length;
    highlight(items, currentIndex);
  } else if (ev.key === "ArrowUp") {
    ev.preventDefault();
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    highlight(items, currentIndex);
  } else if (ev.key === "Enter" && currentIndex >= 0) {
    ev.preventDefault();
    items[currentIndex].click();
  }
}

function highlight(items, index) {
  items.forEach((el, i) => {
    el.classList.toggle("active", i === index);
    if (i === index) el.scrollIntoView({ block: "nearest" });
  });
}

const sections = {
  NAVIGATION: {
    "/new": "Create new tab",
    "/back": "Go back",
    "/close": "Close tab",
    "/history": "View browsing history",
    "/find": "Search text on page"
  },
  ORGANIZATION: {
    "/group": "Group tabs by domain",
    "/ungroup": "Ungroup tabs",
    "/arrange": "Arrange tabs by domain",
    "/session": "Save session",
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
    "/gmail": "Compose email",
    "/yt": "Search YouTube",
    "/translate": "Translate text",
    "/task": "Create Google Calendar task",
    "/ai": "Ask AI about selected text"
  }
};

function renderSections() {
  const list = document.getElementById("cmdList");
  list.innerHTML = selectedText
    ? `<div id="selectionBanner">
         <span>✨ Selected ${selectedText.split(/\s+/).length} words</span>
         <span style="font-weight:500;">Ask with /ai</span>
       </div>`
    : "";

  for (const [category, cmds] of Object.entries(sections)) {
    const header = `<div class="cmdSectionTitle">${category}</div>`;
    list.insertAdjacentHTML("beforeend", header);
    for (const [cmd, desc] of Object.entries(cmds)) {
      const el = document.createElement("div");
      el.className = "cmdItem";
      el.innerHTML = `
        <div>
          <strong>${cmd}</strong>
          <div class="cmdDesc">${desc}</div>
        </div>
        <span class="cmdTag">${cmd}</span>`;
      el.addEventListener("click", () =>
        chrome.runtime.sendMessage({
          type: "command",
          command: cmd,
          selectionText: selectedText
        })
      );
      list.appendChild(el);
    }
  }
}

function filterCommands(filter) {
  const list = document.getElementById("cmdList");
  list.innerHTML = "";
  for (const [cat, cmds] of Object.entries(sections)) {
    const matches = Object.entries(cmds).filter(([cmd]) =>
      cmd.toLowerCase().includes(filter)
    );
    if (matches.length) {
      const header = `<div class="cmdSectionTitle">${cat}</div>`;
      list.insertAdjacentHTML("beforeend", header);
      matches.forEach(([cmd, desc]) => {
        const el = document.createElement("div");
        el.className = "cmdItem";
        el.innerHTML = `
          <div>
            <strong>${cmd}</strong>
            <div class="cmdDesc">${desc}</div>
          </div>
          <span class="cmdTag">${cmd}</span>`;
        el.addEventListener("click", () =>
          chrome.runtime.sendMessage({
            type: "command",
            command: cmd,
            selectionText: selectedText
          })
        );
        list.appendChild(el);
      });
    }
  }
  currentIndex = -1;
}

chrome.runtime.onMessage.addListener((msg) => {
  const list = document.getElementById("cmdList");
  if (!list) return;

  if (msg.type === "showAlert")
    list.innerHTML = `<div style="padding:14px;background:#fff4ec;border-radius:10px;text-align:center;color:#5a4638;">${msg.text}</div>`;

  if (msg.type === "showAIResponse")
    list.innerHTML = `<div style="padding:14px;background:#faf9f7;border-radius:10px;white-space:pre-wrap;color:#1f1f1f;line-height:1.5;">${msg.text}</div>`;
});
