/**
 * 치지직 채팅 OBS 오버레이
 */
(function (global) {
  function channelId() {
    return ChzzkConfig.getChannelId();
  }
  const chzzkFetch = ChzzkConfig.chzzkFetch;
  const CUSTOM_CHAT_SETTINGS_KEY = "rabbibot_custom_chat_settings_v1";
  const CHAT_SESSION_KEY = "rabbibot_custom_chat_history_v1";
  const MAX_HISTORY_DEFAULT = 20;

  var MAX_HISTORY = MAX_HISTORY_DEFAULT;
  var chatHistory = [];
  var isFileProtocol = location.protocol === "file:";
  var showUi = /(?:^|[?&])ui=1(?:&|$)/.test(location.search);
  var previewOnly = /(?:^|[?&])preview=1(?:&|$)/.test(location.search);
  var hideCommands = true;
  var hideUrlStart = true;
  var hideStreamer = true;
  var nickColors = false;
  var nickLayout = "inline";
  var showNickname = true;
  var noAnim = false;
  var activeSettings = null;
  var activeThemeKey = "pastel";

  function getMessagesStack(container) {
    if (!container) return null;
    var child = container.firstElementChild;
    while (child) {
      if (child.classList.contains("chat-messages-stack")) return child;
      child = child.nextElementSibling;
    }
    return null;
  }

  function ensureMessagesStack(container) {
    if (!container) return null;
    var stack = getMessagesStack(container);
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "chat-messages-stack";
      stack.id = "chat_messages_stack";
      container.appendChild(stack);
    }
    var child = container.firstElementChild;
    while (child) {
      var next = child.nextElementSibling;
      if (child.classList.contains("chat-item-shell")) stack.appendChild(child);
      child = next;
    }
    return stack;
  }

  function getChatShells(container) {
    var stack = getMessagesStack(container);
    var parent = stack || container;
    if (!parent) return [];
    var out = [];
    var child = parent.firstElementChild;
    while (child) {
      if (child.classList.contains("chat-item-shell")) out.push(child);
      child = child.nextElementSibling;
    }
    return out;
  }

  function clearChatShells(container) {
    var shells = getChatShells(container);
    for (var i = 0; i < shells.length; i++) shells[i].remove();
  }

  function trimChatShells(container) {
    var shells = getChatShells(container);
    while (shells.length > MAX_HISTORY) {
      shells[0].remove();
      shells = getChatShells(container);
    }
  }

  function refreshBoardChrome() {
    if (activeSettings) applyChatItemBgPanel(activeSettings, activeThemeKey);
  }

  if (showUi) document.body.classList.add("show-ui");
  document.documentElement.classList.add("obs");
  document.body.classList.add("obs");

  var FONT_PRIMARY = {
    omyu: "OmyuPretty",
    singleday: "SingleDay",
    nukka: "OnglipNukka",
    monas: "MonaS12",
    dunggeunmo: "DungGeunMo",
    solmoe: "JeonjuWanpanbonGakR",
    cookierun: "CookieRun",
    mulmaru: "Mulmaru",
    malgun: "Malgun Gothic"
  };

  var FONT_FILES = {
    omyu: { family: "OmyuPretty", urls: ["fonts/omyu/OmyuPretty.ttf"] },
    singleday: { family: "SingleDay", urls: ["fonts/singleday/SingleDay-Regular.ttf"] },
    nukka: { family: "OnglipNukka", urls: ["fonts/nukka/OnglipNukka.ttf"] },
    monas: {
      family: "MonaS12",
      urls: ["fonts/monas/MonaS12.woff2", "fonts/monas/MonaS12TextKR.ttf"],
      unicodeRanges: [null, "U+AC00-D7A3, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF"]
    },
    dunggeunmo: { family: "DungGeunMo", urls: ["fonts/dunggeunmo/DungGeunMo.ttf"] },
    solmoe: {
      family: "JeonjuWanpanbonGakR",
      urls: [
        "fonts/jeonju/JeonjuWanpanbonGak-L.ttf",
        "fonts/jeonju/JeonjuWanpanbonGak-R.ttf",
        "fonts/jeonju/JeonjuWanpanbonGak-R.ttf"
      ],
      weights: ["300", "400", "500"]
    },
    cookierun: { family: "CookieRun", urls: ["fonts/cookie/CookieRun Regular.ttf"] },
    mulmaru: { family: "Mulmaru", urls: ["fonts/Mulmaru.woff2", "fonts/Mulmaru.ttf"] },
    malgun: { family: "Malgun Gothic", urls: [] }
  };

  var activeFontStack = '"OmyuPretty", "Malgun Gothic", sans-serif';
  var overlayFontLoadCache = {};

  function fontStackForFamily(family) {
    return '"' + String(family || "Mulmaru").replace(/"/g, "") + '", "Malgun Gothic", sans-serif';
  }

  function resolveFontUrl(path) {
    try {
      var resolved = new URL(path, location.href);
      var segs = resolved.pathname.split("/").map(function (seg) {
        if (!seg) return seg;
        try { return encodeURIComponent(decodeURIComponent(seg)); } catch (e) { return encodeURIComponent(seg); }
      });
      resolved.pathname = segs.join("/");
      return resolved.href;
    } catch (e) {
      return encodeURI(String(path || ""));
    }
  }

  function preloadOverlayFont(fontKey) {
    var meta = FONT_FILES[fontKey];
    if (!meta || !meta.urls || !meta.urls.length || !window.FontFace) return Promise.resolve(false);
    if (overlayFontLoadCache[fontKey]) return overlayFontLoadCache[fontKey];
    overlayFontLoadCache[fontKey] = Promise.all(meta.urls.map(function (url, i) {
      var opts = {};
      if (meta.unicodeRanges && meta.unicodeRanges[i]) {
        opts.unicodeRange = meta.unicodeRanges[i];
      }
      if (meta.weights && meta.weights[i]) {
        opts.weight = meta.weights[i];
      }
      return new FontFace(meta.family, 'url("' + resolveFontUrl(url) + '")', opts).load()
        .then(function (face) { document.fonts.add(face); return true; })
        .catch(function () { return false; });
    })).then(function () { return true; });
    return overlayFontLoadCache[fontKey];
  }

  function applyFontToChatNodes(stack) {
    if (stack) activeFontStack = stack;
    var primary = activeFontStack.split(",")[0].replace(/"/g, "").trim();
    document.documentElement.style.setProperty("--custom-chat-font-primary", '"' + primary + '"');
    document.body.style.setProperty("font-family", activeFontStack, "important");
    var nodes = document.querySelectorAll(
      "#chat_container, .chat-board-title, .chat-messages-stack, .chat-item-shell, .chat-item, .chat-content, .chat-nickname, .chat-message-text"
    );
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty("font-family", activeFontStack, "important");
    }
  }

  function normalizeNickLayout(s) {
    if (s && (s.nickLayout === "inline" || s.nickLayout === "above" || s.nickLayout === "hidden")) {
      return s.nickLayout;
    }
    if (s && s.showNickname === false) return "hidden";
    return "inline";
  }

  function normalizeChatIconType(value) {
    return value === "heart" ? "heart" : "paw";
  }

  function normalizeHackingTilt(value) {
    if (value === "left") return "left";
    if (value === "right") return "right";
    return "off";
  }

  function applyHackingTiltClasses(el, tilt, active) {
    if (!el) return;
    el.classList.remove("hacking-tilt-left", "hacking-tilt-right", "hacking-tilt-off");
    if (!active) return;
    var t = normalizeHackingTilt(tilt);
    if (t === "left") el.classList.add("hacking-tilt-left");
    else if (t === "right") el.classList.add("hacking-tilt-right");
    else el.classList.add("hacking-tilt-off");
  }

  function hexToRgb(hex) {
    var h = String(hex || "#000000").replace("#", "").trim();
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    if (h.length !== 6) return { r: 0, g: 0, b: 0 };
    var n = parseInt(h, 16);
    if (isNaN(n)) return { r: 0, g: 0, b: 0 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbaFrom(hex, alpha) {
    var a = Math.max(0, Math.min(1, Number(alpha)));
    var c = hexToRgb(hex);
    return "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + a + ")";
  }

  function normalizeFontFamily(value) {
    if (!value || value === "kkukkukk" || value === "cute" || value === "onglip") return "mulmaru";
    if (value === "gothic" || value === "noto" || value === "custom") return "malgun";
    if (value === "dunggeunmo") return "dunggeunmo";
    if (value === "solmoe") return "solmoe";
    if (value === "omyu") return "omyu";
    if (value === "singleday") return "singleday";
    if (value === "nukka") return "nukka";
    if (value === "monas") return "monas";
    return value;
  }

  function buildTextOutlineStyle(s) {
    var style = s.textOutlineStyle;
    if (!style) {
      style = s.textShadow === false ? "none" : "shadow";
    }
    if (s.textOutlineEnabled === false) style = "none";

    var color = s.textOutlineColor || "#000000";
    var w = Math.max(1, Math.min(12, Number(s.textOutlineWidth) || 2));

    if (style === "none") {
      return { shadow: "none", strokeWidth: "0", strokeColor: "transparent" };
    }

    if (style === "stroke") {
      return { shadow: "none", strokeWidth: String(w) + "px", strokeColor: color };
    }

    if (style === "glow") {
      var blur1 = w * 2;
      var blur2 = w * 4;
      return {
        shadow: "0 0 " + blur1 + "px " + color + ", 0 0 " + blur2 + "px " + color,
        strokeWidth: "0",
        strokeColor: "transparent"
      };
    }

    if (style === "bold") {
      var parts = [];
      for (var dx = -w; dx <= w; dx++) {
        for (var dy = -w; dy <= w; dy++) {
          if (dx === 0 && dy === 0) continue;
          parts.push(dx + "px " + dy + "px 0 " + color);
        }
      }
      return { shadow: parts.join(", "), strokeWidth: "0", strokeColor: "transparent" };
    }

    // shadow — 8방향 링
    var ring = Math.max(1, Math.min(6, w));
    var shadows = [];
    var dirs = [
      [0, -ring], [ring, -ring], [ring, 0], [ring, ring],
      [0, ring], [-ring, ring], [-ring, 0], [-ring, -ring]
    ];
    dirs.forEach(function (d) {
      shadows.push(d[0] + "px " + d[1] + "px 0 " + color);
    });
    if (ring > 1) {
      shadows.push("0 0 1px " + color);
    }
    return { shadow: shadows.join(", "), strokeWidth: "0", strokeColor: "transparent" };
  }

  function applyTextOutline(s) {
    var o = buildTextOutlineStyle(s);
    document.documentElement.style.setProperty("--custom-chat-text-shadow", o.shadow);
    document.documentElement.style.setProperty("--custom-chat-text-stroke-width", o.strokeWidth);
    document.documentElement.style.setProperty("--custom-chat-text-stroke-color", o.strokeColor);
  }

  var BUBBLE_THEMES = {
    pastel: {
      fontFamily: "omyu",
      boxBgColor: "#d4c8f0",
      boxBgAlpha: 1,
      boxBorderColor: "#9b8bc4",
      boxBorderAlpha: 1,
      textColor: "#5a4f76",
      nickColor: "#7a6a9c",
      textOutlineColor: "#e8e0f5",
      textOutlineWidth: 1,
      textOutlineStyle: "shadow",
      pawColor: "#6b5b95",
      boxShadow: "0 4px 16px rgba(45, 28, 95, 0.38)",
      borderRadius: 24,
      chatBg: {
        background: "rgba(72, 58, 98, 0.9)",
        border: "2px solid rgba(180, 160, 220, 0.55)",
        borderRadius: "24px",
        padding: "16px 18px",
        boxShadow: "0 6px 22px rgba(35, 22, 70, 0.35)"
      }
    },
    neon: {
      fontFamily: "mulmaru",
      boxBgColor: "#2a1f5c",
      boxBgAlpha: 0.92,
      boxBorderColor: "#00f5ff",
      boxBorderAlpha: 1,
      textColor: "#ffffff",
      nickColor: "#00ffcc",
      textOutlineColor: "#ff00aa",
      textOutlineWidth: 2,
      textOutlineStyle: "glow",
      pawColor: "#00f5ff",
      boxShadow: "0 0 10px rgba(0, 245, 255, 0.35), 0 0 20px rgba(255, 0, 170, 0.2)",
      borderRadius: 24,
      chatBg: {
        background: "rgba(18, 12, 42, 0.82)",
        border: "1px solid rgba(0, 245, 255, 0.38)",
        borderRadius: "28px",
        padding: "6px 10px",
        boxShadow: "0 0 12px rgba(0, 245, 255, 0.22), 0 0 24px rgba(255, 0, 170, 0.14)"
      }
    },
    oriental: {
      fontFamily: "solmoe",
      boxBgColor: "#faf6ee",
      boxBgAlpha: 1,
      boxBorderColor: "#c62828",
      boxBorderAlpha: 1,
      textColor: "#3e1f14",
      nickColor: "#8c2f1e",
      textOutlineColor: "#c9a227",
      textOutlineWidth: 1,
      textOutlineStyle: "shadow",
      pawColor: "#c62828",
      boxShadow: "0 2px 10px rgba(100, 20, 10, 0.2)",
      borderRadius: 0,
      chatBg: {
        background: "rgba(255, 252, 245, 0.94)",
        border: "2px solid rgba(198, 40, 40, 0.32)",
        borderRadius: "4px",
        padding: "8px 12px",
        boxShadow: "0 3px 12px rgba(100, 20, 10, 0.16)"
      }
    },
    xp: {
      fontFamily: "dunggeunmo",
      boxBgColor: "#ece9d8",
      boxBgAlpha: 1,
      boxBorderColor: "#0054e3",
      boxBorderAlpha: 1,
      textColor: "#000000",
      nickColor: "#003399",
      textOutlineColor: "#ffffff",
      textOutlineWidth: 1,
      textOutlineStyle: "shadow",
      pawColor: "#0054e3",
      boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.85), inset -1px -1px 0 rgba(128,128,128,0.45), 2px 2px 5px rgba(0,0,0,0.28)",
      borderRadius: 8,
      chatBg: {
        background: "rgba(236, 233, 216, 0.94)",
        border: "2px solid #0054e3",
        borderRadius: "8px",
        padding: "8px 10px",
        boxShadow: "2px 2px 6px rgba(0,0,0,0.22)"
      }
    },
    magical: {
      fontFamily: "singleday",
      boxBgColor: "#fff5fd",
      boxBgAlpha: 1,
      boxBorderColor: "#ff4da6",
      boxBorderAlpha: 1,
      textColor: "#5c1558",
      nickColor: "#e91e8c",
      textOutlineColor: "#ffc8ec",
      textOutlineWidth: 2,
      textOutlineStyle: "glow",
      pawColor: "#ff4da6",
      boxShadow: "0 0 0 1px rgba(255, 215, 0, 0.38), 0 0 18px rgba(255, 77, 166, 0.55), 0 0 34px rgba(170, 100, 255, 0.38), inset 0 0 20px rgba(255, 200, 245, 0.3)",
      borderRadius: 28,
      chatBg: {
        background: "rgba(255, 182, 220, 0.88)",
        border: "3px solid rgba(255, 220, 245, 0.95)",
        borderRadius: "34px",
        padding: "20px 22px",
        boxShadow: "0 0 0 2px rgba(255, 215, 0, 0.3), 0 12px 36px rgba(120, 20, 90, 0.4), 0 0 40px rgba(255, 140, 220, 0.5)"
        }
      },
      hacking: {
        fontFamily: "monas",
        fontSize: 24,
        boxBgColor: "#0a2838",
        boxBgAlpha: 0.82,
        boxBorderColor: "#00e5cc",
        boxBorderAlpha: 1,
        textColor: "#e8ffff",
        nickColor: "#00ffcc",
        textOutlineColor: "#003838",
        textOutlineWidth: 1,
        textOutlineStyle: "glow",
        pawColor: "#00e5cc",
        boxShadow: "0 0 10px rgba(0, 229, 204, 0.55), 0 0 24px rgba(0, 229, 204, 0.22), inset 0 0 18px rgba(0, 120, 110, 0.15)",
        borderRadius: 0,
        chatBg: {
          background: "rgba(4, 8, 16, 0.94)",
          border: "1px solid rgba(0, 229, 204, 0.55)",
          borderRadius: "0",
          padding: "12px 16px",
          boxShadow: "0 0 12px rgba(0, 229, 204, 0.24), inset 0 0 36px rgba(0, 80, 90, 0.1)"
        }
      },
      animal: {
        fontFamily: "nukka",
        boxBgColor: "#ffffff",
        boxBgAlpha: 0.96,
        boxBorderColor: "#e6b422",
        boxBorderAlpha: 1,
        textColor: "#5c4818",
        nickColor: "#8b6914",
        textOutlineColor: "#fff8e1",
        textOutlineWidth: 1,
        textOutlineStyle: "shadow",
        pawColor: "#e6b422",
        boxShadow: "0 2px 10px rgba(180, 140, 20, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
        borderRadius: 20,
        chatBg: {
          background: "rgba(255, 224, 102, 0.92)",
          border: "2px solid rgba(230, 180, 34, 0.95)",
          borderRadius: "28px",
          padding: "22px 20px 26px",
          boxShadow: "0 8px 22px rgba(140, 100, 10, 0.28)"
        }
      },
      minecraft: {
        fontFamily: "dunggeunmo",
        boxBgColor: "#3e3e3e",
        boxBgAlpha: 0.88,
        boxBorderColor: "#7d7d7d",
        boxBorderAlpha: 1,
        textColor: "#ffffff",
        nickColor: "#55ff55",
        textOutlineColor: "#1a1a1a",
        textOutlineWidth: 2,
        textOutlineStyle: "shadow",
        pawColor: "#55ff55",
        boxShadow: "4px 4px 0 #1b1b1b",
        borderRadius: 0,
        chatBg: {
          background: "rgba(30, 30, 30, 0.9)",
          border: "4px solid #5a5a5a",
          borderRadius: "0",
          padding: "12px 14px",
          boxShadow: "6px 6px 0 #111111"
        }
      },
      simple: {
        fontFamily: "malgun",
        boxBgColor: "#404040",
        boxBgAlpha: 0.35,
        boxBorderColor: "#5a5a5a",
        boxBorderAlpha: 0.45,
        textColor: "#ffffff",
        nickColor: "#dddddd",
        textOutlineColor: "#2a2a2a",
        textOutlineWidth: 0,
        textOutlineStyle: "none",
        pawColor: "#b0b0b0",
        boxShadow: "none",
        borderRadius: 4,
        chatBg: {
          background: "rgba(64, 64, 64, 0.88)",
          border: "1px solid rgba(110, 110, 110, 0.5)",
          borderRadius: "6px",
          padding: "10px 12px",
          boxShadow: "none"
        }
      }
    };

  var THEME_CHAT_BG_KEYS = ["pastel", "neon", "oriental", "xp", "magical", "hacking", "animal", "simple", "minecraft"];

  function defaultThemeFontFamily() {
    var out = {};
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      var tp = BUBBLE_THEMES[key];
        out[key] = (tp && tp.fontFamily) ? tp.fontFamily : "mulmaru";
    });
    return out;
  }

  function normalizeThemeFontFamily(s) {
    var out = defaultThemeFontFamily();
    if (s && s.themeFontFamily && typeof s.themeFontFamily === "object") {
      THEME_CHAT_BG_KEYS.forEach(function (key) {
        if (s.themeFontFamily[key]) out[key] = normalizeFontFamily(s.themeFontFamily[key]);
      });
    } else if (s && s.fontFamily && !s.themeFontFamily) {
      var legacy = normalizeFontFamily(s.fontFamily);
      var active = normalizeBubbleTheme(s.bubbleTheme);
      if (legacy !== "mulmaru" || !BUBBLE_THEMES[active] || !BUBBLE_THEMES[active].fontFamily) {
        out[active] = legacy;
      }
    }
    THEME_CHAT_BG_KEYS.forEach(function (key) {
        if (out[key] === "cute" || out[key] === "onglip") out[key] = defaultThemeFontFamily()[key];
    });
    return out;
  }

  function getThemeFontFamily(s, theme) {
    var map = normalizeThemeFontFamily(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    return map[key] || defaultThemeFontFamily()[key] || "mulmaru";
  }

  function defaultThemeChatBg() {
    return { pastel: false, neon: false, oriental: false, xp: false, magical: false, hacking: true, animal: true, simple: true, minecraft: true };
  }

  function defaultThemeBoardTitle() {
    return {
      pastel: "CHATTING",
      neon: "LIVE CHAT",
      oriental: "채팅",
      xp: "채팅",
      magical: "✧｡✦ MAGIC CHAT ✦｡✧",
      hacking: ">> SYSTEM_LOG",
      animal: "COMMENTS",
      simple: "LIVE CHAT",
      minecraft: "CHAT"
    };
  }

  function normalizeThemeBoardTitle(s) {
    var out = defaultThemeBoardTitle();
    if (!s || !s.themeBoardTitle || typeof s.themeBoardTitle !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      if (s.themeBoardTitle[key] != null) out[key] = String(s.themeBoardTitle[key]);
    });
    return out;
  }

  function getThemeBoardTitle(s, theme) {
    var map = normalizeThemeBoardTitle(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    return map[key] != null ? String(map[key]) : (defaultThemeBoardTitle()[key] || "");
  }

  function defaultThemeBoardTitleColor() {
    return {
      pastel: "#f8f0ff",
      neon: "#00ffcc",
      oriental: "#8c2f1e",
      xp: "#ffffff",
      magical: "#ffffff",
      hacking: "#00ffcc",
      animal: "#7a5c12",
      simple: "#ffffff",
      minecraft: "#55ff55"
    };
  }

  function normalizeThemeBoardTitleColor(s) {
    var out = defaultThemeBoardTitleColor();
    if (s && s.themeBoardTitleColor && typeof s.themeBoardTitleColor === "object") {
      THEME_CHAT_BG_KEYS.forEach(function (key) {
        if (s.themeBoardTitleColor[key]) out[key] = String(s.themeBoardTitleColor[key]);
      });
    }
    return out;
  }

  function getThemeBoardTitleColor(s, theme) {
    var map = normalizeThemeBoardTitleColor(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    return map[key] || defaultThemeBoardTitleColor()[key] || "#f8f0ff";
  }

  function defaultThemeBoardTitleFontSize() {
    return {
      pastel: 22,
      neon: 21,
      oriental: 26,
      xp: 22,
      magical: 22,
      hacking: 16,
      animal: 23,
      simple: 18,
      minecraft: 20
    };
  }

  function clampBoardTitleFontSize(value, fallback) {
    var n = Number(value);
    if (isNaN(n) || n <= 0) n = Number(fallback) || 22;
    return Math.max(10, Math.min(48, Math.round(n)));
  }

  function normalizeThemeBoardTitleFontSize(s) {
    var out = defaultThemeBoardTitleFontSize();
    if (s && s.themeBoardTitleFontSize && typeof s.themeBoardTitleFontSize === "object") {
      THEME_CHAT_BG_KEYS.forEach(function (key) {
        if (s.themeBoardTitleFontSize[key] != null) {
          out[key] = clampBoardTitleFontSize(s.themeBoardTitleFontSize[key], out[key]);
        }
      });
    }
    return out;
  }

  function getThemeBoardTitleFontSize(s, theme) {
    var map = normalizeThemeBoardTitleFontSize(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    return map[key] || defaultThemeBoardTitleFontSize()[key] || 22;
  }

  function defaultThemeNickColor() {
    var out = {};
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      var tp = BUBBLE_THEMES[key];
      out[key] = (tp && tp.nickColor) ? tp.nickColor : "#7a6a9c";
    });
    return out;
  }

  function normalizeThemeNickColor(s) {
    var out = defaultThemeNickColor();
    if (s && s.themeNickColor && typeof s.themeNickColor === "object") {
      THEME_CHAT_BG_KEYS.forEach(function (key) {
        if (s.themeNickColor[key]) out[key] = String(s.themeNickColor[key]);
      });
    } else if (s && s.nickColor) {
      THEME_CHAT_BG_KEYS.forEach(function (key) {
        out[key] = String(s.nickColor);
      });
    }
    return out;
  }

  function getThemeNickColor(s, theme) {
    var map = normalizeThemeNickColor(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    return map[key] || defaultThemeNickColor()[key] || "#7a6a9c";
  }

  function resolveBoardTitleForDisplay(s, theme) {
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var rawMap = s && s.themeBoardTitle && typeof s.themeBoardTitle === "object" ? s.themeBoardTitle : null;
    var hasExplicit = !!(rawMap && Object.prototype.hasOwnProperty.call(rawMap, key));
    var title = getThemeBoardTitle(s, key).trim();
    if (!title && !hasExplicit) title = (defaultThemeBoardTitle()[key] || "").trim();
    return title;
  }

  function findBoardTitleEl(container) {
    if (!container) return null;
    var child = container.firstElementChild;
    if (child && child.classList.contains("chat-board-title")) return child;
    var found = container.querySelector(".chat-board-title");
    if (found && found.parentElement === container) return found;
    return null;
  }

  function ensureBoardTitleEl(container) {
    if (!container) return null;
    var el = findBoardTitleEl(container);
    if (!el) {
      el = document.createElement("div");
      el.className = "chat-board-title";
      el.setAttribute("aria-hidden", "true");
      container.insertBefore(el, container.firstChild);
    }
    return el;
  }

  function applyBoardTitle(s, themeKey) {
    var container = document.getElementById("chat_container");
    if (!container) return;
    var el = ensureBoardTitleEl(container);
    var on = isThemeChatBgOn(s, themeKey) && !s.gameMode;
    var title = resolveBoardTitleForDisplay(s, themeKey);
    el.textContent = title;
    el.classList.toggle("chat-board-title--show", on && !!title);
    el.style.display = "";
    el.setAttribute("aria-hidden", !on || !title ? "true" : "false");
  }

  function defaultThemeBoardFill() {
    return {
      pastel: { color: "#c4b2e4", alpha: 0.82 },
      neon: { color: "#a88ae4", alpha: 0.75 },
      oriental: { color: "#fffcf5", alpha: 0.92 },
      xp: { color: "#ffffff", alpha: 0.42 },
      magical: { color: "#ffeefa", alpha: 0.88 },
      hacking: { color: "#061018", alpha: 0.88 },
      animal: { color: "#ffffff", alpha: 0.94 },
      simple: { color: "#525252", alpha: 0.85 },
      minecraft: { color: "#2b2b2b", alpha: 0.88 }
    };
  }

  function normalizeThemeBoardFill(s) {
    var out = defaultThemeBoardFill();
    if (!s || !s.themeBoardFill || typeof s.themeBoardFill !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      var entry = s.themeBoardFill[key];
      if (!entry || typeof entry !== "object") return;
      if (entry.color) out[key].color = String(entry.color);
      if (entry.alpha != null) out[key].alpha = Number(entry.alpha);
    });
    return out;
  }

  function getThemeBoardFill(s, theme) {
    var map = normalizeThemeBoardFill(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var fill = map[key] || defaultThemeBoardFill()[key] || { color: "#7a6498", alpha: 1 };
    return {
      color: fill.color || "#7a6498",
      alpha: fill.alpha != null ? Number(fill.alpha) : 1
    };
  }

  function getThemeBoardFillRgba(s, theme) {
    var fill = getThemeBoardFill(s, theme);
    return rgbaFrom(fill.color, fill.alpha);
  }

  function defaultThemeOuterFill() {
    return {
      pastel: { color: "#7a6498", alpha: 1 },
      neon: { color: "#1a0e38", alpha: 0.96 },
      oriental: { color: "#faf6ee", alpha: 1 },
      xp: { color: "#ece9d8", alpha: 1 },
      magical: { color: "#d84aa8", alpha: 1 },
      hacking: { color: "#040810", alpha: 1 },
      animal: { color: "#ffe066", alpha: 1 },
      simple: { color: "#484848", alpha: 0.92 },
      minecraft: { color: "#1e1e1e", alpha: 0.95 }
    };
  }

  function normalizeThemeOuterFill(s) {
    var out = defaultThemeOuterFill();
    if (!s || !s.themeOuterFill || typeof s.themeOuterFill !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      var entry = s.themeOuterFill[key];
      if (!entry || typeof entry !== "object") return;
      if (entry.color) out[key].color = String(entry.color);
      if (entry.alpha != null) out[key].alpha = Number(entry.alpha);
    });
    return out;
  }

  function getThemeOuterFill(s, theme) {
    var map = normalizeThemeOuterFill(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var fill = map[key] || defaultThemeOuterFill()[key] || { color: "#7a6498", alpha: 1 };
    return {
      color: fill.color || "#7a6498",
      alpha: fill.alpha != null ? Number(fill.alpha) : 1
    };
  }

  function getThemeOuterFillRgba(s, theme) {
    var fill = getThemeOuterFill(s, theme);
    return rgbaFrom(fill.color, fill.alpha);
  }

  function defaultThemeOuterBorder() {
    return {
      pastel: { color: "#d8c8f0", alpha: 1 },
      neon: { color: "#00f5ff", alpha: 1 },
      oriental: { color: "#c62828", alpha: 1 },
      xp: { color: "#0054e3", alpha: 1 },
      magical: { color: "#ffe8f8", alpha: 1 },
      hacking: { color: "#00e5cc", alpha: 1 },
      animal: { color: "#e6b422", alpha: 1 },
      simple: { color: "#707070", alpha: 1 },
      minecraft: { color: "#7d7d7d", alpha: 1 }
    };
  }

  function normalizeThemeOuterBorder(s) {
    var out = defaultThemeOuterBorder();
    if (!s || !s.themeOuterBorder || typeof s.themeOuterBorder !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      var entry = s.themeOuterBorder[key];
      if (!entry || typeof entry !== "object") return;
      if (entry.color) out[key].color = String(entry.color);
      if (entry.alpha != null) out[key].alpha = Number(entry.alpha);
    });
    return out;
  }

  function getThemeOuterBorder(s, theme) {
    var map = normalizeThemeOuterBorder(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var border = map[key] || defaultThemeOuterBorder()[key] || { color: "#d8c8f0", alpha: 1 };
    return {
      color: border.color || "#d8c8f0",
      alpha: border.alpha != null ? Number(border.alpha) : 1
    };
  }

  function getThemeOuterBorderRgba(s, theme) {
    var border = getThemeOuterBorder(s, theme);
    return rgbaFrom(border.color, border.alpha);
  }

  function defaultThemeMidBorder() {
    return {
      pastel: { color: "#e6daf8", alpha: 0.45 },
      neon: { color: "#d2beff", alpha: 0.32 },
      oriental: { color: "#c62828", alpha: 0.18 },
      xp: { color: "#0054e3", alpha: 0.35 },
      magical: { color: "#ffdcf5", alpha: 0.65 },
      hacking: { color: "#00e5cc", alpha: 0.32 },
      animal: { color: "#f5d88a", alpha: 0.55 },
      simple: { color: "#808080", alpha: 0.32 },
      minecraft: { color: "#55ff55", alpha: 0.35 }
    };
  }

  function normalizeThemeMidBorder(s) {
    var out = defaultThemeMidBorder();
    if (!s || !s.themeMidBorder || typeof s.themeMidBorder !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      var entry = s.themeMidBorder[key];
      if (!entry || typeof entry !== "object") return;
      if (entry.color) out[key].color = String(entry.color);
      if (entry.alpha != null) out[key].alpha = Number(entry.alpha);
    });
    return out;
  }

  function getThemeMidBorder(s, theme) {
    var map = normalizeThemeMidBorder(s);
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var border = map[key] || defaultThemeMidBorder()[key] || { color: "#e6daf8", alpha: 0.45 };
    return {
      color: border.color || "#e6daf8",
      alpha: border.alpha != null ? Number(border.alpha) : 0.45
    };
  }

  function getThemeMidBorderRgba(s, theme) {
    var border = getThemeMidBorder(s, theme);
    return rgbaFrom(border.color, border.alpha);
  }

  function isThemeOuterBorderDefault(s, theme) {
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var border = getThemeOuterBorder(s, key);
    var def = defaultThemeOuterBorder()[key];
    return border.color === def.color && Number(border.alpha) === Number(def.alpha);
  }

  function isThemeMidBorderDefault(s, theme) {
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var border = getThemeMidBorder(s, key);
    var def = defaultThemeMidBorder()[key];
    return border.color === def.color && Number(border.alpha) === Number(def.alpha);
  }

  function migrateBoardThemeDefaults(s) {
    var VER = 6;
    if (!s || typeof s !== "object") return s;
    var cur = s.boardThemeDefaultsVersion || 0;
    if (cur >= VER) return s;
    s = Object.assign({}, s);
    if (cur < 4) {
      s.themeOuterFill = normalizeThemeOuterFill(s);
      s.themeBoardFill = normalizeThemeBoardFill(s);
      s.themeOuterBorder = normalizeThemeOuterBorder(s);
      s.themeMidBorder = normalizeThemeMidBorder(s);
      s.themeOuterFillCustom = normalizeThemeOuterFillCustom(s);
      s.themeMidFillCustom = normalizeThemeMidFillCustom(s);
      s = syncThemeFillCustomFlags(s);
      cur = 4;
    }
    if (cur < 5 && normalizeBubbleTheme(s.bubbleTheme) === "hacking") {
      if (!s.fontSize || Number(s.fontSize) >= 28) s.fontSize = 24;
      var titleMap = normalizeThemeBoardTitleFontSize(s);
      if (!s.themeBoardTitleFontSize || s.themeBoardTitleFontSize.hacking == null || Number(s.themeBoardTitleFontSize.hacking) >= 18) {
        titleMap.hacking = 16;
        s.themeBoardTitleFontSize = titleMap;
      }
      cur = 5;
    }
    if (cur < 6) {
      s.themeOuterFill = normalizeThemeOuterFill(s);
      s.themeOuterBorder = normalizeThemeOuterBorder(s);
      s.themeMidBorder = normalizeThemeMidBorder(s);
      s.themeBoardTitleColor = normalizeThemeBoardTitleColor(s);
      var outerAnimal = s.themeOuterFill.animal || {};
      if (outerAnimal.color === "#f5f2e6" || outerAnimal.color === "#5ebfb4") {
        s.themeOuterFill.animal = { color: "#ffe066", alpha: 1 };
      }
      var borderAnimal = s.themeOuterBorder.animal || {};
      if (borderAnimal.color === "#4db8ae") {
        s.themeOuterBorder.animal = { color: "#e6b422", alpha: 1 };
      }
      var midAnimal = s.themeMidBorder.animal || {};
      if (midAnimal.color === "#9de5dc") {
        s.themeMidBorder.animal = { color: "#f5d88a", alpha: 0.55 };
      }
      if (s.themeBoardTitleColor.animal === "#ffffff" || s.themeBoardTitleColor.animal === "#3a9a92") {
        s.themeBoardTitleColor.animal = "#7a5c12";
      }
      if (s.boxBorderColor === "#5ebfb4") s.boxBorderColor = "#e6b422";
      if (s.pawColor === "#5ebfb4") s.pawColor = "#e6b422";
      if (s.textColor === "#2d6a62") s.textColor = "#5c4818";
      if (s.nickColor === "#3a9a92") s.nickColor = "#8b6914";
      if (s.textOutlineColor === "#e8f8f5") s.textOutlineColor = "#fff8e1";
      cur = 6;
    }
    s.boardThemeDefaultsVersion = VER;
    return s;
  }

  function applyBoardBorderStyle(s, themeKey) {
    var boardOn = isThemeChatBgOn(s, themeKey) && !s.gameMode;
    var midOn = boardOn && isThemeMidLayerOn(s, themeKey);
    var theme = normalizeBubbleTheme(themeKey);
    if (boardOn) {
      if (isThemeOuterFillCustomOn(s, themeKey) || !isThemeOuterBorderDefault(s, themeKey)) {
        var outerBorder = getThemeOuterBorder(s, themeKey);
        document.documentElement.style.setProperty("--custom-chat-outer-border", getThemeOuterBorderRgba(s, themeKey));
        if (theme === "oriental") {
          setOrientalCornerVars(document.documentElement, outerBorder.color, "frame-", false);
        }
      } else {
        document.documentElement.style.removeProperty("--custom-chat-outer-border");
      }
    } else {
      document.documentElement.style.removeProperty("--custom-chat-outer-border");
    }
    if (midOn) {
      if (isThemeMidFillCustomOn(s, themeKey) || !isThemeMidBorderDefault(s, themeKey)) {
        document.documentElement.style.setProperty("--custom-chat-mid-border", getThemeMidBorderRgba(s, themeKey));
      } else {
        document.documentElement.style.removeProperty("--custom-chat-mid-border");
      }
    } else {
      document.documentElement.style.removeProperty("--custom-chat-mid-border");
    }
  }

  var ORIENTAL_CORNER_PATHS = {
    tl: "%3Cpath stroke-width='2.2' d='M0 56V0H56'/%3E%3Cpath stroke-width='1.4' d='M0 6H56'/%3E%3Cpath stroke-width='2' d='M3 3H30V10H10V30H3Z'/%3E%3Cpath stroke-width='2' d='M3 3H19V7H7V19H3Z'/%3E%3Cpath stroke-width='2' d='M3 3H11V5H5V11H3Z'/%3E",
    tr: "%3Cpath stroke-width='2.2' d='M56 56V0H0'/%3E%3Cpath stroke-width='1.4' d='M0 6H56'/%3E%3Cpath stroke-width='2' d='M53 3H26V10H46V30H53Z'/%3E%3Cpath stroke-width='2' d='M53 3H37V7H49V19H53Z'/%3E%3Cpath stroke-width='2' d='M53 3H45V5H51V11H53Z'/%3E",
    bl: "%3Cpath stroke-width='2.2' d='M0 0v56h56'/%3E%3Cpath stroke-width='1.4' d='M0 50H56'/%3E%3Cpath stroke-width='2' d='M3 53H30V46H10V26H3Z'/%3E%3Cpath stroke-width='2' d='M3 53H19V49H7V37H3Z'/%3E%3Cpath stroke-width='2' d='M3 53H11V51H5V45H3Z'/%3E",
    br: "%3Cpath stroke-width='2.2' d='M56 0v56H0'/%3E%3Cpath stroke-width='1.4' d='M0 50H56'/%3E%3Cpath stroke-width='2' d='M53 53H26V46H46V26H53Z'/%3E%3Cpath stroke-width='2' d='M53 53H37V49H49V37H53Z'/%3E%3Cpath stroke-width='2' d='M53 53H45V51H51V45H53Z'/%3E"
  };

  function normalizeOrientalHexColor(hex, fallback) {
    var h = String(hex || fallback || "#c62828").trim();
    if (h.charAt(0) === "#") h = h.slice(1);
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = String(fallback || "c62828").replace("#", "");
    return "#" + h.toLowerCase();
  }

  function orientalSvgStrokeEnc(hex) {
    return "%23" + normalizeOrientalHexColor(hex).slice(1);
  }

  function buildOrientalCornerDataUrl(strokeEnc, cornerKey) {
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='" + strokeEnc + "' stroke-linejoin='miter'%3E" + ORIENTAL_CORNER_PATHS[cornerKey] + "%3C/g%3E%3C/svg%3E\")";
  }

  function setOrientalCornerVars(target, color, varPrefix, setAccent) {
    if (!target) return;
    var hex = normalizeOrientalHexColor(color);
    var stroke = orientalSvgStrokeEnc(hex);
    var prefix = varPrefix || "";
    ["tl", "tr", "bl", "br"].forEach(function (key) {
      target.style.setProperty("--oriental-" + prefix + "corner-" + key, buildOrientalCornerDataUrl(stroke, key));
    });
    if (setAccent) target.style.setProperty("--oriental-red", hex);
  }

  function hexToRgbObj(hex) {
    var h = normalizeOrientalHexColor(hex).slice(1);
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (n) {
      var v = Math.max(0, Math.min(255, Math.round(n)));
      return (v < 16 ? "0" : "") + v.toString(16);
    }).join("");
  }

  function shadeHex(hex, factor) {
    var c = hexToRgbObj(hex);
    if (factor >= 1) {
      var f = factor - 1;
      return rgbToHex(
        c.r + (255 - c.r) * f,
        c.g + (255 - c.g) * f,
        c.b + (255 - c.b) * f
      );
    }
    return rgbToHex(c.r * factor, c.g * factor, c.b * factor);
  }

  function urlEncHex(hex) {
    return "%23" + normalizeOrientalHexColor(hex).slice(1);
  }

  function buildXpTitleGradient(base) {
    var b = normalizeOrientalHexColor(base);
    return "linear-gradient(180deg, " + shadeHex(b, 1.45) + " 0%, " + shadeHex(b, 1.2) + " 14%, " + b + " 52%, " + shadeHex(b, 0.55) + " 100%)";
  }

  function buildXpClientGradient(base) {
    var b = normalizeOrientalHexColor(base);
    return "linear-gradient(180deg, #ffffff 0%, " + shadeHex(b, 1.06) + " 5%, " + b + " 100%)";
  }

  function xpCloseColor(pawHex, fallback) {
    var c = hexToRgbObj(pawHex);
    if (c.r > c.g + 24 && c.r > c.b + 16) return normalizeOrientalHexColor(pawHex);
    return normalizeOrientalHexColor(fallback || "#c84828");
  }

  function buildXpTitleButtonsUrl(btnBase, closeBase) {
    var btn = normalizeOrientalHexColor(btnBase);
    var close = xpCloseColor(closeBase, "#c84828");
    var bTop = urlEncHex(shadeHex(btn, 1.35));
    var bMid = urlEncHex(shadeHex(btn, 1.05));
    var bBot = urlEncHex(shadeHex(btn, 0.75));
    var bStroke = urlEncHex(shadeHex(btn, 0.35));
    var rTop = urlEncHex(shadeHex(close, 1.25));
    var rMid = urlEncHex(shadeHex(close, 1.0));
    var rBot = urlEncHex(shadeHex(close, 0.72));
    var rStroke = urlEncHex(shadeHex(close, 0.45));
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 63 21'%3E%3Cdefs%3E%3ClinearGradient id='b' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='" + bTop + "'/%3E%3Cstop offset='45%25' stop-color='" + bMid + "'/%3E%3Cstop offset='100%25' stop-color='" + bBot + "'/%3E%3C/linearGradient%3E%3ClinearGradient id='r' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='" + rTop + "'/%3E%3Cstop offset='45%25' stop-color='" + rMid + "'/%3E%3Cstop offset='100%25' stop-color='" + rBot + "'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='0.5' y='0.5' width='20' height='20' fill='url(%23b)' stroke='" + bStroke + "' stroke-width='1'/%3E%3Crect x='6' y='13.5' width='9' height='2' rx='0.5' fill='%23ffffff'/%3E%3Crect x='21.5' y='0.5' width='20' height='20' fill='url(%23b)' stroke='" + bStroke + "' stroke-width='1'/%3E%3Crect x='27' y='6.5' width='9' height='9' fill='none' stroke='%23ffffff' stroke-width='1.8'/%3E%3Crect x='42.5' y='0.5' width='20' height='20' fill='url(%23r)' stroke='" + rStroke + "' stroke-width='1'/%3E%3Cpath d='M48.5 6.5 L56.5 14.5 M56.5 6.5 L48.5 14.5' stroke='%23ffffff' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\")";
  }

  function applyXpThemeVars(target, s, themeKey) {
    if (!target || normalizeBubbleTheme(themeKey) !== "xp") return;
    var tp = BUBBLE_THEMES.xp;
    var titleBase = isThemeOuterFillCustomOn(s, themeKey)
      ? getThemeOuterFill(s, themeKey).color
      : (getThemeOuterBorder(s, themeKey).color || "#0054e3");
    var boardFill = getThemeBoardFill(s, themeKey);
    var clientBase = (boardFill && boardFill.color) || s.boxBgColor || tp.boxBgColor || "#ece9d8";
    var frameBorder = getThemeOuterBorder(s, themeKey).color || "#0054e3";
    var btnBase = s.boxBorderColor || tp.boxBorderColor || frameBorder;
    var closeBase = s.pawColor || tp.pawColor || "#c84828";
    target.style.setProperty("--xp-frame-border", frameBorder);
    target.style.setProperty("--xp-client-bg-color", normalizeOrientalHexColor(clientBase));
    target.style.setProperty("--xp-shell-bg-image", buildXpTitleGradient(titleBase) + ", " + buildXpClientGradient(clientBase));
    target.style.setProperty("--xp-title-buttons", buildXpTitleButtonsUrl(btnBase, closeBase));
  }

  function defaultThemeOuterFillCustom() {
    return { pastel: false, neon: false, oriental: false, xp: false, magical: false, hacking: false, animal: false, simple: false, minecraft: false };
  }

  function normalizeThemeOuterFillCustom(s) {
    var out = defaultThemeOuterFillCustom();
    if (!s || !s.themeOuterFillCustom || typeof s.themeOuterFillCustom !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      if (s.themeOuterFillCustom[key] === true) out[key] = true;
    });
    return out;
  }

  function normalizeHexColor(hex) {
    var h = String(hex || "").trim().toLowerCase();
    if (h.charAt(0) === "#") h = h.slice(1);
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    return "#" + h;
  }

  function normalizeFillAlpha(value, fallback) {
    var n = Number(value);
    if (isNaN(n)) n = fallback != null ? Number(fallback) : 1;
    return Math.round(Math.max(0, Math.min(1, n)) * 1000) / 1000;
  }

  function isThemeOuterFillDefault(s, theme) {
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var fill = getThemeOuterFill(s, key);
    var def = defaultThemeOuterFill()[key];
    return normalizeHexColor(fill.color) === normalizeHexColor(def.color) &&
      normalizeFillAlpha(fill.alpha, def.alpha) === normalizeFillAlpha(def.alpha, 1);
  }

  function isThemeBoardFillDefault(s, theme) {
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    var fill = getThemeBoardFill(s, key);
    var def = defaultThemeBoardFill()[key];
    return normalizeHexColor(fill.color) === normalizeHexColor(def.color) &&
      normalizeFillAlpha(fill.alpha, def.alpha) === normalizeFillAlpha(def.alpha, 1);
  }

  function syncThemeFillCustomFlags(s) {
    if (!s) return s;
    var outerCustom = normalizeThemeOuterFillCustom(s);
    var midCustom = normalizeThemeMidFillCustom(s);
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      if (!outerCustom[key] && !isThemeOuterFillDefault(s, key)) outerCustom[key] = true;
      if (!midCustom[key] && !isThemeBoardFillDefault(s, key)) midCustom[key] = true;
    });
    s.themeOuterFillCustom = outerCustom;
    s.themeMidFillCustom = midCustom;
    return s;
  }

  function isThemeOuterFillCustomOn(s, theme) {
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    if (normalizeThemeOuterFillCustom(s)[key]) return true;
    return !isThemeOuterFillDefault(s, theme);
  }

  function applyOuterFillStyle(s, themeKey) {
    var boardOn = isThemeChatBgOn(s, themeKey) && !s.gameMode;
    var customOn = boardOn && isThemeOuterFillCustomOn(s, themeKey);
    var rgba = getThemeOuterFillRgba(s, themeKey);
    var theme = normalizeBubbleTheme(themeKey);
    document.documentElement.style.setProperty("--custom-chat-outer-bg", rgba);
    if (theme === "animal" && boardOn) {
      applyAnimalThemeVars(document.documentElement, getThemeOuterFill(s, themeKey).color);
    } else {
      clearAnimalThemeVars(document.documentElement);
    }
    var container = document.getElementById("chat_container");
    if (!container) return;
    container.classList.toggle("has-custom-outer-fill", customOn);
    if (theme === "xp") {
      applyXpThemeVars(document.documentElement, s, themeKey);
      container.style.removeProperty("background");
      container.style.removeProperty("background-color");
      container.style.removeProperty("background-image");
      return;
    }
    if (!boardOn) {
      container.style.removeProperty("background");
      container.style.removeProperty("background-color");
      container.style.removeProperty("background-image");
      return;
    }
    if (theme === "animal") {
      container.style.removeProperty("background");
      container.style.removeProperty("background-color");
      container.style.removeProperty("background-image");
      return;
    }
    if (customOn) {
      container.style.setProperty("background", rgba, "important");
      container.style.setProperty("background-color", rgba, "important");
      container.style.setProperty("background-image", "none", "important");
      return;
    }
    container.style.removeProperty("background");
    container.style.removeProperty("background-color");
    container.style.removeProperty("background-image");
  }

  function applyMidLayerStyle(s, themeKey) {
    var boardOn = isThemeChatBgOn(s, themeKey) && !s.gameMode;
    var midOn = boardOn && isThemeMidLayerOn(s, themeKey);
    var customOn = midOn && isThemeMidFillCustomOn(s, themeKey);
    var midRgba = getThemeBoardFillRgba(s, themeKey);
    document.documentElement.style.setProperty("--custom-chat-mid-bg", midRgba);
    var container = document.getElementById("chat_container");
    document.body.classList.toggle("mid-layer-on", midOn);
    if (container) {
      container.classList.toggle("mid-layer-on", midOn);
      var stack = ensureMessagesStack(container);
      if (stack) {
        stack.classList.toggle("mid-layer-off", boardOn && !midOn);
        stack.classList.toggle("has-custom-mid-fill", customOn);
        if (!midOn) {
          stack.style.removeProperty("background");
          stack.style.removeProperty("background-color");
          stack.style.removeProperty("background-image");
          return;
        }
        if (customOn) {
          stack.style.setProperty("background", midRgba, "important");
          stack.style.setProperty("background-color", midRgba, "important");
          stack.style.setProperty("background-image", "none", "important");
          return;
        }
        stack.style.removeProperty("background");
        stack.style.removeProperty("background-color");
        stack.style.removeProperty("background-image");
      }
    }
  }

  function defaultThemeMidLayer() {
    return { pastel: true, neon: true, oriental: true, xp: true, magical: true, hacking: true, animal: true, simple: false, minecraft: true };
  }

  function normalizeThemeMidLayer(s) {
    var out = defaultThemeMidLayer();
    if (!s || !s.themeMidLayer || typeof s.themeMidLayer !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      if (s.themeMidLayer[key] === false) out[key] = false;
    });
    return out;
  }

  function isThemeMidLayerOn(s, theme) {
    return !!normalizeThemeMidLayer(s)[normalizeBubbleTheme(theme || (s && s.bubbleTheme))];
  }

  function defaultThemeMidFillCustom() {
    return { pastel: false, neon: false, oriental: false, xp: false, magical: false, hacking: false, animal: false, simple: false, minecraft: false };
  }

  function normalizeThemeMidFillCustom(s) {
    var out = defaultThemeMidFillCustom();
    if (!s || !s.themeMidFillCustom || typeof s.themeMidFillCustom !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      if (s.themeMidFillCustom[key] === true) out[key] = true;
    });
    return out;
  }

  function isThemeMidFillCustomOn(s, theme) {
    var key = normalizeBubbleTheme(theme || (s && s.bubbleTheme));
    if (normalizeThemeMidFillCustom(s)[key]) return true;
    return !isThemeBoardFillDefault(s, theme);
  }

  function normalizeThemeChatBg(s) {
    var out = defaultThemeChatBg();
    if (!s || !s.themeChatBg || typeof s.themeChatBg !== "object") return out;
    THEME_CHAT_BG_KEYS.forEach(function (key) {
      if (s.themeChatBg[key] === true) out[key] = true;
    });
    return out;
  }

  function isThemeChatBgOn(s, theme) {
    var map = normalizeThemeChatBg(s);
    return !!map[normalizeBubbleTheme(theme || (s && s.bubbleTheme))];
  }

  function applyChatItemBgPanel(s, themeKey) {
    var on = isThemeChatBgOn(s, themeKey) && !s.gameMode;
    document.body.classList.toggle("chat-board-on", on);
    var container = document.getElementById("chat_container");
    if (container) {
      container.classList.toggle("chat-board-on", on);
      ensureMessagesStack(container);
    }
    applyBoardTitle(s, themeKey);
    applyOuterFillStyle(s, themeKey);
    applyMidLayerStyle(s, themeKey);
    applyBoardBorderStyle(s, themeKey);
    applyChatPanelSize(s);
  }

  function normalizeBubbleTheme(theme) {
    if (theme === "wolf") return "pastel";
    if (theme === "neon" || theme === "oriental" || theme === "xp" || theme === "magical" || theme === "hacking" || theme === "animal" || theme === "simple" || theme === "minecraft") return theme;
    return "pastel";
  }

  function applyBubbleThemeClass(theme) {
    var t = normalizeBubbleTheme(theme);
    document.body.classList.remove("bubble-theme-pastel", "bubble-theme-neon", "bubble-theme-oriental", "bubble-theme-xp", "bubble-theme-magical", "bubble-theme-hacking", "bubble-theme-animal", "bubble-theme-simple", "bubble-theme-minecraft");
    document.body.classList.add("bubble-theme-" + t);
  }

  function applyFontFamily(s, themeKey) {
    if (s.fontFamily === "custom" && s.customFontFamily) {
      document.documentElement.style.removeProperty("--custom-chat-font-primary");
      applyFontToChatNodes(String(s.customFontFamily).trim());
      return;
    }
    themeKey = themeKey || normalizeBubbleTheme(s.bubbleTheme);
    var key = getThemeFontFamily(s, themeKey);
    var family = FONT_PRIMARY[key] || "Mulmaru";
    var stack = fontStackForFamily(family);
    applyFontToChatNodes(stack);
    preloadOverlayFont(key).then(function () {
      if (document.fonts && document.fonts.load) {
        var quoted = stack.split(",")[0].trim();
        return Promise.all([
          document.fonts.load("300 16px " + quoted).catch(function () {}),
          document.fonts.load("500 16px " + quoted).catch(function () {}),
          document.fonts.load("16px " + quoted).catch(function () {})
        ]);
      }
    }).finally(function () {
      applyFontToChatNodes(stack);
    });
  }

  function clampChatHeight(value) {
    var n = Number(value);
    if (isNaN(n) || n <= 0) return 0;
    return Math.max(100, Math.min(2160, Math.round(n)));
  }

  var DEFAULT_BOARD_PANEL_HEIGHT = 1000;

  function resolvePanelHeight(s) {
    var h = clampChatHeight(s && s.chatHeight);
    if (h > 0) return h;
    // 배경판(채팅보드) ON 이면 높이 0도 고정 기본값 — 판이 채팅따라 늘어나지 않음
    if (s && isThemeChatBgOn(s, s.bubbleTheme) && !s.gameMode) return DEFAULT_BOARD_PANEL_HEIGHT;
    return 0;
  }

  function applyChatPanelSize(s) {
    var h = resolvePanelHeight(s);
    if (h > 0) {
      document.documentElement.style.setProperty("--custom-chat-panel-height", h + "px");
      document.documentElement.style.setProperty("--chat-board-messages-min-height", "0px");
    } else {
      document.documentElement.style.removeProperty("--custom-chat-panel-height");
      document.documentElement.style.setProperty("--chat-board-messages-min-height", "0px");
    }
  }

  function clampChatPanelWidth(value, fallback) {
    var n = Number(value);
    if (isNaN(n) || n <= 0) n = Number(fallback) || 640;
    return Math.max(200, Math.min(1920, Math.round(n)));
  }

  function clampBubbleMaxWidth(value, panelWidth, fallback) {
    var panel = clampChatPanelWidth(panelWidth, fallback);
    var n = Number(value);
    if (isNaN(n) || n <= 0) n = Number(fallback) || panel;
    return Math.max(200, Math.min(panel, Math.round(n)));
  }

  function resolveChatWidths(s, defaults) {
    var d = defaults || { chatWidth: 640, maxWidth: 640 };
    var legacy = Number(s && s.maxWidth) || d.maxWidth;
    var panel = clampChatPanelWidth(s && s.chatWidth != null ? s.chatWidth : legacy, d.chatWidth || legacy);
    var bubble = clampBubbleMaxWidth(s && s.maxWidth != null ? s.maxWidth : panel, panel, d.maxWidth || panel);
    return { panel: panel, bubble: bubble };
  }

  function applyChatWidthVars(target, widths) {
    if (!target || !widths) return;
    target.style.setProperty("--custom-chat-panel-width", widths.panel + "px");
    target.style.setProperty("--custom-chat-max-width", widths.bubble + "px");
  }

  function applySettingsObject(s) {
    if (!s || typeof s !== "object") return;
    var d = purpleBubbleDefaults();
    var themeKey = normalizeBubbleTheme(s.bubbleTheme);
    var themePreset = BUBBLE_THEMES[themeKey];
    document.documentElement.style.setProperty("--custom-chat-font-size", String(Number(s.fontSize) || d.fontSize) + "px");
    applyFontFamily(s, themeKey);
    document.documentElement.style.setProperty("--custom-chat-text-color", s.textColor || themePreset.textColor);
    document.documentElement.style.setProperty("--custom-chat-nick-color", getThemeNickColor(s, themeKey));
    document.documentElement.style.setProperty("--custom-chat-board-title-color", getThemeBoardTitleColor(s, themeKey));
    document.documentElement.style.setProperty("--custom-chat-board-title-font-size", getThemeBoardTitleFontSize(s, themeKey) + "px");
    document.documentElement.style.setProperty("--custom-chat-radius", String(s.borderRadius != null ? s.borderRadius : d.borderRadius) + "px");
    var widths = resolveChatWidths(s, d);
    applyChatWidthVars(document.documentElement, widths);
    applyChatPanelSize(s);
    MAX_HISTORY = Math.max(5, Math.min(50, Number(s.maxHistory) || d.maxHistory));

    applyBubbleThemeClass(themeKey);
    applyHackingTiltClasses(document.body, s.hackingTilt, themeKey === "hacking");

    var boxColor = s.boxBgColor || themePreset.boxBgColor;
    var boxAlpha = s.boxBgAlpha != null ? Number(s.boxBgAlpha) : (s.messageBg != null ? Number(s.messageBg) : themePreset.boxBgAlpha);
    document.documentElement.style.setProperty("--custom-chat-box-bg", rgbaFrom(boxColor, boxAlpha));

    var pageColor = s.pageBgColor || "#000000";
    var pageAlpha = s.pageBgAlpha != null ? Number(s.pageBgAlpha) : 0;
    if (!showUi) pageAlpha = 0;
    var pageBg = pageAlpha <= 0 ? "transparent" : rgbaFrom(pageColor, pageAlpha);
    document.documentElement.style.setProperty("--custom-chat-page-bg", pageBg);
    document.body.classList.toggle("has-page-bg", showUi && pageAlpha > 0);

    var borderColor = s.boxBorderColor || themePreset.boxBorderColor;
    var borderAlpha = s.boxBorderAlpha != null ? Number(s.boxBorderAlpha) : themePreset.boxBorderAlpha;
    document.documentElement.style.setProperty("--custom-chat-box-border", rgbaFrom(borderColor, borderAlpha));
    if (themeKey === "oriental") {
      setOrientalCornerVars(document.documentElement, borderColor, "", true);
    }
    if (themeKey === "xp") {
      applyXpThemeVars(document.documentElement, s, themeKey);
    }
    if (themeKey === "magical") {
      applyMagicalThemeVars(document.documentElement, {
        accent: borderColor,
        paw: s.pawColor || themePreset.pawColor,
        outline: s.textOutlineColor || themePreset.textOutlineColor,
        nick: getThemeNickColor(s, themeKey),
        outerBorder: getThemeOuterBorder(s, themeKey).color,
        outerFill: getThemeOuterFill(s, themeKey).color,
        boxBg: boxColor,
        text: s.textColor || themePreset.textColor
      });
      document.documentElement.style.removeProperty("--custom-chat-box-shadow");
    } else {
      clearMagicalThemeVars(document.documentElement);
      if (themeKey !== "animal") clearAnimalThemeVars(document.documentElement);
      document.documentElement.style.setProperty("--custom-chat-box-shadow", s.boxShadow || themePreset.boxShadow);
    }
    document.documentElement.style.setProperty("--custom-chat-paw-color", s.pawColor || themePreset.pawColor);
    applyTextOutline(s);
    hideCommands = s.hideCommands !== false;
    hideUrlStart = s.hideUrlStart !== false;
    hideStreamer = s.hideStreamer !== false;
    nickColors = s.nickColors === true;
    nickLayout = normalizeNickLayout(s);
    showNickname = nickLayout !== "hidden";
    noAnim = !!s.noAnim;
    document.body.classList.toggle("no-anim", noAnim);
    document.body.classList.toggle("game-mode", !!s.gameMode);
    document.body.classList.toggle("no-paw", s.showPaw === false);
    document.body.classList.toggle("chat-icon-heart", normalizeChatIconType(s.chatIconType) === "heart");
    document.body.classList.toggle("no-box-border", s.showBoxBorder === false);
    document.body.classList.toggle("chat-alternate", s.chatAlternate === true);
    activeSettings = s;
    activeThemeKey = themeKey;
    applyChatItemBgPanel(s, themeKey);
    refreshChatAlternateSides();
  }

  function purpleBubbleDefaults() {
    var t = BUBBLE_THEMES.pastel;
    return {
      fontFamily: t.fontFamily,
      fontSize: 30,
      pageBgColor: "#000000",
      pageBgAlpha: 0,
      bubbleTheme: "pastel",
      boxBgColor: t.boxBgColor,
      boxBgAlpha: t.boxBgAlpha,
      boxBorderColor: t.boxBorderColor,
      boxBorderAlpha: t.boxBorderAlpha,
      pawColor: t.pawColor,
      boxShadow: t.boxShadow,
      borderRadius: 24,
      textColor: t.textColor,
      nickColor: t.nickColor,
      maxHistory: 20,
      maxWidth: 640,
      chatWidth: 640,
      chatHeight: 1000,
      nickColors: false,
      nickLayout: "inline",
      showNickname: true,
      textOutlineEnabled: true,
      textOutlineStyle: t.textOutlineStyle,
      textOutlineColor: t.textOutlineColor,
      textOutlineWidth: t.textOutlineWidth,
      gameMode: false,
      showPaw: true,
      chatIconType: "paw",
      hackingTilt: "off",
      showBoxBorder: true,
      chatAlternate: false,
      hideCommands: true,
      hideUrlStart: true,
      hideStreamer: true,
      themeChatBg: defaultThemeChatBg(),
      themeBoardTitle: defaultThemeBoardTitle(),
      themeBoardTitleColor: defaultThemeBoardTitleColor(),
      themeBoardTitleFontSize: defaultThemeBoardTitleFontSize(),
      themeBoardFill: defaultThemeBoardFill(),
      themeOuterFill: defaultThemeOuterFill(),
      themeOuterFillCustom: defaultThemeOuterFillCustom(),
      themeOuterBorder: defaultThemeOuterBorder(),
      themeMidLayer: defaultThemeMidLayer(),
      themeMidFillCustom: defaultThemeMidFillCustom(),
      themeMidBorder: defaultThemeMidBorder(),
      themeNickColor: defaultThemeNickColor(),
      themeFontFamily: defaultThemeFontFamily(),
      boardThemeDefaultsVersion: 6
    };
  }

  function normalizeSettings(raw) {
    var d = purpleBubbleDefaults();
    if (!raw || typeof raw !== "object") return Object.assign({}, d);
    raw = migrateBoardThemeDefaults(raw);
    var out = Object.assign({}, d, raw);
    if (out.fontFamily === "kkukkukk" || out.fontFamily === "cute" || out.fontFamily === "onglip") out.fontFamily = "mulmaru";
    var themeKey = normalizeBubbleTheme(out.bubbleTheme);
    out.bubbleTheme = themeKey;
    var themePreset = BUBBLE_THEMES[themeKey];
    if (!raw.boxBgColor) {
      out.boxBgColor = themePreset.boxBgColor;
      out.boxBgAlpha = themePreset.boxBgAlpha;
      out.boxBorderColor = themePreset.boxBorderColor;
      out.boxBorderAlpha = themePreset.boxBorderAlpha;
      out.pawColor = themePreset.pawColor;
      out.boxShadow = themePreset.boxShadow;
      if (raw.borderRadius == null) out.borderRadius = themePreset.borderRadius;
    }
    if (!raw.textColor) out.textColor = themePreset.textColor;
    out.nickColor = getThemeNickColor(out, themeKey);
    out.nickLayout = normalizeNickLayout(out);
    out.showNickname = out.nickLayout !== "hidden";
    out.chatIconType = normalizeChatIconType(out.chatIconType);
    out.hackingTilt = normalizeHackingTilt(out.hackingTilt);
    out.chatAlternate = out.chatAlternate === true;
    out.hideCommands = out.hideCommands !== false;
    out.hideUrlStart = out.hideUrlStart !== false;
    out.hideStreamer = out.hideStreamer !== false;
    out.themeChatBg = normalizeThemeChatBg(out);
    out.themeBoardTitle = normalizeThemeBoardTitle(out);
    out.themeBoardTitleColor = normalizeThemeBoardTitleColor(out);
    out.themeBoardTitleFontSize = normalizeThemeBoardTitleFontSize(out);
    out.themeBoardFill = normalizeThemeBoardFill(out);
    out.themeOuterFill = normalizeThemeOuterFill(out);
    out.themeOuterFillCustom = normalizeThemeOuterFillCustom(out);
    out.themeOuterBorder = normalizeThemeOuterBorder(out);
    out.themeMidLayer = normalizeThemeMidLayer(out);
    out.themeMidFillCustom = normalizeThemeMidFillCustom(out);
    out.themeMidBorder = normalizeThemeMidBorder(out);
    out.themeNickColor = normalizeThemeNickColor(out);
    out.themeFontFamily = normalizeThemeFontFamily(out);
    out.fontFamily = getThemeFontFamily(out, themeKey);
    out.chatHeight = clampChatHeight(out.chatHeight);
    if (out.chatHeight <= 0 && isThemeChatBgOn(out, themeKey) && !out.gameMode) {
      out.chatHeight = DEFAULT_BOARD_PANEL_HEIGHT;
    }
    out.chatWidth = out.chatWidth != null ? Number(out.chatWidth) : (Number(out.maxWidth) || d.chatWidth);
    var widths = resolveChatWidths(out, d);
    out.chatWidth = widths.panel;
    out.maxWidth = widths.bubble;
    out.boardThemeDefaultsVersion = out.boardThemeDefaultsVersion != null ? Number(out.boardThemeDefaultsVersion) : 6;
    return syncThemeFillCustomFlags(out);
  }

  function parseSettingsHash() {
    var h = location.hash.replace(/^#/, "");
    if (!h) return null;
    var m = h.match(/(?:^|&)s=([^&]*)/);
    if (!m || !m[1]) return null;
    try {
      var b64 = decodeURIComponent(m[1]).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) {
      return null;
    }
  }

  function persistOverlaySettings(s) {
    try { localStorage.setItem(CUSTOM_CHAT_SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function loadAllSettings() {
    var fromHash = parseSettingsHash();
    if (fromHash) {
      var mergedHash = normalizeSettings(fromHash);
      applySettingsPayload(mergedHash);
      persistOverlaySettings(mergedHash);
      return;
    }
    try {
      var raw = localStorage.getItem(CUSTOM_CHAT_SETTINGS_KEY);
      if (!raw) {
        var defaults = normalizeSettings(purpleBubbleDefaults());
        applySettingsPayload(defaults);
        persistOverlaySettings(defaults);
        return;
      }
      var parsed = JSON.parse(raw);
      var merged = normalizeSettings(parsed);
      if (merged.textColor === "#f3ecff") {
        var legacyTp = BUBBLE_THEMES[merged.bubbleTheme] || BUBBLE_THEMES.pastel;
        merged.textColor = legacyTp.textColor;
        merged.nickColor = getThemeNickColor(merged, merged.bubbleTheme);
        merged.themeNickColor = normalizeThemeNickColor(Object.assign({}, merged, { nickColor: legacyTp.nickColor }));
        merged.textOutlineColor = legacyTp.textOutlineColor;
        merged.textOutlineWidth = legacyTp.textOutlineWidth;
      }
      applySettingsPayload(merged);
      var shouldPersist = !parsed.boxBgColor ||
        (parsed.boardThemeDefaultsVersion || 0) < 6 ||
        JSON.stringify(merged.themeOuterFill) !== JSON.stringify(parsed.themeOuterFill) ||
        JSON.stringify(merged.themeBoardFill) !== JSON.stringify(parsed.themeBoardFill) ||
        JSON.stringify(merged.themeOuterFillCustom) !== JSON.stringify(parsed.themeOuterFillCustom) ||
        JSON.stringify(merged.themeMidFillCustom) !== JSON.stringify(parsed.themeMidFillCustom);
      if (shouldPersist) {
        persistOverlaySettings(merged);
      }
    } catch (e) {
      var fallback = normalizeSettings(purpleBubbleDefaults());
      applySettingsPayload(fallback);
      persistOverlaySettings(fallback);
    }
  }

  function injectUiPreviewSamples() {
    if (!showUi) return;
    var b = document.getElementById("chat_container");
    if (!b || getChatShells(b).length > 0) return;
    renderChat("미리보기", "제공하신 말풍선 이미지 그대로", null, false, true);
    renderChat("채팅닉네임", "실제 채팅도 이렇게 표시됩니다", null, false, true);
  }

  function redrawChatFromHistory() {
    var b = document.getElementById("chat_container");
    if (!b) return;
    clearChatShells(b);
    for (var i = 0; i < chatHistory.length; i++) {
      var h = chatHistory[i];
      renderChat(h.nick, h.msg, h.ex, false, true, h);
    }
    trimChatShells(b);
    refreshBoardChrome();
    injectUiPreviewSamples();
  }

  function trimChatToMaxHistory() {
    if (chatHistory.length > MAX_HISTORY) chatHistory = chatHistory.slice(-MAX_HISTORY);
    var b = document.getElementById("chat_container");
    if (!b) return;
    trimChatShells(b);
    refreshBoardChrome();
    persistChatSession();
  }

  function migrateChatStorage() {
    try {
      if (localStorage.getItem(CHAT_SESSION_KEY)) return;
      var legacy = sessionStorage.getItem(CHAT_SESSION_KEY);
      if (legacy) {
        localStorage.setItem(CHAT_SESSION_KEY, legacy);
        sessionStorage.removeItem(CHAT_SESSION_KEY);
      }
    } catch (e) {}
  }

  function persistChatSession() {
    try {
      localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(chatHistory.slice(-MAX_HISTORY)));
    } catch (e) {}
  }

  function restoreChatSession() {
    if (previewOnly) return false;
    migrateChatStorage();
    try {
      var raw = localStorage.getItem(CHAT_SESSION_KEY);
      if (!raw) return false;
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return false;
      chatHistory = scrubHistoryList(list).slice(-MAX_HISTORY);
      for (var ri = 0; ri < chatHistory.length; ri++) {
        if (!chatHistory[ri].seq) chatHistory[ri] = normalizeHistoryEntry(chatHistory[ri], ri + 1);
      }
      syncChatSeqFromHistory();
      redrawChatFromHistory();
      if (chatHistory.length > 0) markChatLive();
      return true;
    } catch (e) {
      return false;
    }
  }

  window.addEventListener("pagehide", persistChatSession);

  function applySettingsPayload(raw) {
    var merged = normalizeSettings(raw || {});
    var prevNickLayout = nickLayout;
    var prevNickColors = nickColors;
    var prevHideCommands = hideCommands;
    var prevHideUrlStart = hideUrlStart;
    var prevHideStreamer = hideStreamer;
    applySettingsObject(merged);
    applyTextOutline(merged);
    trimChatToMaxHistory();
    var hideChanged =
      prevHideCommands !== hideCommands ||
      prevHideUrlStart !== hideUrlStart ||
      prevHideStreamer !== hideStreamer;
    if (prevNickLayout !== nickLayout || prevNickColors !== nickColors || hideChanged) {
      redrawChatFromHistory();
    }
  }

  loadAllSettings();
  window.addEventListener("storage", function (e) {
    if (e.key !== CUSTOM_CHAT_SETTINGS_KEY || !e.newValue) return;
    try { applySettingsPayload(JSON.parse(e.newValue)); } catch (err) {}
  });
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "rabbibot-custom-chat-settings") return;
    if (e.origin !== location.origin) return;
    var merged = normalizeSettings(e.data.settings);
    applySettingsPayload(merged);
    persistOverlaySettings(merged);
  });
  if (window.parent !== window) {
    try { window.parent.postMessage({ type: "rabbibot-custom-chat-ready" }, location.origin); } catch (e) {}
  }

  if (isFileProtocol) {
    var el = document.getElementById("chat_container");
    if (el) el.innerHTML = '<div class="file-protocol-notice"><strong>file:// 로는 동작하지 않습니다.</strong><br><br><code>node serve.js</code> 실행 후 <code>http://127.0.0.1:5600/custom-chat-overlay.html</code> 을 OBS에 넣으세요.</div>';
  }

  var NICK_COLORS = [
    "#FFD700", "#00CED1", "#FF69B4", "#7B68EE", "#32CD32",
    "#FF6347", "#20B2AA", "#FF1493", "#9370DB", "#00FA9A",
    "#FF8C00", "#1E90FF", "#DC143C", "#00BFFF", "#FFB6C1",
    "#98FB98", "#DDA0DD", "#F0E68C", "#87CEEB", "#D2691E",
    "#B22222", "#2E8B57", "#6A5ACD", "#CD853F", "#4682B4"
  ];

  function nickToColor(nick) {
    var h = 0;
    for (var i = 0; i < nick.length; i++) h = ((h << 5) - h) + nick.charCodeAt(i) | 0;
    return NICK_COLORS[Math.abs(h) % NICK_COLORS.length];
  }

  function escapeAttr(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeHtmlText(s) {
    return escapeAttr(s).replace(/'/g, "&#39;");
  }

  function hasRenderableHtml(html) {
    var s = String(html || "");
    if (s.replace(/\s+/g, "").length > 0) return true;
    return /<img\b/i.test(s);
  }

  function firstExtrasEmojiId(emojis) {
    if (!emojis || typeof emojis !== "object") return "";
    for (var k in emojis) {
      if (Object.prototype.hasOwnProperty.call(emojis, k) && emojis[k]) return k;
    }
    return "";
  }

  function normalizeChatMessageText(msg, emojis) {
    var s = String(msg == null ? "" : msg);
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (s.indexOf("\uFFFC") >= 0) {
      var emojiId = firstExtrasEmojiId(emojis);
      s = s.replace(/\uFFFC/g, emojiId ? "{:" + emojiId + ":}" : "ㅋ");
    }
    return s.trim();
  }

  function renderExtrasEmojiStrip(emojis) {
    if (!emojis || typeof emojis !== "object") return "";
    var html = "";
    for (var id in emojis) {
      if (!Object.prototype.hasOwnProperty.call(emojis, id)) continue;
      var url = emojis[id];
      if (!url || typeof url !== "string") continue;
      var img = buildEmoteImg(url, id);
      if (img) html += img;
    }
    return html;
  }

  var emojiUrlById = {};

  function emojiKeyVariants(name) {
    var base = String(name || "").replace(/^:+|:+$/g, "").replace(/^\{|\}$/g, "");
    if (!base) return [];
    return ["{:" + base + ":}", ":" + base + ":"];
  }

  function cleanupEmojiDelimiters(html) {
    return String(html || "")
      .replace(/\{:\s*(<img\b[^>]*>)\s*:\}/gi, "$1")
      .replace(/\{:\s*(<img\b[^>]*>)/gi, "$1")
      .replace(/(<img\b[^>]*>)\s*:\}/gi, "$1");
  }

  function replaceAll(html, needle, replacement) {
    if (!needle || html.indexOf(needle) < 0) return html;
    return html.split(needle).join(replacement);
  }

  function normalizeEmojiUrl(url) {
    if (!url || typeof url !== "string") return "";
    var u = url.trim();
    if (u.indexOf("//") === 0) u = "https:" + u;
    return u;
  }

  function emojiProxyUrl(url) {
    var u = normalizeEmojiUrl(url);
    if (!u) return "";
    // 구독·타 채널 이모티콘은 CDN 직접 로드 (Worker 프록시 시 404)
    if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return "";
    if (ChzzkConfig.getProxyBase) return ChzzkConfig.getProxyBase() + encodeURIComponent(u);
    return location.origin + "/proxy?url=" + encodeURIComponent(u);
  }

  function buildEmoteImg(url, alt) {
    var direct = normalizeEmojiUrl(url);
    if (!direct) return "";
    var proxied = emojiProxyUrl(direct);
    var initial = proxied || direct;
    var fallback = proxied && proxied !== direct ? direct : "";
    var onerr = fallback
      ? "if(this.dataset.fallback&&!this.dataset.tried){this.dataset.tried='1';this.src=this.dataset.fallback}else{this.style.visibility='hidden'}"
      : "this.style.visibility='hidden'";
    return '<img src="' + escapeAttr(initial) + '" data-fallback="' + escapeAttr(fallback) + '" class="chat-emote" alt="' + escapeAttr(alt || "") + '" referrerpolicy="no-referrer" loading="lazy" onerror="' + onerr + '">';
  }

  function registerEmojiFromApi(em) {
    if (!em || typeof em !== "object") return;
    var id = em.emojiId || em.id || em.emoticonId || em.subscriptionEmoticonId;
    var url = em.animatedImageUrl || em.imageUrl || em.url || em.staticImageUrl;
    if (id && url) emojiUrlById[id] = normalizeEmojiUrl(url);
  }

  function mergeEmojiCache(emojis) {
    if (!emojis || typeof emojis !== "object") return;
    for (var k in emojis) {
      if (!Object.prototype.hasOwnProperty.call(emojis, k)) continue;
      var u = emojis[k];
      if (u && typeof u === "string") emojiUrlById[k] = normalizeEmojiUrl(u);
    }
  }

  function legacyBuiltinEmoteUrl(id) {
    var m = String(id || "").match(/^b_(\d+)$/);
    if (m) {
      var padded = m[1].length === 1 ? "0" + m[1] : m[1];
      return "https://ssl.pstatic.net/static/nng/glive/icon/b_" + padded + ".gif";
    }
    m = String(id || "").match(/^d_(\d+)$/);
    if (m) {
      var dNum = Number(m[1]);
      if (dNum >= 1 && dNum <= 40) {
        var dPad = m[1].length === 1 ? "0" + m[1] : m[1];
        return "https://ssl.pstatic.net/static/nng/glive/icon/cha" + dPad + ".png";
      }
    }
    return "";
  }

  function resolveEmojiUrl(id, emojis) {
    if (emojis && emojis[id]) return normalizeEmojiUrl(emojis[id]);
    if (emojiUrlById[id]) return emojiUrlById[id];
    return legacyBuiltinEmoteUrl(id);
  }

  function replaceEmojiById(html, id, img, emojis) {
    if (!img) img = resolveEmojiUrl(id, emojis) ? buildEmoteImg(resolveEmojiUrl(id, emojis), id) : null;
    if (!img) return html;
    emojiKeyVariants(id).forEach(function (key) {
      html = replaceAll(html, key, img);
    });
    return html;
  }

  function ingestEmojiApiPayload(data) {
    if (!data || typeof data !== "object") return;
    var content = data.content;
    if (!content || typeof content !== "object") return;
    var packs = content.emojiPacks || content.emoticonPacks || content.subscriptionEmoticonPacks;
    if (Array.isArray(packs)) {
      packs.forEach(function (pack) {
        if (!pack) return;
        var list = pack.emojis || pack.emoticons || pack.subscriptionEmoticons || pack.items;
        if (Array.isArray(list)) list.forEach(registerEmojiFromApi);
      });
    }
    var flat = content.emojis || content.emoticons || content.subscriptionEmoticons;
    if (Array.isArray(flat)) flat.forEach(registerEmojiFromApi);
  }

  async function loadEmojiPacks() {
    var bases = [
      "https://api.chzzk.naver.com/service/v1/channels/" + channelId() + "/emoji-packs",
      "https://api.chzzk.naver.com/service/v1/channels/" + channelId() + "/subscription-emoticons",
      "https://api.chzzk.naver.com/service/v1/channels/" + channelId() + "/subscription-emoticon-packs"
    ];
    for (var i = 0; i < bases.length; i++) {
      try {
        var data = await chzzkFetch(bases[i] + "?_t=" + Date.now());
        ingestEmojiApiPayload(data);
      } catch (e) {}
    }
  }

  function parseExtrasEmojis(ex) {
    if (!ex) return null;
    var parsed = ex;
    if (typeof ex === "string") {
      try { parsed = JSON.parse(ex); } catch (err) { return null; }
    }
    if (!parsed || typeof parsed !== "object") return null;
    var e = parsed.emojis;
    if (e === "" || e == null) return null;
    if (typeof e === "string") {
      try { e = JSON.parse(e); } catch (err) { return null; }
    }
    if (!e || typeof e !== "object") return null;
    mergeEmojiCache(e);
    return e;
  }

  function applyEmojisToHtml(html, emojis) {
    html = String(html || "");
    if (emojis) {
      for (var n in emojis) {
        if (!Object.prototype.hasOwnProperty.call(emojis, n)) continue;
        var u = emojis[n];
        if (!u || typeof u !== "string") continue;
        html = replaceEmojiById(html, n, buildEmoteImg(u, n), emojis);
      }
    }
    html = html.replace(/\{:([^:{}]+):\}/g, function (token, id) {
      if (token.indexOf("<img") >= 0) return token;
      var url = resolveEmojiUrl(id, emojis);
      return url ? buildEmoteImg(url, id) : token;
    });
    html = html.replace(/:([^:\s]+):/g, function (token, id) {
      if (token.indexOf("<img") >= 0) return token;
      var url = resolveEmojiUrl(id, emojis);
      return url ? buildEmoteImg(url, id) : token;
    });
    return cleanupEmojiDelimiters(html);
  }

  // 특정 단어를 치면 채팅창에 이미지가 뜨게 하는 커스텀 트리거.
  // 이미지 파일: image/<단어>.png 로 추가하면 자동 인식됨. 기본값은 비활성화.
  var CUSTOM_TRIGGER_WORDS = [];

  function customTriggerImgSrc(word) {
    return "/image/" + encodeURIComponent(word) + ".png";
  }

  function customTriggerImg(word) {
    var src = customTriggerImgSrc(word);
    return '<img src="' + escapeAttr(src) + '" class="chat-custom-trigger-img" alt="' + escapeAttr(word) + '" loading="lazy" onerror="this.style.display=\'none\'">';
  }

  function applyCustomTriggerImages(text) {
    var out = String(text || "");
    for (var i = 0; i < CUSTOM_TRIGGER_WORDS.length; i++) {
      var word = CUSTOM_TRIGGER_WORDS[i];
      if (out.indexOf(word) < 0) continue;
      out = replaceAll(out, word, customTriggerImg(word));
    }
    return out;
  }

  // 같은 트리거 단어를 연타(어흐어흐어흐...)해서 이미지가 여러 개 붙으면
  // 채팅 박스의 text-align(가운데 정렬 등) 때문에 줄마다 따로 중앙정렬되어
  // 삐뚤빼뚤해 보임 — 연속된 트리거 이미지들을 하나의 flex 그리드로 묶어서
  // 항상 나란히 줄맞춤되게 함.
  var TRIGGER_IMG_RUN_RE = /(?:<img[^>]*class="chat-custom-trigger-img"[^>]*>\s*){2,}/g;
  var TRIGGER_IMG_TAG_RE = /<img[^>]*class="chat-custom-trigger-img"[^>]*>/g;

  function wrapCustomTriggerImageRuns(html) {
    return String(html || "").replace(TRIGGER_IMG_RUN_RE, function (run) {
      var imgs = run.match(TRIGGER_IMG_TAG_RE) || [];
      if (imgs.length < 2) return run;
      return '<span class="chat-trigger-img-grid">' + imgs.join("") + "</span>";
    });
  }

  function buildMessageHtml(msg, ex) {
    var raw = String(msg == null ? "" : msg);
    var emojis = parseExtrasEmojis(ex);
    var normalized = normalizeChatMessageText(raw, emojis);
    var displayMsg = stripChatUrls(normalized);
    displayMsg = applyCustomTriggerImages(displayMsg);
    displayMsg = wrapCustomTriggerImageRuns(displayMsg);
    var html = applyEmojisToHtml(displayMsg, emojis);

    if (!hasRenderableHtml(html) && displayMsg !== normalized) {
      html = applyEmojisToHtml(normalized, emojis);
    }
    if (!hasRenderableHtml(html) && raw.trim()) {
      html = applyEmojisToHtml(normalizeChatMessageText(raw, emojis), emojis);
    }
    if (!hasRenderableHtml(html) && hasRenderableExtras(ex)) {
      html = renderExtrasEmojiStrip(emojis);
    }
    if (!hasRenderableHtml(html) && displayMsg) {
      html = escapeHtmlText(displayMsg);
    }
    if (!hasRenderableHtml(html) && normalized) {
      html = escapeHtmlText(normalized);
    }
    if (!hasRenderableHtml(html) && raw.length > 0) {
      html = '<span class="chat-message-fallback">\u00B7</span>';
    }
    return html;
  }

  function payloadMessage(c) {
    if (!c || typeof c !== "object") return "";
    if (c.msg != null && c.msg !== "") return c.msg;
    if (c.content != null && c.content !== "") return c.content;
    if (c.message != null && c.message !== "") return c.message;
    return c.msg != null ? c.msg : "";
  }

  function stripChatUrls(text) {
    return String(text || "")
      .replace(/https?:\/\/[^\s<>"']+/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function hasRenderableExtras(ex) {
    var emojis = parseExtrasEmojis(ex);
    if (!emojis) return false;
    for (var k in emojis) {
      if (Object.prototype.hasOwnProperty.call(emojis, k)) return true;
    }
    return false;
  }

  function isHiddenChatMessage(msg, ex) {
    var emojis = parseExtrasEmojis(ex);
    var m = normalizeChatMessageText(msg, emojis);
    if (!m) return !hasRenderableExtras(ex);
    if (hideCommands && m.charAt(0) === "!") return true;
    if (hideUrlStart && /^https?:\/\//i.test(m)) return true;
    return false;
  }

  function normalizeNick(nick) {
    return String(nick || "").replace(/\s+/g, "").trim();
  }

  var STREAMER_NICKS = { "래비": 1, "래비bot": 1, "rabbi": 1 };
  ["래 비", "래비", "Rabbi", "래비봇"].forEach(function (n) {
    STREAMER_NICKS[n] = 1;
    STREAMER_NICKS[normalizeNick(n)] = 1;
  });

  function isStreamerNick(nick) {
    var n = String(nick || "");
    if (!n) return false;
    if (STREAMER_NICKS[n] || STREAMER_NICKS[normalizeNick(n)]) return true;
    return normalizeNick(n) === "래비";
  }

  function isStreamerProfile(profile) {
    if (!profile || typeof profile !== "object") return false;
    var role = String(profile.userRoleCode || profile.roleCode || "").toLowerCase();
    if (role === "streamer" || role === "channel_owner" || role === "owner" || role === "broadcaster") return true;
    if (profile.streamingChannelId && profile.streamingChannelId === channelId()) return true;
    if (profile.channelId && profile.channelId === channelId()) return true;
    return isStreamerNick(profile.nickname);
  }

  function isStreamerMessage(profile, nick) {
    return isStreamerProfile(profile) || isStreamerNick(nick);
  }

  function scrubHistoryList(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (h) {
      if (!h) return false;
      if (hideStreamer && isStreamerMessage(null, h.nick)) return false;
      if (isHiddenChatMessage(h.msg, h.ex)) return false;
      return true;
    });
  }

  function renderChat(nick, msg, ex, isS, skipSave, historyRef) {
    if (hideStreamer && isStreamerMessage(isS ? { userRoleCode: "streamer", nickname: nick } : null, nick)) return;
    if (isHiddenChatMessage(msg, ex)) return;
    var emojis = parseExtrasEmojis(ex);
    var normalized = normalizeChatMessageText(msg, emojis);
    var displayMsg = stripChatUrls(normalized);
    if (!displayMsg && !hasRenderableExtras(ex) && !String(msg == null ? "" : msg).length) return;

    var html = buildMessageHtml(msg, ex);
    if (!hasRenderableHtml(html)) return;
    var b = document.getElementById("chat_container");
    if (!b) return;
    var stack = ensureMessagesStack(b);
    if (!stack) return;
    var shell = document.createElement("div");
    shell.className = "chat-item-shell";
    var i = document.createElement("div");
    i.className = "chat-item";
    var content = document.createElement("span");
    content.className = "chat-content";
    if (nickLayout === "above") {
      content.classList.add("chat-content--nick-above");
      i.classList.add("chat-item--nick-above");
    }
    if (nickLayout !== "hidden") {
      var nickSpan = document.createElement("span");
      nickSpan.className = "chat-nickname";
      nickSpan.textContent = nick;
      if (nickColors) nickSpan.style.color = nickToColor(nick);
      content.appendChild(nickSpan);
      if (nickLayout === "inline") {
        content.appendChild(document.createTextNode(": "));
      }
    }
    var msgSpan = document.createElement("span");
    msgSpan.className = "chat-message-text";
    msgSpan.innerHTML = html;
    content.appendChild(msgSpan);
    i.appendChild(content);
    shell.appendChild(i);
    stack.appendChild(shell);
    applyChatAlternateSideToShell(shell, historyRef || { nick: nick, msg: msg, ex: ex, msgTime: Date.now() });
    if (activeFontStack) shell.style.setProperty("font-family", activeFontStack, "important");
    trimChatShells(b);
  }

  function mergeChatLists(a, b) {
    var seen = {};
    var out = [];
    function add(list) {
      if (!Array.isArray(list)) return;
      for (var i = 0; i < list.length; i++) {
        var raw = list[i];
        if (!raw) continue;
        var h = Number(raw.seq) > 0 ? raw : normalizeHistoryEntry(raw, msgTimeFromPayload(raw, i));
        var key = historyEntryKey(h);
        if (seen[key]) continue;
        seen[key] = true;
        out.push(h);
      }
    }
    add(a || []);
    add(b || []);
    out.sort(function (x, y) {
      var dt = (Number(x.msgTime) || 0) - (Number(y.msgTime) || 0);
      if (dt !== 0) return dt;
      return (Number(x.seq) || 0) - (Number(y.seq) || 0);
    });
    return out.slice(-MAX_HISTORY);
  }

  var wsHosts = ["wss://kr-ss3.chat.naver.com/chat", "wss://kr-ss1.chat.naver.com/chat"];
  var wsHostIndex = 0;
  var connecting = false;
  var connectingSince = 0;
  var CONNECT_STALE_MS = 25000;
  var WS_AUTH_TIMEOUT_MS = 15000;
  var RECONNECT_DELAY = 3000;
  var currentWs = null;
  var currentPingTimer = null;
  var refreshTimerId = null;
  var takeoverInProgress = false;
  var REFRESH_INTERVAL_MS = 12 * 60 * 1000;
  var LIVE_STATUS_POLL_MS = 20000;
  var lastChatAt = 0;
  var currentWsSid = null;
  var currentWsCid = null;
  var chatSeq = 0;
  var liveStatusPollTimerId = null;
  var liveStatusChecking = false;
  var knownLiveChatChannelId = null;
  var knownLiveStatus = null;

  function parseChatProfile(c) {
    var p = null;
    try { p = JSON.parse(c.profile); } catch (err) {}
    if (p && !p.nickname && payloadMessage(c) !== "") p.nickname = "?";
    if (!p && c && payloadMessage(c) !== "") p = { nickname: "?" };
    return p;
  }

  function chatItemKey(nick, msg) {
    return (nick || "") + "\n" + (msg || "");
  }

  function nextChatSeq() {
    chatSeq += 1;
    return chatSeq;
  }

  function syncChatSeqFromHistory() {
    for (var i = 0; i < chatHistory.length; i++) {
      var s = Number(chatHistory[i] && chatHistory[i].seq);
      if (!isNaN(s) && s > chatSeq) chatSeq = s;
    }
  }

  function normalizeChatPayloadItems(bdy) {
    if (Array.isArray(bdy)) return bdy;
    if (bdy && Array.isArray(bdy.messageList)) return bdy.messageList;
    if (bdy && Array.isArray(bdy.messages)) return bdy.messages;
    if (bdy && Array.isArray(bdy.chatList)) return bdy.chatList;
    if (bdy && Array.isArray(bdy.list)) return bdy.list;
    if (bdy && typeof bdy === "object" && (bdy.msg != null || bdy.profile)) return [bdy];
    return [];
  }

  function msgIdFromPayload(c) {
    if (!c || typeof c !== "object") return "";
    var id = c.msgId != null ? c.msgId
      : (c.messageId != null ? c.messageId
      : (c.chatId != null ? c.chatId : c.id));
    return id != null && id !== "" ? String(id) : "";
  }

  function historyEntryKey(h) {
    if (!h) return "";
    if (h.msgId) return "id:" + h.msgId;
    if (Number(h.seq) > 0) return "seq:" + h.seq;
    return String(h.msgTime || 0) + "\u0001" + (h.nick || "") + "\u0001" + (h.msg || "") + "\u0001" + String(h.ex || "");
  }

  function chatAlternateSideForKey(key) {
    var h = 0;
    var s = String(key || "");
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    var n = Math.abs(h);
    var mix = (n ^ (n >>> 11) ^ (n * 2654435761)) >>> 0;
    return (mix % 100) < 50 ? "left" : "right";
  }

  function applyChatAlternateSideToShell(shell, historyRef) {
    if (!shell) return;
    if (!document.body.classList.contains("chat-alternate")) {
      shell.classList.remove("chat-side-left", "chat-side-right");
      return;
    }
    var side = chatAlternateSideForKey(historyEntryKey(historyRef));
    shell.classList.remove("chat-side-left", "chat-side-right");
    shell.classList.add(side === "right" ? "chat-side-right" : "chat-side-left");
  }

  function refreshChatAlternateSides() {
    var b = document.getElementById("chat_container");
    if (!b) return;
    var shells = getChatShells(b);
    for (var i = 0; i < shells.length; i++) {
      applyChatAlternateSideToShell(shells[i], chatHistory[i] || { seq: "ui-" + i });
    }
  }

  function msgTimeFromPayload(c, index) {
    if (!c || typeof c !== "object") return Date.now() + (index || 0);
    var t = c.msgTime != null ? Number(c.msgTime)
      : (c.time != null ? Number(c.time)
      : (c.createTime != null ? Number(c.createTime)
      : (c.sendTime != null ? Number(c.sendTime) : NaN)));
    if (!isNaN(t) && t > 0) return t;
    return Date.now() + (index || 0);
  }

  function normalizeHistoryEntry(h, fallbackTime) {
    return {
      nick: h.nick,
      msg: h.msg || "",
      ex: h.ex || null,
      msgTime: Number(h.msgTime) > 0 ? Number(h.msgTime) : (fallbackTime || Date.now()),
      msgId: h.msgId ? String(h.msgId) : "",
      seq: h.seq || nextChatSeq()
    };
  }

  function isDuplicateInHistory(nick, msg, msgTime, msgId) {
    if (!msgId) return false;
    for (var i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].msgId && chatHistory[i].msgId === msgId) return true;
    }
    return false;
  }

  function buildHistoryEntryFromPayload(c, index) {
    var p = parseChatProfile(c);
    if (!p) return null;
    var nick = p.nickname;
    if (hideStreamer && isStreamerMessage(p, nick)) return null;
    var chatMsg = payloadMessage(c);
    if (isHiddenChatMessage(chatMsg, c.extras)) return null;
    parseExtrasEmojis(c.extras);
    return normalizeHistoryEntry({
      nick: nick,
      msg: chatMsg || "",
      ex: c.extras || null,
      msgTime: msgTimeFromPayload(c, index),
      msgId: msgIdFromPayload(c)
    });
  }

  function requestRecentChat(ws, cid, sid) {
    if (!ws || ws.readyState !== 1 || !cid || !sid) return;
    try {
      ws.send(JSON.stringify({
        ver: "2", cmd: 5101, svcid: "game", cid: cid, tid: 2, sid: sid,
        bdy: { recentMessageCount: Math.max(MAX_HISTORY, 50) }
      }));
    } catch (err) {}
  }

  function applyRecentChatBatch(items) {
    items = normalizeChatPayloadItems(items);
    if (items.length === 0) return;
    var batch = [];
    for (var i = 0; i < items.length; i++) {
      var entry = buildHistoryEntryFromPayload(items[i], i);
      if (entry) batch.push(entry);
    }
    if (batch.length === 0) return;
    chatHistory = scrubHistoryList(mergeChatLists(chatHistory, batch)).slice(-MAX_HISTORY);
    syncChatSeqFromHistory();
    redrawChatFromHistory();
    if (chatHistory.length > 0) markChatLive();
    persistChatSession();
  }

  function handleChatPayload(items, fromRecent) {
    items = normalizeChatPayloadItems(items);
    if (items.length === 0) return;
    if (fromRecent) {
      applyRecentChatBatch(items);
      return;
    }
    items.forEach(function (c, index) {
      var p = parseChatProfile(c);
      if (p) enqueueChat(p, payloadMessage(c), c.extras, msgTimeFromPayload(c, index), msgIdFromPayload(c));
    });
  }

  function markChatLive() {
    lastChatAt = Date.now();
    setConnBadge("● 실시간 수신 중", "ok");
  }

  function enqueueChat(profile, msg, extras, msgTime, msgId) {
    var nickname = profile && profile.nickname;
    if (nickname === undefined || nickname === null) return;
    if (hideStreamer && isStreamerMessage(profile, nickname)) return;
    if (isHiddenChatMessage(msg, extras)) return;
    var when = Number(msgTime) > 0 ? Number(msgTime) : Date.now();
    if (isDuplicateInHistory(nickname, msg, when, msgId)) return;
    chatHistory.push(normalizeHistoryEntry({
      nick: nickname,
      msg: msg || "",
      ex: extras || null,
      msgTime: when,
      msgId: msgId || ""
    }));
    if (chatHistory.length > MAX_HISTORY) chatHistory.shift();
    var entry = chatHistory[chatHistory.length - 1];
    renderChat(nickname, msg, extras, isStreamerProfile(profile), true, entry);
    markChatLive();
    persistChatSession();
  }

  function notifyParentConn(text, ok, err) {
    if (window.parent === window) return;
    try {
      window.parent.postMessage({
        type: "rabbibot-custom-chat-conn",
        text: text || "",
        ok: !!ok,
        err: !!err
      }, location.origin);
    } catch (e) {}
  }

  function setConnBadge(text, kind) {
    var b = document.getElementById("conn_badge");
    if (!b) return;
    b.textContent = text;
    b.className = kind || "wait";
    if (showUi) notifyParentConn(text, kind === "ok", kind === "err");
  }

  function setStatus(text, isError) {
    var el = document.getElementById("chat_status");
    if (!el) return;
    el.textContent = text;
    el.className = "chat-status" + (isError ? " chat-status--error" : "");
    if (isError && text) {
      setConnBadge(text.slice(0, 48), "err");
    } else if (showUi && text) {
      notifyParentConn(text, false, true);
    }
  }

  function scheduleRefresh() {
    if (refreshTimerId) clearTimeout(refreshTimerId);
    refreshTimerId = setTimeout(function () {
      refreshTimerId = null;
      if (currentWs && currentWs.readyState === 1) {
        scheduleRefresh();
        return;
      }
      connect(true);
    }, REFRESH_INTERVAL_MS);
  }

  function updateKnownLiveSnapshot(content) {
    if (!content) return;
    knownLiveChatChannelId = content.chatChannelId != null ? String(content.chatChannelId) : null;
    knownLiveStatus = content.status != null ? String(content.status) : null;
  }

  async function fetchLiveStatusContent() {
    var url = "https://api.chzzk.naver.com/polling/v2/channels/" + channelId() + "/live-status?_t=" + Date.now();
    var s = await chzzkFetch(url);
    return s && s.content ? s.content : null;
  }

  function shouldReconnectForLiveStatus(content) {
    if (!content) return false;
    var cid = content.chatChannelId != null ? String(content.chatChannelId) : "";
    if (!cid) return false;
    if (currentWs && currentWs.readyState === 1 && currentWsCid && cid !== currentWsCid) return true;
    if (knownLiveChatChannelId != null && cid !== knownLiveChatChannelId) return true;
    var st = content.status != null ? String(content.status) : "";
    if (knownLiveStatus != null && st && st !== knownLiveStatus) return true;
    return false;
  }

  function forceLiveReconnect() {
    if (connecting) return;
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
      refreshTimerId = null;
    }
    if (currentWs) {
      if (currentPingTimer) clearInterval(currentPingTimer);
      currentPingTimer = null;
      var ws = currentWs;
      currentWs = null;
      currentWsCid = null;
      currentWsSid = null;
      takeoverInProgress = true;
      try { ws.close(); } catch (err) {}
    }
    connect(true);
  }

  async function pollLiveStatus() {
    if (liveStatusChecking || connecting) return;
    liveStatusChecking = true;
    try {
      var content = await fetchLiveStatusContent();
      if (!content) return;
      if (shouldReconnectForLiveStatus(content)) {
        updateKnownLiveSnapshot(content);
        forceLiveReconnect();
        return;
      }
      updateKnownLiveSnapshot(content);
    } catch (err) {}
    finally {
      liveStatusChecking = false;
    }
  }

  function startLiveStatusPolling() {
    if (liveStatusPollTimerId) clearInterval(liveStatusPollTimerId);
    liveStatusPollTimerId = setInterval(function () {
      pollLiveStatus().catch(function () {});
    }, LIVE_STATUS_POLL_MS);
  }

  async function connect(isTakeover) {
    if (!isTakeover && connecting) {
      if (Date.now() - connectingSince < CONNECT_STALE_MS) return;
      connecting = false;
      if (currentWs) {
        try { currentWs.close(); } catch (staleErr) {}
        currentWs = null;
      }
    }
    if (isTakeover && refreshTimerId) clearTimeout(refreshTimerId);
    connecting = true;
    connectingSince = Date.now();
    var wsAuthTimer = null;
    try {
      if (!channelId()) {
        throw new Error("치지직 채널이 설정되지 않았습니다. 홈에서 방송 URL을 저장하거나 ?channel=채널ID 를 URL에 추가해 주세요.");
      }
      if (!isTakeover) {
        setStatus("연결 중…", false);
        setConnBadge("연결 중…", "wait");
      }
      var cid;
      if (global.ChzzkLiveStatus && global.ChzzkLiveStatus.resolveChatChannelId) {
        cid = await global.ChzzkLiveStatus.resolveChatChannelId();
        try {
          var liveSnap = await (global.ChzzkLiveStatus.fetchLiveStatusContent
            ? global.ChzzkLiveStatus.fetchLiveStatusContent()
            : fetchLiveStatusContent());
          updateKnownLiveSnapshot(liveSnap);
        } catch (snapErr) {}
      } else {
        var liveContent = await fetchLiveStatusContent();
        updateKnownLiveSnapshot(liveContent);
        cid = liveContent && liveContent.chatChannelId;
        if (!cid) throw new Error("chatChannelId 없음 — 채널 채팅이 열려 있는지 확인해 주세요");
      }

      var url2 = "https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=" + cid + "&chatType=STREAMING&_t=" + Date.now();
      var t = await chzzkFetch(url2);
      var accTkn = t && t.content && (t.content.accessToken || t.content.extraToken);
      if (!accTkn) {
        connecting = false;
        if (isTakeover) scheduleRefresh();
        else {
          setStatus("토큰 없음. " + (RECONNECT_DELAY / 1000) + "초 후 재시도.", true);
          setTimeout(connect, RECONNECT_DELAY);
        }
        return;
      }

      var ws = new WebSocket(wsHosts[wsHostIndex % wsHosts.length]);
      wsHostIndex += 1;
      var pingTimer;

      function clearWsAuthTimer() {
        if (wsAuthTimer) clearTimeout(wsAuthTimer);
        wsAuthTimer = null;
      }

      wsAuthTimer = setTimeout(function () {
        if (currentWs === ws && connecting) {
          clearWsAuthTimer();
          connecting = false;
          try { ws.close(); } catch (authErr) {}
          setStatus("채팅 인증 시간 초과 · 재연결 중…", true);
          setTimeout(connect, RECONNECT_DELAY);
        }
      }, WS_AUTH_TIMEOUT_MS);

      ws.onopen = function () {
        ws.send(JSON.stringify({
          ver: "2", cmd: 100, svcid: "game", cid: cid, tid: 1,
          bdy: { uid: null, devType: 2001, accTkn: accTkn, auth: "READ" }
        }));
        pingTimer = setInterval(function () {
          if (ws.readyState === 1) ws.send(JSON.stringify({ cmd: 10000 }));
        }, 1000);
      };

      ws.onmessage = function (e) {
        try {
          var d = JSON.parse(e.data);
          if (d.cmd === 0) {
            ws.send(JSON.stringify({ cmd: 10000 }));
            return;
          }
          if (d.cmd === 10100) {
            if (d.retCode === 0 || (d.bdy && d.bdy.retCode === 0)) {
              var oldWs = currentWs;
              var oldTimer = currentPingTimer;
              currentWs = ws;
              currentPingTimer = pingTimer;
              currentWsSid = d.bdy && d.bdy.sid;
              currentWsCid = cid;
              connecting = false;
              clearWsAuthTimer();
              setStatus("", false);
              setConnBadge(lastChatAt ? "● 실시간 수신 중" : "● 연결됨 (채팅 대기)", "ok");
              if (oldWs && oldWs !== ws) {
                if (oldTimer) clearInterval(oldTimer);
                takeoverInProgress = true;
                oldWs.close();
              }
              setTimeout(function () {
                if (currentWs === ws && currentWsSid) {
                  requestRecentChat(ws, cid, currentWsSid);
                }
              }, takeoverInProgress ? 400 : 0);
              scheduleRefresh();
            } else {
              connecting = false;
              if (currentWs && currentWs !== ws) scheduleRefresh();
              else setStatus("인증 실패. 재연결 중…", true);
            }
            return;
          }
          if (d.cmd === 15101 && d.bdy) {
            handleChatPayload(d.bdy, true);
            return;
          }
          if (d.cmd === 93101 && d.bdy) {
            handleChatPayload(d.bdy, false);
          }
        } catch (err) {}
      };

      ws.onclose = function () {
        clearWsAuthTimer();
        if (takeoverInProgress) {
          takeoverInProgress = false;
          return;
        }
        connecting = false;
        if (refreshTimerId) clearTimeout(refreshTimerId);
        refreshTimerId = null;
        if (currentWs === ws) currentWs = null;
        if (currentPingTimer === pingTimer) currentPingTimer = null;
        if (pingTimer) clearInterval(pingTimer);
        setConnBadge("끊김 · 재연결", "err");
        setStatus("끊김. 재연결 중…", true);
        setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = function () {
        if (!takeoverInProgress) setStatus("웹소켓 오류. 재연결 중…", true);
      };
    } catch (err) {
      connecting = false;
      if (isTakeover) scheduleRefresh();
      else {
        var msg = (err && err.message) ? err.message : String(err);
        setStatus("오류: " + msg + " (" + (RECONNECT_DELAY / 1000) + "초 후 재시도)", true);
        setTimeout(connect, RECONNECT_DELAY);
      }
    }
  }

  function bootLiveChat() {
    restoreChatSession();
    injectUiPreviewSamples();
    startLiveStatusPolling();
    connect();
    loadEmojiPacks().catch(function () {});
    setInterval(function () { loadEmojiPacks().catch(function () {}); }, 30 * 60 * 1000);
  }

  if (!isFileProtocol) bootLiveChat();
})(typeof window !== "undefined" ? window : globalThis);
