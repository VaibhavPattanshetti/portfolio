// ===== Ask Me: floating launcher + draggable & resizable chat window =====
(function () {
  // Smart Backend API resolver with automatic endpoint failover
  const getPrimaryApiUrl = () => {
    if (typeof window.ASKME_API_URL === "string") return window.ASKME_API_URL;
    // On Live Server (port 5500) or file://, default to local Python FastAPI (port 8000)
    if (window.location.protocol === "file:" || window.location.port === "5500") {
      return "http://127.0.0.1:8000";
    }
    // On dev-server (port 3000) or Netlify in production, use same-origin relative path
    return "";
  };

  const SPARKLE = `<svg viewBox="0 0 36 36" aria-hidden="true"><path fill="currentColor" d="M14 4C15 12 16 14 24 18C16 22 15 24 14 32C13 24 12 22 4 18C12 14 13 12 14 4Z"/><path fill="currentColor" d="M27 2C27.5 6 28 6.5 32 8C28 9.5 27.5 10 27 14C26.5 10 26 9.5 22 8C26 6.5 26.5 6 27 2Z"/></svg>`;
  const SEND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4 18-7z"/></svg>`;
  const SUGGESTIONS = [
    "Tell me about yourself",
    "What projects have you built?",
    "Why should we hire you?",
    "What is your tech stack?",
    "Do you have any internship experience?",
    "Are you open to relocation & full-time roles?"
  ];

  // In-memory conversation history
  const chatHistory = [];

  const launcher = document.createElement("button");
  launcher.className = "askme-launcher";
  launcher.setAttribute("aria-label", "Open Ask Me chat");
  launcher.innerHTML = SPARKLE.replace("currentColor", "#0a84ff").replace("currentColor", "#0a84ff") + "<span>Ask Me</span>";

  const win = document.createElement("section");
  win.className = "askme-window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "Ask Me chat");
  win.innerHTML = `
    <!-- Interactive Resize Handles -->
    <div class="askme-resize-handle askme-resize-nw" data-direction="nw" title="Drag to resize"></div>
    <div class="askme-resize-handle askme-resize-n" data-direction="n"></div>
    <div class="askme-resize-handle askme-resize-w" data-direction="w"></div>
    <div class="askme-resize-handle askme-resize-se" data-direction="se" title="Drag to resize"></div>
    <div class="askme-resize-handle askme-resize-s" data-direction="s"></div>
    <div class="askme-resize-handle askme-resize-e" data-direction="e"></div>

    <div class="askme-titlebar">
      <div class="askme-dots">
        <button class="r" aria-label="Close" title="Close"></button>
        <button class="y" aria-label="Minimize" title="Minimize"></button>
        <button class="g" aria-label="Toggle size" title="Expand / Reset size"></button>
      </div>
      <div class="askme-title">${SPARKLE}<span>Ask Me</span></div>
    </div>
    <div class="askme-body">
      <div class="askme-greeting">👋 Hi! I'm Vaibhav's AI assistant. Ask me anything about his projects, skills, or experience!</div>
      <div class="askme-chips"></div>
    </div>
    <div class="askme-inputbar">
      <div class="askme-inputwrap">
        <input type="text" placeholder="Ask about Vaibhav's projects, skills..." aria-label="Type a message" maxlength="500">
        <button class="askme-send" aria-label="Send">${SEND}</button>
      </div>
    </div>`;
  document.body.append(launcher, win);

  const $ = (s) => win.querySelector(s);
  const body = $(".askme-body"),
    chips = $(".askme-chips"),
    input = $("input"),
    sendBtn = $(".askme-send"),
    bar = $(".askme-titlebar");

  let moved = false;
  let isGenerating = false;

  // Window sizing limits
  const MIN_W = 320;
  const MIN_H = 380;
  const getMaxW = () => Math.min(850, window.innerWidth - 24);
  const getMaxH = () => Math.min(850, window.innerHeight - 24);

  SUGGESTIONS.forEach((t) => {
    const b = document.createElement("button");
    b.className = "askme-chip";
    b.textContent = "• " + t;
    b.addEventListener("click", () => send(t));
    chips.appendChild(b);
  });

  // Safe and clean markdown parser for crisp display
  function renderMarkdown(text) {
    if (!text) return "";

    // Normalize stray <br> or <br/> tags to newlines
    let clean = text.replace(/<br\s*\/?>/gi, "\n");

    // Escape HTML tags for security
    let html = clean
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Markdown links [text](url) - supports https, http, mailto, and relative paths
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Auto-link any bare URLs (https:// or http://) that aren't already in an <a> tag
    html = html.replace(
      /(^|[^"'>])(https?:\/\/[^\s<]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>'
    );

    // Auto-link email addresses
    html = html.replace(
      /(^|[^"'>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '$1<a href="mailto:$2">$2</a>'
    );

    // Process lines for lists, tables, and paragraphs
    const rawLines = html.split("\n");
    let inList = false;
    const out = [];

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i].trim();
      if (!line) {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        continue;
      }

      // Skip markdown table border/separator lines like |---|---|
      if (/^\|[-:\s|]+\|$/.test(line)) continue;

      // Cleanly format table rows | Col1 | Col2 | into readable text
      if (line.startsWith("|") && line.endsWith("|")) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        line = cells.join(" • ");
      }

      // Bullet lists
      const listMatch = line.match(/^[-*•]\s+(.+)/);
      if (listMatch) {
        if (!inList) {
          out.push("<ul>");
          inList = true;
        }
        out.push(`<li>${listMatch[1]}</li>`);
      } else {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        out.push(`<p>${line}</p>`);
      }
    }
    if (inList) out.push("</ul>");
    return out.join("");
  }

  function addMessage(content, who, isHtml = false) {
    const m = document.createElement("div");
    m.className = "askme-msg " + who;
    if (isHtml) {
      m.innerHTML = content;
    } else {
      m.textContent = content;
    }
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
    return m;
  }

  function setInputState(disabled) {
    isGenerating = disabled;
    input.disabled = disabled;
    sendBtn.disabled = disabled;
    if (!disabled) {
      setTimeout(() => input.focus({ preventScroll: true }), 100);
    }
  }

  async function streamResponse(userText) {
    setInputState(true);

    // Create bot bubble with typing animation
    const botMsg = addMessage(
      `<span class="askme-typing"><span></span><span></span><span></span></span>`,
      "bot",
      true
    );

    let accumulatedText = "";
    let hasReceivedToken = false;

    try {
      const isHttps = window.location.protocol === "https:";
      const primary = getPrimaryApiUrl();
      const endpoints = [];
      if (primary) {
        endpoints.push(`${primary}/api/chat`);
      }
      endpoints.push("/api/chat");
      endpoints.push("/.netlify/functions/chat");
      if (!isHttps) {
        endpoints.push("http://127.0.0.1:8000/api/chat");
      }

      let response = null;
      let lastErr = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: chatHistory }),
          });
          response = res;
          if (res.ok) {
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!response) {
        throw lastErr || new Error("Failed to connect to chatbot server");
      }

      if (!response.ok) {
        let errDetail = "";
        try {
          const errJson = await response.json();
          errDetail = errJson.detail || errJson.error || JSON.stringify(errJson);
        } catch (_) {
          errDetail = `HTTP ${response.status} ${response.statusText}`;
        }
        throw new Error(errDetail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep incomplete chunk in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              if (!hasReceivedToken) {
                hasReceivedToken = true;
                botMsg.innerHTML = "";
              }
              accumulatedText += parsed.token;
              botMsg.innerHTML = renderMarkdown(accumulatedText);
              body.scrollTop = body.scrollHeight;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (dataStr && dataStr !== "[DONE]") {
              accumulatedText += dataStr;
              botMsg.innerHTML = renderMarkdown(accumulatedText);
              body.scrollTop = body.scrollHeight;
            }
          }
        }
      }

      if (!hasReceivedToken && !accumulatedText) {
        botMsg.innerHTML = "<p>No response received. Please check backend configuration.</p>";
      } else {
        chatHistory.push({ role: "assistant", content: accumulatedText });
      }
    } catch (err) {
      console.error("AskMe Error:", err);
      const msg = err && err.message ? err.message : "Unable to reach backend server";
      const localHint = window.location.protocol !== "https:" ? " If running locally, run <code>node dev-server.js</code>." : "";
      botMsg.innerHTML = `<p>⚠️ <strong>Assistant Notice:</strong> ${msg}</p><p style="font-size:12px;opacity:0.85;">${localHint} You can also contact Vaibhav directly at <a href="mailto:vaibhavpattanshetti123@gmail.com">vaibhavpattanshetti123@gmail.com</a>.</p>`;
    } finally {
      setInputState(false);
      body.scrollTop = body.scrollHeight;
    }
  }

  async function send(text) {
    if (isGenerating) return;
    text = (text || "").trim();
    if (!text) return;

    if (chips && chips.parentNode) {
      chips.remove();
    }

    addMessage(text, "user");
    chatHistory.push({ role: "user", content: text });
    input.value = "";

    if (typeof AskMe.onSend === "function") {
      try {
        await AskMe.onSend(text);
      } catch (e) {
        console.error(e);
      }
    } else {
      await streamResponse(text);
    }
  }

  window.AskMe = {
    onSend: null,
    addBotMessage: (t) => addMessage(t, "bot"),
    getHistory: () => chatHistory,
    setApiUrl: (url) => { window.ASKME_API_URL = url; }
  };

  function getDefaultPosition() {
    const w = win.offsetWidth || 400;
    const h = win.offsetHeight || 530;
    const article = document.querySelector("article.active") || document.querySelector(".main-content") || document.querySelector("article");

    let targetLeft, targetTop;
    if (window.innerWidth >= 1024 && article) {
      const aRect = article.getBoundingClientRect();
      targetLeft = Math.round(aRect.left + (aRect.width - w) / 2);
      targetTop = 88;
    } else if (window.innerWidth >= 768) {
      targetLeft = Math.round(window.innerWidth * 0.41);
      targetTop = 88;
    } else {
      targetLeft = Math.round((window.innerWidth - w) / 2);
      targetTop = Math.max(16, Math.min(88, Math.round((window.innerHeight - h) / 3)));
    }

    const maxLeft = Math.max(10, window.innerWidth - w - 10);
    const maxTop = Math.max(10, window.innerHeight - h - 10);
    return {
      left: Math.min(Math.max(10, targetLeft), maxLeft),
      top: Math.min(Math.max(10, targetTop), maxTop)
    };
  }

  function resetToDefaultPosition() {
    const pos = getDefaultPosition();
    win.style.left = pos.left + "px";
    win.style.top = pos.top + "px";
    moved = false;
  }

  function clamp() {
    const x = Math.min(Math.max(0, win.offsetLeft), Math.max(0, innerWidth - win.offsetWidth));
    const y = Math.min(Math.max(0, win.offsetTop), Math.max(0, innerHeight - 46));
    win.style.left = x + "px";
    win.style.top = y + "px";
  }

  function clampLauncher() {
    if (launcher.style.left && launcher.style.left !== "auto") {
      const maxLeft = Math.max(10, window.innerWidth - launcher.offsetWidth - 10);
      const maxTop = Math.max(10, window.innerHeight - launcher.offsetHeight - 10);
      const curLeft = parseFloat(launcher.style.left) || 0;
      const curTop = parseFloat(launcher.style.top) || 0;
      launcher.style.left = Math.min(Math.max(10, curLeft), maxLeft) + "px";
      launcher.style.top = Math.min(Math.max(10, curTop), maxTop) + "px";
    }
  }

  let isAnimating = false;
  let currentAnim = null;

  const open = () => {
    if (win.classList.contains("open") || isAnimating) return;
    isAnimating = true;

    // Reset to user's desired default position every time
    resetToDefaultPosition();

    // Make visible in DOM for accurate measurements
    win.classList.add("open");

    const lRect = launcher.getBoundingClientRect();
    const wRect = win.getBoundingClientRect();

    // Origin: bottom-right launcher / taskbar point
    const originX = lRect.right - (lRect.width * 0.2);
    const originY = lRect.bottom - (lRect.height * 0.2);
    const dx = Math.round(originX - wRect.right);
    const dy = Math.round(originY - wRect.bottom);

    win.style.transformOrigin = "bottom right";

    if (typeof win.animate === "function") {
      if (currentAnim) {
        try { currentAnim.cancel(); } catch (_) {}
      }

      currentAnim = win.animate(
        [
          {
            opacity: 0,
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.04, 0.02) skewX(-14deg)`,
            transformOrigin: "bottom right"
          },
          {
            opacity: 0.95,
            transform: `translate3d(${Math.round(dx * 0.52)}px, ${Math.round(dy * 0.38)}px, 0) scale(0.42, 0.62) skewX(-7deg)`,
            transformOrigin: "bottom right",
            offset: 0.36
          },
          {
            opacity: 1,
            transform: `translate3d(${Math.round(dx * 0.14)}px, ${Math.round(dy * 0.08)}px, 0) scale(0.88, 0.94) skewX(-1.5deg)`,
            transformOrigin: "bottom right",
            offset: 0.72
          },
          {
            opacity: 1,
            transform: `translate3d(${Math.round(dx * 0.02)}px, ${Math.round(dy * 0.01)}px, 0) scale(1.012, 1.008) skewX(0.4deg)`,
            transformOrigin: "bottom right",
            offset: 0.88
          },
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1, 1) skewX(0deg)",
            transformOrigin: "bottom right"
          }
        ],
        {
          duration: 560,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        }
      );

      currentAnim.onfinish = () => {
        try { currentAnim.cancel(); } catch (_) {}
        currentAnim = null;
        isAnimating = false;
        input.focus({ preventScroll: true });
      };
    } else {
      isAnimating = false;
      input.focus({ preventScroll: true });
    }
  };

  const close = () => {
    if (!win.classList.contains("open") || isAnimating) return;
    isAnimating = true;

    const lRect = launcher.getBoundingClientRect();
    const wRect = win.getBoundingClientRect();

    const originX = lRect.right - (lRect.width * 0.2);
    const originY = lRect.bottom - (lRect.height * 0.2);
    const dx = Math.round(originX - wRect.right);
    const dy = Math.round(originY - wRect.bottom);

    win.style.transformOrigin = "bottom right";

    if (typeof win.animate === "function") {
      if (currentAnim) {
        try { currentAnim.cancel(); } catch (_) {}
      }

      currentAnim = win.animate(
        [
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1, 1) skewX(0deg)",
            transformOrigin: "bottom right"
          },
          {
            opacity: 0.95,
            transform: `translate3d(${Math.round(dx * 0.12)}px, ${Math.round(dy * 0.08)}px, 0) scale(0.85, 0.88) skewX(-1.5deg)`,
            transformOrigin: "bottom right",
            offset: 0.25
          },
          {
            opacity: 0.7,
            transform: `translate3d(${Math.round(dx * 0.52)}px, ${Math.round(dy * 0.38)}px, 0) scale(0.38, 0.52) skewX(-7deg)`,
            transformOrigin: "bottom right",
            offset: 0.65
          },
          {
            opacity: 0,
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.04, 0.02) skewX(-14deg)`,
            transformOrigin: "bottom right"
          }
        ],
        {
          duration: 460,
          easing: "cubic-bezier(0.32, 0, 0.67, 1)",
          fill: "forwards"
        }
      );

      currentAnim.onfinish = () => {
        try { currentAnim.cancel(); } catch (_) {}
        currentAnim = null;
        win.classList.remove("open");
        isAnimating = false;
      };
    } else {
      win.classList.remove("open");
      isAnimating = false;
    }
  };

  // ===== Draggable Launcher Button with Immediate 1:1 Movement =====
  let lDrag = false, lMoved = false, lsx = 0, lsy = 0, lox = 0, loy = 0;

  launcher.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    lDrag = true;
    lMoved = false;
    launcher.classList.add("dragging");
    launcher.setPointerCapture(e.pointerId);
    lsx = e.clientX;
    lsy = e.clientY;
    const rect = launcher.getBoundingClientRect();
    lox = rect.left;
    loy = rect.top;
  });

  launcher.addEventListener("pointermove", (e) => {
    if (!lDrag) return;
    const dx = e.clientX - lsx;
    const dy = e.clientY - lsy;
    if (!lMoved && Math.hypot(dx, dy) < 4) return;
    lMoved = true;

    const maxLeft = Math.max(10, window.innerWidth - launcher.offsetWidth - 10);
    const maxTop = Math.max(10, window.innerHeight - launcher.offsetHeight - 10);
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
    launcher.style.left = Math.min(Math.max(10, lox + dx), maxLeft) + "px";
    launcher.style.top = Math.min(Math.max(10, loy + dy), maxTop) + "px";
  });

  const stopLauncherDrag = (e) => {
    if (!lDrag) return;
    lDrag = false;
    launcher.classList.remove("dragging");
    try {
      launcher.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  launcher.addEventListener("pointerup", (e) => {
    const wasMoved = lMoved;
    stopLauncherDrag(e);
    if (!wasMoved) {
      if (win.classList.contains("open")) {
        close();
      } else {
        open();
      }
    }
  });
  launcher.addEventListener("pointercancel", stopLauncherDrag);

  $(".r").addEventListener("click", close);
  $(".y").addEventListener("click", close);
  $(".g").addEventListener("click", () => {
    win.classList.toggle("large");
    setTimeout(clamp, 50);
  });

  sendBtn.addEventListener("click", () => send(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send(input.value);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  addEventListener("resize", () => {
    if (win.classList.contains("open")) clamp();
    clampLauncher();
  });

  // ===== Interactive Resizing with Bounds Checking =====
  let resizing = false,
    startW = 0,
    startH = 0,
    startX = 0,
    startY = 0,
    startLeft = 0,
    startTop = 0,
    resizeDir = "";

  win.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".askme-resize-handle");
    if (!handle) return;
    resizing = true;
    resizeDir = handle.dataset.direction;
    startX = e.clientX;
    startY = e.clientY;
    startW = win.offsetWidth;
    startH = win.offsetHeight;
    startLeft = win.offsetLeft;
    startTop = win.offsetTop;
    win.classList.add("resizing");
    handle.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });

  win.addEventListener("pointermove", (e) => {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const maxW = getMaxW();
    const maxH = getMaxH();

    let newW = startW;
    let newH = startH;
    let newL = startLeft;
    let newT = startTop;

    // Horizontal resize
    if (resizeDir.includes("w")) {
      newW = Math.max(MIN_W, Math.min(maxW, startW - dx));
      newL = startLeft + (startW - newW);
    } else if (resizeDir.includes("e")) {
      newW = Math.max(MIN_W, Math.min(maxW, startW + dx));
    }

    // Vertical resize
    if (resizeDir.includes("n")) {
      newH = Math.max(MIN_H, Math.min(maxH, startH - dy));
      newT = startTop + (startH - newH);
    } else if (resizeDir.includes("s")) {
      newH = Math.max(MIN_H, Math.min(maxH, startH + dy));
    }

    win.style.width = newW + "px";
    win.style.height = newH + "px";
    win.style.left = Math.max(0, newL) + "px";
    win.style.top = Math.max(0, newT) + "px";
    moved = true;
  });

  const stopResize = () => {
    if (!resizing) return;
    resizing = false;
    win.classList.remove("resizing");
    clamp();
  };
  win.addEventListener("pointerup", stopResize);
  win.addEventListener("pointercancel", stopResize);

  // ===== Titlebar Dragging with Immediate 1:1 Movement =====
  let sx, sy, ox, oy, dragging = false;

  bar.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".askme-dots") || e.target.closest(".askme-resize-handle")) return;
    dragging = true;
    moved = true;
    win.classList.add("dragging");
    bar.classList.add("dragging");
    bar.setPointerCapture(e.pointerId);
    sx = e.clientX;
    sy = e.clientY;
    ox = win.offsetLeft;
    oy = win.offsetTop;
  });

  bar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const maxLeft = Math.max(0, window.innerWidth - win.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - 46);
    win.style.left = Math.min(Math.max(0, ox + e.clientX - sx), maxLeft) + "px";
    win.style.top = Math.min(Math.max(0, oy + e.clientY - sy), maxTop) + "px";
  });

  const stopDrag = () => {
    if (!dragging) return;
    dragging = false;
    win.classList.remove("dragging");
    bar.classList.remove("dragging");
  };
  bar.addEventListener("pointerup", stopDrag);
  bar.addEventListener("pointercancel", stopDrag);
})();
