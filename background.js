chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "command") handleCommand(msg.command.trim(), sender);
  else if (msg.type === "initPalette") sendDefaultContext(sender);
});

async function handleCommand(cmd, sender) {
  const sendToActive = (payload) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length) chrome.tabs.sendMessage(tabs[0].id, payload).catch(() => {});
    });
  };

  const [base, ...rest] = cmd.split(" ");
  const arg = rest.join(" ").trim();

  switch (base) {
    // --- NAVIGATION ---
    case "/new":
      chrome.tabs.create({});
      break;

    case "/close":
      if (arg === "all") {
        chrome.tabs.query({}, (tabs) => chrome.tabs.remove(tabs.map((t) => t.id)));
      } else chrome.tabs.remove(sender.tab.id);
      break;

    case "/back":
      chrome.tabs.goBack(sender.tab.id);
      break;

    case "/history":
      chrome.tabs.create({ url: "chrome://history" });
      break;

    case "/find":
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: () => {
          const input = prompt("Find text across this page:");
          if (input) window.find(input);
        }
      });
      break;

    // --- ORGANIZATION ---
    case "/group":
    case "/arrange":
      chrome.tabs.query({}, async (tabs) => {
        const domainGroups = {};
        for (const tab of tabs) {
          try {
            const domain = new URL(tab.url).hostname.replace(/^www\./, "");
            if (!domainGroups[domain]) domainGroups[domain] = [];
            domainGroups[domain].push(tab.id);
          } catch (_) {}
        }

        for (const [domain, ids] of Object.entries(domainGroups)) {
          const groupId = await chrome.tabs.group({ tabIds: ids });
          await chrome.tabGroups.update(groupId, { title: domain });
        }

        sendToActive({ type: "showAlert", text: "Grouped tabs by domain name." });
      });
      break;


    case "/ungroup":
      chrome.tabs.query({}, async (tabs) => {
        await chrome.tabs.ungroup(tabs.map((t) => t.id));
        sendToActive({ type: "showAlert", text: "Ungrouped all tabs." });
      });
      break;

    case "/session":
      chrome.tabs.query({}, (tabs) => {
        const newSession = { ts: Date.now(), tabs: tabs.map((t) => ({ title: t.title, url: t.url })) };
        chrome.storage.local.get({ savedSessions: [] }, (data) => {
          const updated = [...data.savedSessions, newSession];
          chrome.storage.local.set({ savedSessions: updated }, () =>
            sendToActive({ type: "showAlert", text: `Session #${updated.length} saved.` })
          );
        });
      });
      break;

    case "/session_restore":
      const index = parseInt(arg || "0");
      chrome.storage.local.get("savedSessions", (data) => {
        const sessions = data.savedSessions || [];
        if (!sessions.length) {
          sendToActive({ type: "showAlert", text: "No saved sessions found." });
          return;
        }
        const session =
          index && sessions[index - 1] ? sessions[index - 1] : sessions[sessions.length - 1];
        session.tabs.forEach((t) => chrome.tabs.create({ url: t.url }));
        sendToActive({
          type: "showAlert",
          text: `Restored session #${index || sessions.length}.`
        });
      });
      break;

    case "/sessions":
      chrome.storage.local.get("savedSessions", (data) => {
        const sessions = data.savedSessions || [];
        if (!sessions.length) {
          sendToActive({ type: "showAlert", text: "No saved sessions found." });
          return;
        }

        // Display session titles + domain counts
        const sessionInfo = sessions
          .map(
            (s, i) =>
              `#${i + 1} (${s.tabs.length} tabs) — ${new URL(
                s.tabs[0].url
              ).hostname}`
          )
          .join("\n");
        sendToActive({
          type: "showAIResponse",
          text: `Saved Sessions:\n\n${sessionInfo}\n\nUse /session_restore <number> to restore one.`
        });
      });
      break;

    case "/session_clear":
      chrome.storage.local.remove("savedSessions", () => {
        sendToActive({ type: "showAlert", text: "All saved sessions deleted." });
      });
      break;




    // --- SYSTEM ---
    case "/mute":
      chrome.tabs.query({ audible: true }, (tabs) => {
        tabs.forEach((t) => chrome.tabs.update(t.id, { muted: true }));
        sendToActive({ type: "showAlert", text: "Muted all audible tabs." });
      });
      break;

    case "/unmute":
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((t) => chrome.tabs.update(t.id, { muted: false }));
        sendToActive({ type: "showAlert", text: "Unmuted all tabs." });
      });
      break;

    case "/note":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const { title, url } = tabs[0];
        chrome.storage.local.get({ notes: [] }, (data) => {
          const updated = [...data.notes, { title, url, ts: Date.now() }];
          chrome.storage.local.set({ notes: updated }, () =>
            sendToActive({ type: "showAlert", text: `Saved note: ${title}` })
          );
        });
      });
      break;

    case "/recall":
      chrome.storage.local.get({ notes: [] }, (data) =>
        sendToActive({ type: "showNotes", notes: data.notes })
      );
      break;

    case "/exit":
      sendToActive({ type: "closePalette" });
      break;

    // --- SERVICES ---
    case "/gmail":
      chrome.tabs.create({
        url: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(arg)}`
      });
      break;

    case "/yt":
    chrome.tabs.update(sender.tab.id, {
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(arg)}`
    });
    break;


    case "/translate":
      chrome.tabs.create({
        url: `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(arg)}`
      });
      break;

    case "/task":
      chrome.tabs.create({
        url: `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(arg)}`
      });
      break;

    // --- AI ---
    case "/ai":
      const selection = msg.selectionText || arg;
      if (!selection) {
        sendToActive({ type: "showAlert", text: "No text selected to analyze." });
        break;
      }
      try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Explain this clearly:\n${selection}` }] }]
            })
          }
        );
        const data = await response.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "No AI response.";
        sendToActive({ type: "showAIResponse", text });
      } catch (e) {
        sendToActive({ type: "showAlert", text: "AI error: " + e.message });
      }
      break;

    default:
      console.log("Unknown command:", cmd);
  }
}

function sendDefaultContext(sender) {
  Promise.all([
    new Promise((res) => chrome.tabs.query({}, res)),
    chrome.sessions.getRecentlyClosed()
  ]).then(([openTabs, recentlyClosed]) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length)
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "showDefaultContext",
          openTabs,
          recentlyClosed
        });
    });
  });
}
