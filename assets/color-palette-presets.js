(function (global) {
  "use strict";

  var ORDER = ["red", "orange", "yellow", "green", "blue", "navy", "purple", "black", "white", "gray"];

  function hexToRgb(hex) {
    var h = String(hex || "#000000").replace("#", "").trim();
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    if (isNaN(n)) return { r: 0, g: 0, b: 0 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (n) {
      var v = Math.max(0, Math.min(255, Math.round(n)));
      return (v < 16 ? "0" : "") + v.toString(16);
    }).join("");
  }

  function shade(hex, factor) {
    var c = hexToRgb(hex);
    if (factor >= 1) {
      var f = factor - 1;
      return rgbToHex(c.r + (255 - c.r) * f, c.g + (255 - c.g) * f, c.b + (255 - c.b) * f);
    }
    return rgbToHex(c.r * factor, c.g * factor, c.b * factor);
  }

  function mix(a, b, t) {
    var ca = hexToRgb(a);
    var cb = hexToRgb(b);
    var u = Math.max(0, Math.min(1, t));
    return rgbToHex(
      ca.r + (cb.r - ca.r) * u,
      ca.g + (cb.g - ca.g) * u,
      ca.b + (cb.b - ca.b) * u
    );
  }

  function P(label, swatch, fields) {
    var out = {
      label: label,
      swatch: swatch,
      outer: fields.outer,
      outerBorder: fields.outerBorder,
      board: fields.board,
      midBorder: fields.midBorder,
      title: fields.title,
      boxBg: fields.boxBg,
      boxBgAlpha: fields.boxBgAlpha != null ? fields.boxBgAlpha : 1,
      boxBorder: fields.boxBorder,
      boxBorderAlpha: fields.boxBorderAlpha != null ? fields.boxBorderAlpha : 1,
      paw: fields.paw,
      text: fields.text,
      nick: fields.nick,
      outline: fields.outline
    };
    return out;
  }

  var PASTEL = {
    red: P("빨", "#ffb3ba", { outer: { color: "#e8a0a8", alpha: 1 }, outerBorder: { color: "#ffd6dc", alpha: 1 }, board: { color: "#f5c0c8", alpha: 0.82 }, midBorder: { color: "#ffe4e8", alpha: 0.6 }, title: "#fff5f6", boxBg: "#ffd8de", boxBorder: "#f098a8", paw: "#e87888", text: "#6b3840", nick: "#c06070", outline: "#fff0f2" }),
    orange: P("주", "#ffc9a8", { outer: { color: "#e8b898", alpha: 1 }, outerBorder: { color: "#ffe0cc", alpha: 1 }, board: { color: "#f5d0b0", alpha: 0.82 }, midBorder: { color: "#ffecd8", alpha: 0.6 }, title: "#fff8f2", boxBg: "#ffe4cc", boxBorder: "#f0b078", paw: "#e89860", text: "#6b4428", nick: "#c07848", outline: "#fff4ea" }),
    yellow: P("노", "#ffe88a", { outer: { color: "#e8d490", alpha: 1 }, outerBorder: { color: "#fff0b8", alpha: 1 }, board: { color: "#f5e8a8", alpha: 0.82 }, midBorder: { color: "#fff8d8", alpha: 0.6 }, title: "#fffef5", boxBg: "#fff4c8", boxBorder: "#e8c860", paw: "#d8b848", text: "#6b5820", nick: "#a89038", outline: "#fffce8" }),
    green: P("초", "#a8e6c4", { outer: { color: "#98d4b4", alpha: 1 }, outerBorder: { color: "#c8f0dc", alpha: 1 }, board: { color: "#b8e8cc", alpha: 0.82 }, midBorder: { color: "#dcf8ea", alpha: 0.6 }, title: "#f5fff8", boxBg: "#cce8d8", boxBorder: "#78c898", paw: "#68b888", text: "#285838", nick: "#489868", outline: "#eefff4" }),
    blue: P("파", "#a8d4ff", { outer: { color: "#98c4e8", alpha: 1 }, outerBorder: { color: "#c8e4ff", alpha: 1 }, board: { color: "#b8d8f8", alpha: 0.82 }, midBorder: { color: "#dceeff", alpha: 0.6 }, title: "#f5faff", boxBg: "#cce8ff", boxBorder: "#78b8f0", paw: "#68a8e8", text: "#284868", nick: "#4890c8", outline: "#eef6ff" }),
    navy: P("남", "#98a8d8", { outer: { color: "#8898c8", alpha: 1 }, outerBorder: { color: "#b8c4e8", alpha: 1 }, board: { color: "#a0b0d8", alpha: 0.85 }, midBorder: { color: "#d0d8f0", alpha: 0.6 }, title: "#f5f7ff", boxBg: "#c8d4f0", boxBorder: "#6878b8", paw: "#6878b0", text: "#283860", nick: "#506898", outline: "#eef2ff" }),
    purple: P("보", "#c8b4f0", { outer: { color: "#b8a4e0", alpha: 1 }, outerBorder: { color: "#ddd0f8", alpha: 1 }, board: { color: "#c8b8e8", alpha: 0.82 }, midBorder: { color: "#e8e0fa", alpha: 0.6 }, title: "#faf8ff", boxBg: "#ddd0f5", boxBorder: "#9878d0", paw: "#8870c8", text: "#403060", nick: "#6858a0", outline: "#f3f0ff" }),
    black: P("검", "#171717", { outer: { color: "#0a0a0a", alpha: 1 }, outerBorder: { color: "#525252", alpha: 1 }, board: { color: "#262626", alpha: 0.94 }, midBorder: { color: "#404040", alpha: 0.55 }, title: "#f5f5f5", boxBg: "#404040", boxBorder: "#737373", paw: "#d4d4d4", text: "#f5f5f5", nick: "#e5e5e5", outline: "#262626" }),
    white: P("흰", "#f5f5f5", { outer: { color: "#e5e5e5", alpha: 1 }, outerBorder: { color: "#d4d4d4", alpha: 1 }, board: { color: "#f5f5f5", alpha: 0.96 }, midBorder: { color: "#e5e5e5", alpha: 0.75 }, title: "#171717", boxBg: "#ffffff", boxBorder: "#a3a3a3", paw: "#525252", text: "#171717", nick: "#404040", outline: "#fafafa" }),
    gray: P("회", "#737373", { outer: { color: "#3f3f46", alpha: 1 }, outerBorder: { color: "#a1a1aa", alpha: 1 }, board: { color: "#52525b", alpha: 0.9 }, midBorder: { color: "#d4d4d8", alpha: 0.55 }, title: "#fafafa", boxBg: "#d4d4d8", boxBorder: "#71717a", paw: "#52525b", text: "#18181b", nick: "#3f3f46", outline: "#e4e4e7" })
  };

  var HUE = {
    red: { label: "빨", accent: "#ff0044", neonGlow: "#00ffff", oriental: "#b71c1c", magical: "#ff4081", xp: "#cc0000" },
    orange: { label: "주", accent: "#ff6600", neonGlow: "#00e5ff", oriental: "#e65100", magical: "#ff80ab", xp: "#d97706" },
    yellow: { label: "노", accent: "#ffee00", neonGlow: "#ff00cc", oriental: "#b8860b", magical: "#ffd54f", xp: "#ca8a04" },
    green: { label: "초", accent: "#00ff88", neonGlow: "#ff0088", oriental: "#2e7d32", magical: "#69f0ae", xp: "#15803d" },
    blue: { label: "파", accent: "#00d4ff", neonGlow: "#ff5500", oriental: "#1565c0", magical: "#40c4ff", xp: "#2563eb" },
    navy: { label: "남", accent: "#5577ff", neonGlow: "#00ffcc", oriental: "#283593", magical: "#7c4dff", xp: "#1e40af" },
    purple: { label: "보", accent: "#cc00ff", neonGlow: "#ffff00", oriental: "#6a1b9a", magical: "#e040fb", xp: "#7c3aed" }
  };

  function neonHue(key) {
    var h = HUE[key];
    var acc = h.accent;
    var glow = h.neonGlow;
    var dark = mix("#020008", acc, 0.07);
    var panel = mix(dark, acc, 0.16);
    return P(h.label, acc, {
      outer: { color: dark, alpha: 1 },
      outerBorder: { color: acc, alpha: 1 },
      board: { color: panel, alpha: 0.97 },
      midBorder: { color: glow, alpha: 0.62 },
      title: acc,
      boxBg: mix(dark, acc, 0.12),
      boxBgAlpha: 0.98,
      boxBorder: glow,
      boxBorderAlpha: 1,
      paw: shade(acc, 1.08),
      text: "#ffffff",
      nick: glow,
      outline: glow
    });
  }

  function neonBlack() {
    var cyan = "#00f5ff";
    var magenta = "#ff00aa";
    var black = "#000000";
    var panel = "#050508";
    return P("검", "#111111", {
      outer: { color: black, alpha: 1 },
      outerBorder: { color: cyan, alpha: 1 },
      board: { color: panel, alpha: 0.98 },
      midBorder: { color: magenta, alpha: 0.58 },
      title: cyan,
      boxBg: "#0a0a12",
      boxBgAlpha: 0.98,
      boxBorder: magenta,
      boxBorderAlpha: 1,
      paw: cyan,
      text: "#f5f8ff",
      nick: magenta,
      outline: magenta
    });
  }

  function neonWhite() {
    var cyan = "#00d4ff";
    var magenta = "#ff1493";
    var white = "#ffffff";
    var shell = "#f2f2fa";
    var panel = "#e4e4f0";
    return P("흰", "#f5f5f5", {
      outer: { color: shell, alpha: 1 },
      outerBorder: { color: magenta, alpha: 1 },
      board: { color: panel, alpha: 0.96 },
      midBorder: { color: cyan, alpha: 0.65 },
      title: "#1a0a3a",
      boxBg: white,
      boxBgAlpha: 1,
      boxBorder: cyan,
      boxBorderAlpha: 1,
      paw: magenta,
      text: "#1a1040",
      nick: "#c4006e",
      outline: cyan
    });
  }

  function neonGray() {
    var cyan = "#4dd0e1";
    var magenta = "#ce93d8";
    var slate = "#263238";
    var panel = "#455a64";
    var mid = "#78909c";
    return P("회", "#90a4ae", {
      outer: { color: slate, alpha: 1 },
      outerBorder: { color: mid, alpha: 1 },
      board: { color: panel, alpha: 0.94 },
      midBorder: { color: cyan, alpha: 0.5 },
      title: "#eceff1",
      boxBg: "#607d8b",
      boxBgAlpha: 0.96,
      boxBorder: cyan,
      boxBorderAlpha: 1,
      paw: "#b0bec5",
      text: "#ffffff",
      nick: cyan,
      outline: magenta
    });
  }

  var NEON = {
    red: neonHue("red"),
    orange: neonHue("orange"),
    yellow: neonHue("yellow"),
    green: neonHue("green"),
    blue: neonHue("blue"),
    navy: neonHue("navy"),
    purple: neonHue("purple"),
    black: neonBlack(),
    white: neonWhite(),
    gray: neonGray()
  };

  function orientalHue(key) {
    var h = HUE[key];
    var acc = h.oriental;
    var paper = "#f5f2e6";
    var gold = "#c9a227";
    var ink = "#3e2723";
    var board = mix(paper, acc, 0.1);
    var c = hexToRgb(acc);
    var lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    var textShade = lum > 0.42 ? 0.4 : 0.52;
    var textMix = lum > 0.42 ? 0.5 : 0.62;
    return P(h.label, acc, {
      outer: { color: paper, alpha: 1 },
      outerBorder: { color: acc, alpha: 1 },
      board: { color: board, alpha: 0.95 },
      midBorder: { color: mix(acc, gold, 0.42), alpha: 0.5 },
      title: shade(acc, 0.5),
      boxBg: mix("#faf6ee", acc, 0.08),
      boxBorder: shade(acc, 0.78),
      paw: acc,
      text: mix(ink, shade(acc, textShade), textMix),
      nick: shade(acc, 0.62),
      outline: mix(gold, shade(acc, 0.72), 0.38)
    });
  }

  var ORIENTAL = {
    red: orientalHue("red"),
    orange: orientalHue("orange"),
    yellow: orientalHue("yellow"),
    green: orientalHue("green"),
    blue: orientalHue("blue"),
    navy: orientalHue("navy"),
    purple: orientalHue("purple"),
    black: P("검", "#212121", { outer: { color: "#fff8f0", alpha: 1 }, outerBorder: { color: "#212121", alpha: 1 }, board: { color: "#f0ebe3", alpha: 0.94 }, midBorder: { color: "#616161", alpha: 0.45 }, title: "#212121", boxBg: "#faf6ee", boxBorder: "#424242", paw: "#212121", text: mix("#2b1810", "#212121", 0.42), nick: "#424242", outline: "#c9a227" }),
    white: P("흰", "#faf6ee", { outer: { color: "#fffdf8", alpha: 1 }, outerBorder: { color: "#8d6e63", alpha: 1 }, board: { color: "#fffaf5", alpha: 0.96 }, midBorder: { color: "#d7ccc8", alpha: 0.55 }, title: "#5d4037", boxBg: "#ffffff", boxBorder: "#a1887f", paw: "#6d4c41", text: "#4e342e", nick: "#5d4037", outline: "#c9a227" }),
    gray: P("회", "#757575", { outer: { color: "#f5f0e8", alpha: 1 }, outerBorder: { color: "#616161", alpha: 1 }, board: { color: "#ece7df", alpha: 0.92 }, midBorder: { color: "#bdbdbd", alpha: 0.48 }, title: "#424242", boxBg: "#f5f0ea", boxBorder: "#757575", paw: "#616161", text: mix("#3e2723", "#424242", 0.55), nick: mix("#5d4037", "#616161", 0.45), outline: mix("#c9a227", "#9e9e9e", 0.42) })
  };

  function magicalHue(key) {
    var h = HUE[key];
    var acc = h.magical;
    var sparkle = "#ffd700";
    var outer = mix("#ffe8f8", acc, 0.22);
    var board = mix("#fff5fd", acc, 0.14);
    return P(h.label, acc, {
      outer: { color: outer, alpha: 1 },
      outerBorder: { color: acc, alpha: 1 },
      board: { color: board, alpha: 0.92 },
      midBorder: { color: mix(acc, sparkle, 0.45), alpha: 0.58 },
      title: "#ffffff",
      boxBg: mix("#fff8fe", acc, 0.12),
      boxBorder: shade(acc, 0.88),
      paw: shade(acc, 0.9),
      text: shade(acc, 0.38),
      nick: shade(acc, 0.68),
      outline: mix(acc, "#ffc8ec", 0.5)
    });
  }

  function magicalBlack() {
    var accent = "#e040fb";
    var gold = "#ffd700";
    var soft = "#ffc8ec";
    var black = "#000000";
    var panel = "#0a0a0a";
    var shellBorder = mix(gold, "#c8c8d0", 0.38);
    var bubbleBorder = mix(gold, "#a8a8b0", 0.48);
    return P("검", "#111111", {
      outer: { color: black, alpha: 1 },
      outerBorder: { color: shellBorder, alpha: 1 },
      board: { color: black, alpha: 1 },
      midBorder: { color: mix(shellBorder, gold, 0.35), alpha: 0.55 },
      title: "#ffffff",
      boxBg: panel,
      boxBgAlpha: 0.98,
      boxBorder: bubbleBorder,
      paw: accent,
      text: "#f5f5f5",
      nick: "#ff80ab",
      outline: soft
    });
  }

  function magicalWhite() {
    var accent = "#ff4da6";
    var pink = "#ff4da6";
    var gold = "#ffd700";
    var soft = "#ffc8ec";
    var white = "#ffffff";
    var panel = "#fafafa";
    return P("흰", "#f5f5f5", {
      outer: { color: white, alpha: 1 },
      outerBorder: { color: accent, alpha: 1 },
      board: { color: white, alpha: 1 },
      midBorder: { color: mix(accent, gold, 0.45), alpha: 0.5 },
      title: "#e91e8c",
      boxBg: white,
      boxBgAlpha: 1,
      boxBorder: pink,
      paw: accent,
      text: "#3d1840",
      nick: "#e91e8c",
      outline: soft
    });
  }

  var MAGICAL = {
    red: magicalHue("red"),
    orange: magicalHue("orange"),
    yellow: magicalHue("yellow"),
    green: magicalHue("green"),
    blue: magicalHue("blue"),
    navy: magicalHue("navy"),
    purple: magicalHue("purple"),
    black: magicalBlack(),
    white: magicalWhite(),
    gray: P("회", "#9c88b8", { outer: { color: "#f3e8ff", alpha: 1 }, outerBorder: { color: "#9575cd", alpha: 1 }, board: { color: "#faf5ff", alpha: 0.92 }, midBorder: { color: "#ffd700", alpha: 0.42 }, title: "#ffffff", boxBg: "#fff8fe", boxBorder: "#7e57c2", paw: "#ba68c8", text: "#4a148c", nick: "#8e24aa", outline: "#ffc8ec" })
  };

  function xpHue(key) {
    var h = HUE[key];
    var acc = h.xp;
    var titleBar = shade(acc, 0.88);
    var client = mix("#ece9d8", acc, 0.06);
    return P(h.label, acc, {
      outer: { color: titleBar, alpha: 1 },
      outerBorder: { color: shade(acc, 0.72), alpha: 1 },
      board: { color: client, alpha: 1 },
      midBorder: { color: mix(acc, "#808080", 0.35), alpha: 0.48 },
      title: "#ffffff",
      boxBg: client,
      boxBorder: shade(acc, 0.78),
      paw: acc,
      text: "#000000",
      nick: shade(acc, 0.55),
      outline: "#ffffff"
    });
  }

  var XP = {
    red: xpHue("red"),
    orange: xpHue("orange"),
    yellow: xpHue("yellow"),
    green: xpHue("green"),
    blue: xpHue("blue"),
    navy: xpHue("navy"),
    purple: xpHue("purple"),
    black: P("검", "#404040", { outer: { color: "#2b2b2b", alpha: 1 }, outerBorder: { color: "#606060", alpha: 1 }, board: { color: "#d4d0c8", alpha: 1 }, midBorder: { color: "#808080", alpha: 0.45 }, title: "#ffffff", boxBg: "#ece9d8", boxBorder: "#606060", paw: "#404040", text: "#000000", nick: "#333333", outline: "#ffffff" }),
    white: P("흰", "#f5f5f5", { outer: { color: "#e8e8e8", alpha: 1 }, outerBorder: { color: "#a0a0a0", alpha: 1 }, board: { color: "#f0f0f0", alpha: 1 }, midBorder: { color: "#c0c0c0", alpha: 0.55 }, title: "#000000", boxBg: "#ffffff", boxBorder: "#909090", paw: "#606060", text: "#000000", nick: "#404040", outline: "#ffffff" }),
    gray: P("회", "#808080", { outer: { color: "#5a5a5a", alpha: 1 }, outerBorder: { color: "#909090", alpha: 1 }, board: { color: "#dcd9d0", alpha: 1 }, midBorder: { color: "#a8a8a8", alpha: 0.48 }, title: "#ffffff", boxBg: "#ece9d8", boxBorder: "#707070", paw: "#606060", text: "#000000", nick: "#333333", outline: "#ffffff" })
  };

  function hackingHue(key) {
    var h = HUE[key];
    var acc = h.accent;
    var glow = h.neonGlow;
    var dark = "#040810";
    var panel = mix("#061018", acc, 0.22);
    var swatch = shade(acc, 1.1);
    if (key === "yellow") swatch = mix(acc, "#c8960a", 0.32);
    if (key === "navy") swatch = mix(acc, "#8899ff", 0.28);
    return P(h.label, swatch, {
      outer: { color: dark, alpha: 1 },
      outerBorder: { color: acc, alpha: 1 },
      board: { color: panel, alpha: 0.9 },
      midBorder: { color: mix(acc, glow, 0.42), alpha: 0.4 },
      title: shade(acc, 1.06),
      boxBg: mix("#0a1824", acc, 0.18),
      boxBgAlpha: 0.82,
      boxBorder: acc,
      boxBorderAlpha: 1,
      paw: mix(acc, glow, 0.28),
      text: "#e8f4ff",
      nick: shade(acc, 1.04),
      outline: mix(glow, dark, 0.62)
    });
  }

  var HACKING = {
    red: hackingHue("red"),
    orange: hackingHue("orange"),
    yellow: hackingHue("yellow"),
    green: hackingHue("green"),
    blue: hackingHue("blue"),
    navy: hackingHue("navy"),
    purple: hackingHue("purple"),
    black: P("검", "#00e5cc", { outer: { color: "#020408", alpha: 1 }, outerBorder: { color: "#00e5cc", alpha: 1 }, board: { color: "#061018", alpha: 0.94 }, midBorder: { color: "#00e5cc", alpha: 0.28 }, title: "#00ffcc", boxBg: "#0a1820", boxBorder: "#00e5cc", paw: "#00e5cc", text: "#e8ffff", nick: "#00ffcc", outline: "#003838" }),
    white: P("흰", "#f0f8ff", { outer: { color: "#040810", alpha: 1 }, outerBorder: { color: "#e8ffff", alpha: 1 }, board: { color: "#0a1820", alpha: 0.92 }, midBorder: { color: mix("#e8ffff", "#ff4081", 0.22), alpha: 0.35 }, title: "#e8ffff", boxBg: "#0c2030", boxBorder: "#e8ffff", paw: "#e8ffff", text: "#ffffff", nick: "#e8ffff", outline: "#004848" }),
    gray: P("회", "#90a4ae", { outer: { color: "#080c10", alpha: 1 }, outerBorder: { color: "#b0bec5", alpha: 1 }, board: { color: "#101820", alpha: 0.92 }, midBorder: { color: mix("#78909c", "#00d4ff", 0.35), alpha: 0.38 }, title: "#cfd8dc", boxBg: "#1a2830", boxBorder: "#90a4ae", paw: "#b0bec5", text: "#eceff1", nick: "#b0bec5", outline: "#263238" })
  };

  function animalHue(key) {
    var h = HUE[key];
    var sunny = "#ffe066";
    var gold = "#e6b422";
    var acc = mix(sunny, h.accent, 0.66);
    var outer = mix(sunny, acc, 0.62);
    var board = mix("#ffffff", acc, 0.22);
    return P(h.label, acc, {
      outer: { color: outer, alpha: 1 },
      outerBorder: { color: mix(gold, acc, 0.55), alpha: 1 },
      board: { color: board, alpha: 0.94 },
      midBorder: { color: mix(gold, acc, 0.5), alpha: 0.58 },
      title: mix("#7a5c12", shade(acc, 0.52), 0.45),
      boxBg: mix("#ffffff", acc, 0.16),
      boxBgAlpha: 0.96,
      boxBorder: mix(gold, acc, 0.65),
      boxBorderAlpha: 1,
      paw: mix(gold, acc, 0.6),
      text: mix("#5c4818", shade(acc, 0.4), 0.5),
      nick: mix("#8b6914", acc, 0.55),
      outline: mix("#fff8e1", acc, 0.35)
    });
  }

  var ANIMAL = {
    red: animalHue("red"),
    orange: animalHue("orange"),
    yellow: animalHue("yellow"),
    green: animalHue("green"),
    blue: animalHue("blue"),
    navy: animalHue("navy"),
    purple: animalHue("purple"),
    black: P("검", "#d4a017", { outer: { color: "#f5b830", alpha: 1 }, outerBorder: { color: "#8b6914", alpha: 1 }, board: { color: "#fffef0", alpha: 0.94 }, midBorder: { color: "#c99410", alpha: 0.5 }, title: "#5c4818", boxBg: "#fff8d8", boxBorder: "#a67c00", paw: "#c99410", text: "#3d2f0f", nick: "#7a5c12", outline: "#fff3c4" }),
    white: P("흰", "#ffe066", { outer: { color: "#ffe066", alpha: 1 }, outerBorder: { color: "#e6b422", alpha: 1 }, board: { color: "#ffffff", alpha: 0.96 }, midBorder: { color: "#f5d88a", alpha: 0.65 }, title: "#7a5c12", boxBg: "#ffffff", boxBorder: "#e6b422", paw: "#d4a017", text: "#5c4818", nick: "#8b6914", outline: "#fff8e1" }),
    gray: P("회", "#78909c", { outer: { color: "#e8d878", alpha: 1 }, outerBorder: { color: "#607d8b", alpha: 1 }, board: { color: "#fffef5", alpha: 0.92 }, midBorder: { color: "#90a4ae", alpha: 0.52 }, title: "#455a64", boxBg: "#ffffff", boxBorder: "#78909c", paw: "#607d8b", text: "#37474f", nick: "#546e7a", outline: "#eceff1" })
  };

  function simpleHue(key) {
    var h = HUE[key];
    var acc = h.accent;
    var swatch = {
      red: "#ef4444",
      orange: "#f97316",
      yellow: "#eab308",
      green: "#22c55e",
      blue: "#3b82f6",
      navy: "#6366f1",
      purple: "#a855f7"
    }[key] || acc;
    var nick = {
      red: "#fca5a5",
      orange: "#fdba74",
      yellow: "#fde047",
      green: "#86efac",
      blue: "#93c5fd",
      navy: "#a5b4fc",
      purple: "#d8b4fe"
    }[key] || shade(acc, 1.12);
    return P(h.label, swatch, {
      outer: { color: "#484848", alpha: 0.92 },
      outerBorder: { color: mix("#707070", acc, 0.42), alpha: 1 },
      board: { color: mix("#525252", acc, 0.1), alpha: 0.85 },
      midBorder: { color: mix(acc, "#909090", 0.38), alpha: 0.42 },
      title: "#ffffff",
      boxBg: mix("#404040", acc, 0.14),
      boxBgAlpha: 0.38,
      boxBorder: mix("#5a5a5a", acc, 0.58),
      boxBorderAlpha: 0.55,
      paw: mix(acc, "#cccccc", 0.32),
      text: "#ffffff",
      nick: nick,
      outline: "#2a2a2a"
    });
  }

  var SIMPLE = {
    red: simpleHue("red"),
    orange: simpleHue("orange"),
    yellow: simpleHue("yellow"),
    green: simpleHue("green"),
    blue: simpleHue("blue"),
    navy: simpleHue("navy"),
    purple: simpleHue("purple"),
    black: P("검", "#525252", { outer: { color: "#383838", alpha: 0.94 }, outerBorder: { color: "#606060", alpha: 1 }, board: { color: "#444444", alpha: 0.88 }, midBorder: { color: "#707070", alpha: 0.35 }, title: "#f5f5f5", boxBg: "#333333", boxBgAlpha: 0.42, boxBorder: "#606060", boxBorderAlpha: 0.5, paw: "#d4d4d4", text: "#ffffff", nick: "#e5e5e5", outline: "#1a1a1a" }),
    white: P("흰", "#f5f5f5", { outer: { color: "#686868", alpha: 0.9 }, outerBorder: { color: "#d4d4d4", alpha: 1 }, board: { color: "#737373", alpha: 0.82 }, midBorder: { color: "#e5e5e5", alpha: 0.45 }, title: "#ffffff", boxBg: "#595959", boxBgAlpha: 0.32, boxBorder: "#d4d4d4", boxBorderAlpha: 0.55, paw: "#ffffff", text: "#ffffff", nick: "#ffffff", outline: "#404040" }),
    gray: P("회", "#737373", { outer: { color: "#484848", alpha: 0.92 }, outerBorder: { color: "#707070", alpha: 1 }, board: { color: "#525252", alpha: 0.85 }, midBorder: { color: "#808080", alpha: 0.32 }, title: "#ffffff", boxBg: "#404040", boxBgAlpha: 0.35, boxBorder: "#5a5a5a", boxBorderAlpha: 0.45, paw: "#b0b0b0", text: "#ffffff", nick: "#dddddd", outline: "#2a2a2a" })
  };

  var BY_THEME = {
    pastel: PASTEL,
    neon: NEON,
    oriental: ORIENTAL,
    xp: XP,
    magical: MAGICAL,
    hacking: HACKING,
    animal: ANIMAL,
    simple: SIMPLE
  };

  function normalizeTheme(theme) {
    if (theme === "wolf") return "pastel";
    if (theme === "neon" || theme === "oriental" || theme === "xp" || theme === "magical" || theme === "hacking" || theme === "animal" || theme === "simple") return theme;
    return "pastel";
  }

  function getColorPalettePresets(theme) {
    return BY_THEME[normalizeTheme(theme)] || PASTEL;
  }

  global.COLOR_PALETTE_PRESET_ORDER = ORDER;
  global.getColorPalettePresets = getColorPalettePresets;
})(typeof window !== "undefined" ? window : this);
