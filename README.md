# command_bar — Universal Command Palette for Chrome

`command_bar` is a minimalist, keyboard-driven command palette for Chrome.  
It lets you manage tabs, navigate, and trigger AI or productivity actions instantly — all with a simple double press of the `⌘` key.

<p align="center">
  <img src="assets/screenshot.png" width="650"/>
</p>

---

## ✨ Features

### ⚡ Core
- Open anywhere with `⌘⌘`
- Run `/` commands or natural text
- Control tabs, sessions, and system shortcuts
- Invoke integrated services like Gmail, YouTube, and Translate
- Ask AI questions about selected text

### 🧩 Available Commands

| Command | Description |
|----------|--------------|
| `/new` | Open new tab |
| `/close` | Close current tab |
| `/group` | Group tabs by domain (named by domain) |
| `/ungroup` | Ungroup all tabs |
| `/arrange` | Arrange tabs by domain |
| `/session` | Save current session |
| `/sessions` | View all saved sessions |
| `/session_restore [n]` | Restore session *n* or latest |
| `/session_clear` | Delete all saved sessions |
| `/yt query` | Search YouTube in the same tab |
| `/translate text` | Translate selected text |
| `/ai` | Ask AI about highlighted content |

### 🖥️ Keyboard Shortcuts

| Key | Action |
|------|---------|
| `⌘⌘` | Open or close command bar |
| `↑ / ↓` | Navigate command list |
| `Enter` | Execute selected command |
| `Esc` or click outside | Close palette |

---

## 🧰 Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/sashanksilwal/command_bar.git
   cd command_bar
    ```

2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" (toggle in the top right).
4. Click "Load unpacked" and select the cloned repository folder.
5. The extension should now appear in your extensions list.
6. Pin the extension to the toolbar for easy access.
7. Press `⌘⌘` to open the command bar and start using it!
---

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details for more information.

