(function (global) {
  "use strict";

  var DEFAULTS = {
    accent: "#ff4da6",
    paw: "#ff4da6",
    outline: "#ffc8ec",
    outerBorder: "#ffe8f8",
    outerFill: "#d84aa8",
    nick: "#e91e8c"
  };

  var VAR_KEYS = [
    "--magical-accent", "--magical-pink", "--magical-violet", "--magical-gold",
    "--magical-soft", "--magical-deep", "--magical-accent-rgb", "--magical-violet-rgb", "--magical-gold-rgb",
    "--magical-shell-bg-color", "--magical-shell-gradient", "--magical-shell-shadow",
    "--magical-shell-dash-border", "--magical-shell-inner-shadow", "--magical-title-shadow",
    "--magical-bow-shadow", "--magical-bubble-shadow", "--magical-bubble-shadow-board",
    "--magical-bubble-inner-shadow", "--magical-bubble-gradient", "--magical-bubble-gradient-board",
    "--magical-bubble-bg-color", "--magical-bubble-shine", "--magical-bubble-violet-glow", "--magical-bubble-accent-glow",
    "--magical-bubble-text-color", "--magical-bubble-nick-color", "--magical-bubble-inner-border",
    "--magical-bubble-border-color", "--magical-shell-border-color", "--magical-messages-stack-border",
    "--magical-frame-border", "--magical-frame-shadow", "--magical-wing-filter",
    "--magical-sparkle-dust", "--magical-frill-top", "--magical-frill-bottom", "--magical-frill-side",
    "--magical-bow-wings", "--magical-wings-mini",
    "--magical-star-tl", "--magical-star-tr", "--magical-star-bl", "--magical-star-br",
    "--magical-star-mid", "--magical-star-side", "--magical-sparkle-xs", "--magical-sparkle-sm"
  ];

  function normHex(hex, fallback) {
    var h = String(hex || fallback || "#ff4da6").trim();
    if (h.charAt(0) === "#") h = h.slice(1);
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = String(fallback || "ff4da6").replace("#", "");
    return "#" + h.toLowerCase();
  }

  function hexToRgb(hex) {
    var h = normHex(hex).slice(1);
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

  function shade(hex, factor) {
    var c = hexToRgb(hex);
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

  function enc(hex) {
    return encodeURIComponent(normHex(hex));
  }

  function svgUrl(body) {
    return 'url("data:image/svg+xml,' + encodeURIComponent(body).replace(/'/g, "%27") + '")';
  }

  function buildSparkleDust(accent, soft, violet, gold) {
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<circle cx="12" cy="14" r="1.8" fill="#ffffff" opacity="0.95"/>' +
      '<circle cx="38" cy="8" r="1.3" fill="' + gold + '" opacity="0.95"/>' +
      '<circle cx="72" cy="22" r="1.6" fill="#ffffff" opacity="0.9"/>' +
      '<circle cx="24" cy="44" r="1.2" fill="' + soft + '" opacity="0.95"/>' +
      '<circle cx="58" cy="52" r="1.7" fill="' + gold + '" opacity="0.9"/>' +
      '<circle cx="84" cy="40" r="1.3" fill="#ffffff" opacity="0.95"/>' +
      '<circle cx="16" cy="72" r="1.4" fill="' + violet + '" opacity="0.9"/>' +
      '<circle cx="46" cy="80" r="1.6" fill="#ffffff" opacity="0.95"/>' +
      '<circle cx="78" cy="68" r="1.2" fill="' + gold + '" opacity="0.9"/>' +
      '<polygon points="52,18 53.2,21.5 57,22 54,24.2 55,28 52,26 49,28 50,24.2 47,22 50.8,21.5" fill="' + gold + '" opacity="0.85"/>' +
      '<polygon points="88,78 89,81 92,81.8 89.8,83.8 90.5,87 88,85.2 85.5,87 86.2,83.8 84,81.8 87,81" fill="' + accent + '" opacity="0.75"/>' +
      "</svg>"
    );
  }

  function buildFrillTop(soft, accent, gold) {
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="16" viewBox="0 0 48 16">' +
      '<path d="M0 16 V9 Q6 1 12 9 Q18 16 24 9 Q30 1 36 9 Q42 16 48 9 V16 Z" fill="' + soft + '" stroke="' + accent + '" stroke-width="1.1"/>' +
      '<circle cx="12" cy="7" r="1.3" fill="#fff" opacity="0.95"/>' +
      '<circle cx="36" cy="7" r="1.1" fill="' + gold + '" opacity="0.9"/>' +
      "</svg>"
    );
  }

  function buildFrillBottom(accent, soft, gold) {
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="16" viewBox="0 0 48 16">' +
      '<path d="M0 0 V7 Q6 15 12 7 Q18 0 24 7 Q30 15 36 7 Q42 0 48 7 V0 Z" fill="' + mix(accent, soft, 0.35) + '" stroke="' + accent + '" stroke-width="1.1"/>' +
      '<circle cx="24" cy="9" r="1.2" fill="#fff" opacity="0.9"/>' +
      "</svg>"
    );
  }

  function buildFrillSide(soft, accent) {
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="40" viewBox="0 0 12 40">' +
      '<path d="M12 0 H5 Q1 6 5 12 Q1 18 5 24 Q1 30 5 36 Q1 42 5 40 H12 Z" fill="' + soft + '" stroke="' + shade(accent, 1.12) + '" stroke-width="0.9"/>' +
      "</svg>"
    );
  }

  function buildBowWings(accent, violet, gold, soft) {
    var stroke = shade(accent, 0.72);
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 52">' +
      "<defs>" +
      '<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + shade(violet, 1.35) + '"/><stop offset="100%" stop-color="' + violet + '"/></linearGradient>' +
      '<linearGradient id="rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="' + soft + '"/><stop offset="100%" stop-color="' + accent + '"/></linearGradient>' +
      "</defs>" +
      '<path d="M52 22 C34 4 8 8 14 24 C18 32 34 26 52 22 Z" fill="url(#wg)" stroke="' + stroke + '" stroke-width="1.4"/>' +
      '<path d="M52 22 C70 4 96 8 90 24 C86 32 70 26 52 22 Z" fill="url(#wg)" stroke="' + stroke + '" stroke-width="1.4"/>' +
      '<ellipse cx="52" cy="28" rx="10" ry="9" fill="' + shade(accent, 1.08) + '" stroke="' + stroke + '" stroke-width="1.3"/>' +
      '<polygon points="52,6 54,13 61,13 55.5,17 58,24 52,20 46,24 48.5,17 43,13 50,13" fill="' + gold + '" stroke="' + accent + '" stroke-width="0.8"/>' +
      '<path d="M8 38 C4 34 2 30 6 28 C10 26 12 32 8 38 Z" fill="url(#rb)" stroke="' + accent + '" stroke-width="0.8" opacity="0.9"/>' +
      '<path d="M96 38 C100 34 102 30 98 28 C94 26 92 32 96 38 Z" fill="url(#rb)" stroke="' + accent + '" stroke-width="0.8" opacity="0.9"/>' +
      "</svg>"
    );
  }

  function buildWingsMini(accent, violet, gold, soft) {
    var stroke = shade(accent, 0.72);
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 30">' +
      '<path d="M44 16 C30 2 6 6 12 18 C16 24 30 18 44 16 Z" fill="' + mix(violet, soft, 0.45) + '" stroke="' + violet + '" stroke-width="1.2"/>' +
      '<path d="M44 16 C58 2 82 6 76 18 C72 24 58 18 44 16 Z" fill="' + mix(violet, soft, 0.45) + '" stroke="' + violet + '" stroke-width="1.2"/>' +
      '<ellipse cx="44" cy="20" rx="7" ry="6" fill="' + shade(accent, 1.05) + '" stroke="' + stroke + '" stroke-width="1"/>' +
      '<polygon points="44,4 45.5,9 51,9 46.5,12.5 48,18 44,15 40,18 41.5,12.5 37,9 42.5,9" fill="' + gold + '" stroke="' + accent + '" stroke-width="0.6"/>' +
      '<path d="M0 22 C6 18 10 14 14 18 C10 22 4 24 0 22 Z" fill="' + soft + '" stroke="' + accent + '" stroke-width="0.7"/>' +
      '<path d="M88 22 C82 18 78 14 74 18 C78 22 84 24 88 22 Z" fill="' + soft + '" stroke="' + accent + '" stroke-width="0.7"/>' +
      "</svg>"
    );
  }

  function buildStar(fill, stroke, size) {
    var s = size || 28;
    var mid = s / 2;
    var outer = (s - 2) / 2;
    var inner = outer * 0.38;
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + " " + s + '">' +
      '<polygon points="' + mid + ",1 " + (mid + inner) + "," + (outer + 1) + " " + (s - 1) + "," + mid + " " + (mid + inner) + "," + (s - outer - 1) + " " + mid + "," + (s - 1) + " " + (mid - inner) + "," + (s - outer - 1) + " 1," + mid + " " + (mid - inner) + "," + (outer + 1) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.2"/>' +
      (size >= 20 ? '<circle cx="' + mid + '" cy="' + mid + '" r="2" fill="#fff" opacity="0.85"/>' : "") +
      "</svg>"
    );
  }

  function buildSparkle(fill, opacity) {
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12">' +
      '<polygon points="6,0 7,4.5 12,6 7,7.5 6,12 5,7.5 0,6 5,4.5" fill="' + fill + '" opacity="' + (opacity != null ? opacity : 0.95) + '"/>' +
      "</svg>"
    );
  }

  function rgbaParts(hex, alpha) {
    var c = hexToRgb(hex);
    return "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + alpha + ")";
  }

  function luminance(hex) {
    var c = hexToRgb(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  function resolveContext(ctx) {
    ctx = ctx || {};
    return {
      accent: normHex(ctx.accent, DEFAULTS.accent),
      paw: normHex(ctx.paw || ctx.accent, DEFAULTS.paw),
      outline: normHex(ctx.outline, DEFAULTS.outline),
      outerBorder: normHex(ctx.outerBorder, DEFAULTS.outerBorder),
      outerFill: normHex(ctx.outerFill || ctx.accent, DEFAULTS.outerFill),
      nick: normHex(ctx.nick, DEFAULTS.nick),
      boxBg: normHex(ctx.boxBg, "#fff3fb"),
      text: normHex(ctx.text, "#5c1558")
    };
  }

  function applyMagicalBubbleVars(target, c, accent, violet, gold, soft, deep) {
    var boxLum = luminance(c.boxBg);
    var accentRgb = hexToRgb(accent);
    var violetRgb = hexToRgb(violet);

    if (boxLum < 0.14) {
      var bubbleBase = c.boxBg;
      var bubbleSoft = mix(bubbleBase, gold, 0.14);
      var borderTone = mix(gold, c.outerBorder, 0.42);
      var frillFill = mix(bubbleBase, gold, 0.22);
      var frillStroke = mix(gold, "#e8e8f0", 0.35);
      target.style.setProperty("--magical-bubble-border-color", borderTone);
      target.style.setProperty("--magical-bubble-bg-color", rgbaParts(bubbleBase, 0.97));
      target.style.setProperty("--magical-bubble-shine", "rgba(255, 255, 255, 0.12)");
      target.style.setProperty("--magical-bubble-violet-glow", "rgba(" + violetRgb.r + ", " + violetRgb.g + ", " + violetRgb.b + ", 0.16)");
      target.style.setProperty("--magical-bubble-accent-glow", "rgba(" + accentRgb.r + ", " + accentRgb.g + ", " + accentRgb.b + ", 0.1)");
      target.style.setProperty(
        "--magical-bubble-gradient",
        "linear-gradient(145deg, " + shade(bubbleBase, 1.18) + " 0%, " + bubbleBase + " 38%, " + mix(bubbleBase, gold, 0.16) + " 100%)"
      );
      target.style.setProperty(
        "--magical-bubble-gradient-board",
        "linear-gradient(145deg, " + shade(bubbleBase, 1.12) + " 0%, " + bubbleSoft + " 100%)"
      );
      target.style.setProperty(
        "--magical-bubble-shadow",
        "0 0 0 2px " + rgbaParts(gold, 0.42) + ", 0 0 14px " + rgbaParts(violet, 0.22) + ", 0 0 24px " + rgbaParts(gold, 0.14) + ", inset 0 0 18px rgba(0, 0, 0, 0.35)"
      );
      target.style.setProperty(
        "--magical-bubble-shadow-board",
        "0 0 0 1px " + rgbaParts(gold, 0.38) + ", 0 0 10px " + rgbaParts(violet, 0.16) + ", 0 0 18px " + rgbaParts(gold, 0.12) + ", inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 0 12px rgba(0, 0, 0, 0.28)"
      );
      target.style.setProperty(
        "--magical-bubble-inner-shadow",
        "inset 0 0 16px rgba(0, 0, 0, 0.32), inset 0 0 0 1px " + rgbaParts(gold, 0.3)
      );
      target.style.setProperty("--magical-frill-top", buildFrillTop(frillFill, frillStroke, gold));
      target.style.setProperty("--magical-frill-bottom", buildFrillBottom(frillStroke, frillFill, gold));
      target.style.setProperty("--magical-frill-side", buildFrillSide(frillFill, frillStroke));
      target.style.setProperty("--magical-bubble-text-color", c.text);
      target.style.setProperty("--magical-bubble-nick-color", c.nick);
      target.style.setProperty("--magical-bubble-inner-border", rgbaParts(gold, 0.22));
      return;
    }

    if (boxLum > 0.92) {
      var whiteSoft = mix("#ffffff", soft, 0.22);
      target.style.setProperty("--magical-bubble-bg-color", "rgba(255, 255, 255, 0.98)");
      target.style.setProperty("--magical-bubble-shine", "rgba(255, 255, 255, 0.92)");
      target.style.setProperty("--magical-bubble-violet-glow", "rgba(" + violetRgb.r + ", " + violetRgb.g + ", " + violetRgb.b + ", 0.18)");
      target.style.setProperty("--magical-bubble-accent-glow", "rgba(" + accentRgb.r + ", " + accentRgb.g + ", " + accentRgb.b + ", 0.14)");
      target.style.setProperty(
        "--magical-bubble-gradient",
        "linear-gradient(145deg, #ffffff 0%, " + whiteSoft + " 48%, " + rgbaParts(accent, 0.12) + " 100%)"
      );
      target.style.setProperty(
        "--magical-bubble-gradient-board",
        "linear-gradient(145deg, #ffffff 0%, " + mix("#ffffff", soft, 0.16) + " 100%)"
      );
      target.style.setProperty(
        "--magical-bubble-shadow",
        "0 0 0 2px " + rgbaParts(gold, 0.34) + ", 0 0 16px " + rgbaParts(accent, 0.38) + ", 0 0 28px " + rgbaParts(violet, 0.2) + ", inset 0 0 18px " + rgbaParts(soft, 0.22)
      );
      target.style.setProperty(
        "--magical-bubble-shadow-board",
        "0 0 0 1px " + rgbaParts(gold, 0.28) + ", 0 0 12px " + rgbaParts(accent, 0.32) + ", 0 0 20px " + rgbaParts(violet, 0.16) + ", inset 0 1px 0 rgba(255, 255, 255, 0.96), inset 0 0 12px " + rgbaParts(accent, 0.1)
      );
      target.style.setProperty(
        "--magical-bubble-inner-shadow",
        "inset 0 0 14px " + rgbaParts(accent, 0.1) + ", inset 0 0 0 1px " + rgbaParts(gold, 0.16)
      );
      target.style.setProperty("--magical-frill-top", buildFrillTop(soft, accent, gold));
      target.style.setProperty("--magical-frill-bottom", buildFrillBottom(accent, soft, gold));
      target.style.setProperty("--magical-frill-side", buildFrillSide(soft, accent));
      target.style.setProperty("--magical-bubble-text-color", c.text);
      target.style.setProperty("--magical-bubble-nick-color", c.nick);
      target.style.setProperty("--magical-bubble-inner-border", rgbaParts(accent, 0.22));
      return;
    }

    target.style.setProperty("--magical-bubble-bg-color", rgbaParts(mix("#fff8fe", c.boxBg, 0.35), 0.96));
    target.style.setProperty("--magical-bubble-shine", "rgba(255, 255, 255, 0.8)");
    target.style.setProperty("--magical-bubble-violet-glow", "rgba(" + violetRgb.r + ", " + violetRgb.g + ", " + violetRgb.b + ", 0.45)");
    target.style.setProperty("--magical-bubble-accent-glow", "rgba(" + accentRgb.r + ", " + accentRgb.g + ", " + accentRgb.b + ", 0.3)");
    target.style.setProperty(
      "--magical-bubble-gradient",
      "linear-gradient(145deg, rgba(255, 252, 254, 0.96) 0%, " + rgbaParts(soft, 0.92) + " 40%, " + rgbaParts(accent, 0.9) + " 100%)"
    );
    target.style.setProperty(
      "--magical-bubble-gradient-board",
      "linear-gradient(145deg, rgba(255, 252, 254, 0.95) 0%, " + rgbaParts(soft, 0.9) + " 100%)"
    );
    target.style.setProperty(
      "--magical-bubble-shadow",
      "0 0 0 2px " + rgbaParts(gold, 0.42) + ", 0 0 22px " + rgbaParts(accent, 0.62) + ", 0 0 40px " + rgbaParts(violet, 0.42) + ", inset 0 0 24px " + rgbaParts(soft, 0.35)
    );
    target.style.setProperty(
      "--magical-bubble-shadow-board",
      "0 0 0 1px " + rgbaParts(gold, 0.35) + ", 0 0 14px " + rgbaParts(accent, 0.42) + ", 0 0 26px " + rgbaParts(violet, 0.28) + ", inset 0 1px 0 rgba(255, 255, 255, 0.88), inset 0 0 16px " + rgbaParts(accent, 0.25)
    );
    target.style.setProperty(
      "--magical-bubble-inner-shadow",
      "inset 0 0 18px " + rgbaParts(accent, 0.32) + ", inset 0 0 0 1px " + rgbaParts(gold, 0.2)
    );
    target.style.setProperty("--magical-frill-top", buildFrillTop(soft, accent, gold));
    target.style.setProperty("--magical-frill-bottom", buildFrillBottom(accent, soft, gold));
    target.style.setProperty("--magical-frill-side", buildFrillSide(soft, accent));
    target.style.setProperty("--magical-bubble-text-color", c.text);
    target.style.setProperty("--magical-bubble-nick-color", c.nick);
    target.style.setProperty("--magical-bubble-inner-border", "rgba(255, 255, 255, 0.88)");
  }

  function applyMagicalThemeVars(target, ctx) {
    if (!target) return;
    var c = resolveContext(ctx);
    var accent = c.accent;
    var violet = mix(accent, c.nick, 0.35);
    violet = mix(violet, "#b77dff", 0.4);
    var gold = mix(c.outline, "#ffd700", 0.55);
    if (gold.indexOf("ff") === -1) gold = "#ffd700";
    var soft = shade(accent, 1.28);
    var deep = shade(accent, 0.55);
    var accentRgb = hexToRgb(accent);
    var violetRgb = hexToRgb(violet);

    target.style.setProperty("--magical-accent", accent);
    target.style.setProperty("--magical-pink", accent);
    target.style.setProperty("--magical-violet", violet);
    target.style.setProperty("--magical-gold", gold);
    target.style.setProperty("--magical-soft", soft);
    target.style.setProperty("--magical-deep", deep);
    target.style.setProperty("--magical-accent-rgb", accentRgb.r + ", " + accentRgb.g + ", " + accentRgb.b);
    target.style.setProperty("--magical-violet-rgb", violetRgb.r + ", " + violetRgb.g + ", " + violetRgb.b);
    var goldRgb = hexToRgb(gold);
    target.style.setProperty("--magical-gold-rgb", goldRgb.r + ", " + goldRgb.g + ", " + goldRgb.b);

    target.style.setProperty("--magical-shell-bg-color", c.outerFill);
    if (luminance(c.outerFill) < 0.14) {
      var shellBorder = mix(gold, c.outerBorder, 0.5);
      target.style.setProperty("--magical-shell-border-color", shellBorder);
      target.style.setProperty("--magical-messages-stack-border", rgbaParts(mix(gold, "#b0b0b8", 0.42), 0.42));
      target.style.setProperty(
        "--magical-shell-gradient",
        "linear-gradient(160deg, " + shade(c.outerFill, 1.06) + " 0%, " + c.outerFill + " 52%, " + shade(c.outerFill, 0.92) + " 100%)"
      );
      target.style.setProperty(
        "--magical-shell-shadow",
        "0 0 0 2px " + rgbaParts(gold, 0.28) + ", 0 12px 32px rgba(0, 0, 0, 0.72), 0 0 18px " + rgbaParts(violet, 0.12) + ", 0 0 28px " + rgbaParts(gold, 0.1) + ", inset 0 1px 0 rgba(255, 255, 255, 0.06)"
      );
      target.style.setProperty("--magical-shell-dash-border", rgbaParts(mix(gold, "#909098", 0.45), 0.46));
      target.style.setProperty(
        "--magical-shell-inner-shadow",
        "inset 0 0 24px rgba(0, 0, 0, 0.45), inset 0 0 0 1px " + rgbaParts(gold, 0.2)
      );
    } else if (luminance(c.outerFill) > 0.92) {
      target.style.setProperty(
        "--magical-shell-gradient",
        "linear-gradient(160deg, #ffffff 0%, " + c.outerFill + " 54%, " + shade(c.outerFill, 0.97) + " 100%)"
      );
      target.style.setProperty(
        "--magical-shell-shadow",
        "0 0 0 2px " + rgbaParts(gold, 0.22) + ", 0 10px 28px rgba(0, 0, 0, 0.1), 0 0 20px " + rgbaParts(accent, 0.26) + ", 0 0 32px " + rgbaParts(violet, 0.1) + ", inset 0 1px 0 rgba(255, 255, 255, 0.98)"
      );
      target.style.setProperty("--magical-shell-dash-border", rgbaParts(mix(accent, "#cccccc", 0.35), 0.42));
      target.style.setProperty(
        "--magical-shell-inner-shadow",
        "inset 0 0 18px " + rgbaParts(accent, 0.07) + ", inset 0 0 0 1px " + rgbaParts(gold, 0.14)
      );
    } else {
      target.style.setProperty(
        "--magical-shell-gradient",
        "linear-gradient(155deg, " + shade(accent, 1.22) + " 0%, " + accent + " 30%, " + shade(accent, 0.78) + " 58%, " + shade(accent, 0.58) + " 82%, " + deep + " 100%)"
      );
      target.style.setProperty(
        "--magical-shell-shadow",
        "0 0 0 2px " + rgbaParts(gold, 0.35) + ", 0 12px 36px " + rgbaParts(deep, 0.45) + ", 0 0 36px " + rgbaParts(accent, 0.55) + ", 0 0 60px " + rgbaParts(violet, 0.28) + ", inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 0 28px " + rgbaParts(accent, 0.22)
      );
      target.style.setProperty("--magical-shell-dash-border", rgbaParts(c.outerBorder, 0.72));
      target.style.setProperty(
        "--magical-shell-inner-shadow",
        "inset 0 0 36px " + rgbaParts(accent, 0.28) + ", inset 0 0 0 1px " + rgbaParts(gold, 0.22)
      );
    }
    target.style.setProperty(
      "--magical-title-shadow",
      "0 0 10px " + rgbaParts(accent, 1) + ", 0 0 20px " + rgbaParts(soft, 0.85) + ", 0 0 32px " + rgbaParts(violet, 0.55) + ", 0 1px 2px " + rgbaParts(deep, 0.5)
    );
    target.style.setProperty("--magical-bow-shadow", rgbaParts(accent, 0.45));
    applyMagicalBubbleVars(target, c, accent, violet, gold, soft, deep);
    if (luminance(c.outerFill) < 0.14) {
      target.style.setProperty("--magical-frame-border", rgbaParts(gold, 0.38));
      target.style.setProperty(
        "--magical-frame-shadow",
        "0 0 0 3px " + rgbaParts(gold, 0.24) + ", 0 0 20px " + rgbaParts(violet, 0.14) + ", 0 0 32px " + rgbaParts(gold, 0.1)
      );
    } else {
      target.style.setProperty("--magical-frame-border", rgbaParts(soft, 0.75));
      target.style.setProperty(
        "--magical-frame-shadow",
        "0 0 0 3px " + rgbaParts(gold, 0.28) + ", 0 0 28px " + rgbaParts(accent, 0.42) + ", 0 0 48px " + rgbaParts(violet, 0.25)
      );
    }
    target.style.setProperty("--magical-wing-filter", "drop-shadow(0 2px 6px " + rgbaParts(accent, 0.35) + ")");

    target.style.setProperty("--magical-sparkle-dust", buildSparkleDust(accent, soft, violet, gold));
    target.style.setProperty("--magical-bow-wings", buildBowWings(accent, violet, gold, soft));
    target.style.setProperty("--magical-wings-mini", buildWingsMini(accent, violet, gold, soft));
    target.style.setProperty("--magical-star-tl", buildStar(gold, accent, 28));
    target.style.setProperty("--magical-star-tr", buildStar(accent, gold, 24));
    target.style.setProperty("--magical-star-bl", buildStar(violet, accent, 20));
    target.style.setProperty("--magical-star-br", buildStar(gold, accent, 24));
    target.style.setProperty("--magical-star-mid", buildStar("#ffffff", shade(accent, 1.1), 18));
    target.style.setProperty("--magical-star-side", buildStar(gold, accent, 14));
    target.style.setProperty("--magical-sparkle-xs", buildSparkle("#ffffff", 0.95));
    target.style.setProperty("--magical-sparkle-sm", buildSparkle(soft, 0.95));
  }

  function clearMagicalThemeVars(target) {
    if (!target) return;
    VAR_KEYS.forEach(function (key) {
      target.style.removeProperty(key);
    });
  }

  global.applyMagicalThemeVars = applyMagicalThemeVars;
  global.clearMagicalThemeVars = clearMagicalThemeVars;
  global.buildMagicalThemeContext = function (s, themePreset) {
    var tp = themePreset || DEFAULTS;
    return {
      accent: (s && s.boxBorderColor) || tp.boxBorderColor || DEFAULTS.accent,
      paw: (s && s.pawColor) || tp.pawColor || DEFAULTS.paw,
      outline: (s && s.textOutlineColor) || tp.textOutlineColor || DEFAULTS.outline,
      nick: (s && s.nickColor) || tp.nickColor || DEFAULTS.nick,
      outerBorder: (s && s._magicalOuterBorder) || DEFAULTS.outerBorder,
      outerFill: (s && s._magicalOuterFill) || DEFAULTS.outerFill,
      boxBg: (s && s.boxBgColor) || tp.boxBgColor || "#fff3fb",
      text: (s && s.textColor) || tp.textColor || "#5c1558"
    };
  };
})(typeof window !== "undefined" ? window : this);
