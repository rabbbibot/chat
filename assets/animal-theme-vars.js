(function (global) {
  "use strict";

  var VAR_KEYS = ["--animal-argyle", "--animal-paw-scatter"];

  function normHex(hex, fallback) {
    var h = String(hex || fallback || "#ffe066").trim();
    if (h.charAt(0) === "#") h = h.slice(1);
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = String(fallback || "ffe066").replace("#", "");
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

  function luminance(hex) {
    var c = hexToRgb(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  function urlEncHex(hex) {
    return "%23" + normHex(hex).slice(1);
  }

  function pawFill(baseHex) {
    return luminance(baseHex) > 0.62 ? shade(baseHex, 0.68) : "#ffffff";
  }

  function buildAnimalArgyleDataUrl(baseHex) {
    var base = normHex(baseHex);
    var dark = shade(base, 0.84);
    var light = shade(base, 1.14);
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Crect width='56' height='56' fill='" + urlEncHex(base) + "'/%3E%3Cpath d='M0 28 L28 0 L56 28 L28 56 Z' fill='" + urlEncHex(dark) + "'/%3E%3Cpath d='M28 0 L56 28 L28 56 L0 28 Z' fill='" + urlEncHex(light) + "'/%3E%3Cpath d='M0 28 L28 0 L56 28 L28 56 Z' fill='none' stroke='%23ffffff' stroke-width='1.2' opacity='0.28'/%3E%3C/svg%3E\")";
  }

  function buildAnimalPawScatterDataUrl(baseHex) {
    var paw = pawFill(baseHex);
    var p = urlEncHex(paw);
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='" + p + "' opacity='0.22'%3E%3Cellipse cx='72' cy='118' rx='20' ry='15'/%3E%3Ccircle cx='52' cy='92' r='8'/%3E%3Ccircle cx='72' cy='82' r='8'/%3E%3Ccircle cx='92' cy='92' r='8'/%3E%3C/g%3E%3Cg transform='translate(118 36)' fill='" + p + "' opacity='0.16'%3E%3Cellipse cx='0' cy='0' rx='16' ry='12'/%3E%3Ccircle cx='-14' cy='-20' r='6'/%3E%3Ccircle cx='0' cy='-28' r='6'/%3E%3Ccircle cx='14' cy='-20' r='6'/%3E%3C/g%3E%3C/svg%3E\")";
  }

  function applyAnimalThemeVars(target, outerHex) {
    if (!target) return;
    var base = normHex(outerHex);
    target.style.setProperty("--animal-argyle", buildAnimalArgyleDataUrl(base));
    target.style.setProperty("--animal-paw-scatter", buildAnimalPawScatterDataUrl(base));
  }

  function clearAnimalThemeVars(target) {
    if (!target) return;
    VAR_KEYS.forEach(function (key) {
      target.style.removeProperty(key);
    });
  }

  global.applyAnimalThemeVars = applyAnimalThemeVars;
  global.clearAnimalThemeVars = clearAnimalThemeVars;
})(typeof window !== "undefined" ? window : this);
