/**
 * 위플랩(SOOP 네이티브 채팅창 커스텀 CSS 도구)용 CSS 내보내기.
 * 선택한 테마의 색상/폰트를 SOOP #page_wrap .chat_box 구조에 맞춰 변환합니다.
 * channel-settings.js 이후, index.html의 인라인 스크립트보다 먼저 로드되어야 합니다.
 */
(function (global) {
  var FONT_FILES = {
    omyu: { family: "OmyuPretty", urls: ["fonts/omyu/OmyuPretty.ttf"] },
    singleday: { family: "SingleDay", urls: ["fonts/singleday/SingleDay-Regular.ttf"] },
    nukka: { family: "OnglipNukka", urls: ["fonts/nukka/OnglipNukka.ttf"] },
    monas: { family: "MonaS12", urls: ["fonts/monas/MonaS12.woff2", "fonts/monas/MonaS12TextKR.ttf"] },
    dunggeunmo: { family: "DungGeunMo", urls: ["fonts/dunggeunmo/DungGeunMo.ttf"] },
    solmoe: { family: "JeonjuWanpanbonGakR", urls: ["fonts/jeonju/JeonjuWanpanbonGak-R.ttf"] },
    cookierun: { family: "CookieRun", urls: ["fonts/cookie/CookieRun Regular.ttf"] },
    mulmaru: { family: "Mulmaru", urls: ["fonts/Mulmaru.woff2", "fonts/Mulmaru.ttf"] },
    malgun: { family: "Malgun Gothic", urls: [] }
  };

  var THEME_DEFS = {
    pastel: {
      label: "파스텔",
      fontKey: "omyu",
      gradient: ["#e6dcff", "#c8b6f0", "#9b8bc4"],
      border: "#9b8bc4",
      glow: "150, 120, 220",
      text: "#5a4f76",
      nickBg: "#d4c8f0",
      nickText: "#5a4f76",
      deco: "🐾",
      cross: "✚"
    },
    neon: {
      label: "네온",
      fontKey: "mulmaru",
      gradient: ["#1a0e38", "#2a1f5c", "#0c0620"],
      border: "#00f5ff",
      glow: "0, 245, 255",
      text: "#ffffff",
      nickBg: "#00f5ff",
      nickText: "#0a1a2b",
      deco: "⚡",
      cross: "✚"
    },
    oriental: {
      label: "동양풍",
      fontKey: "solmoe",
      gradient: ["#fffaf0", "#f5e6cf", "#eddcb8"],
      border: "#c62828",
      glow: "198, 40, 40",
      text: "#3e1f14",
      nickBg: "#c62828",
      nickText: "#ffffff",
      deco: "🏮",
      cross: "✚"
    },
    xp: {
      label: "XP 윈도우",
      fontKey: "dunggeunmo",
      gradient: ["#ece9d8", "#dcd8c0", "#c7c2a0"],
      border: "#0054e3",
      glow: "0, 84, 227",
      text: "#000000",
      nickBg: "#0054e3",
      nickText: "#ffffff",
      deco: "🪟",
      cross: "✚"
    },
    magical: {
      label: "마법소녀",
      fontKey: "singleday",
      gradient: ["#ffc0eb", "#f06abb", "#9b2d87"],
      border: "#ff4da6",
      glow: "255, 77, 166",
      text: "#5c1558",
      nickBg: "#ff4da6",
      nickText: "#ffffff",
      deco: "✨",
      cross: "✚"
    },
    hacking: {
      label: "해킹",
      fontKey: "monas",
      gradient: ["#0a2838", "#062230", "#020c12"],
      border: "#00e5cc",
      glow: "0, 229, 204",
      text: "#e8ffff",
      nickBg: "#00e5cc",
      nickText: "#04202a",
      deco: "&gt;_",
      cross: "#"
    },
    animal: {
      label: "동물",
      fontKey: "nukka",
      gradient: ["#fff3c4", "#ffe066", "#e6b422"],
      border: "#e6b422",
      glow: "230, 180, 34",
      text: "#5c4818",
      nickBg: "#e6b422",
      nickText: "#ffffff",
      deco: "🐾",
      cross: "✚"
    },
    simple: {
      label: "심플",
      fontKey: "malgun",
      gradient: ["#484848", "#404040", "#303030"],
      border: "#5a5a5a",
      glow: "90, 90, 90",
      text: "#ffffff",
      nickBg: "#5a5a5a",
      nickText: "#ffffff",
      deco: "",
      cross: ""
    },
    minecraft: {
      label: "마인크래프트",
      fontKey: "dunggeunmo",
      gradient: ["#3e3e3e", "#2b2b2b", "#1a1a1a"],
      border: "#55ff55",
      glow: "85, 255, 85",
      text: "#ffffff",
      nickBg: "#55ff55",
      nickText: "#1a1a1a",
      deco: "⛏",
      cross: "■"
    }
  };

  function fontAssetBase() {
    var base = location.pathname.replace(/\/[^/]*$/, "");
    return location.origin + base + "/";
  }

  function buildFontFace(fontKey) {
    var f = FONT_FILES[fontKey];
    if (!f || !f.urls || !f.urls.length) return "";
    var abs = fontAssetBase();
    var srcs = f.urls.map(function (u) {
      var fmt = /\.woff2$/i.test(u) ? "woff2" : "truetype";
      return "url(\"" + abs + u + "\") format(\"" + fmt + "\")";
    });
    return (
      "@font-face {\n" +
      "  font-family: \"" + f.family + "\";\n" +
      "  src: " + srcs.join(",\n       ") + ";\n" +
      "  font-weight: 800;\n" +
      "  font-style: normal;\n" +
      "  font-display: swap;\n" +
      "}\n\n"
    );
  }

  function buildDecorationCss(def) {
    if (!def.deco) return "";
    return (
      "#page_wrap .chat_box.chat p.name::before,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .text_box .nick::before,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .text_box .nick::before {\n" +
      "  content: \"" + def.deco + "\";\n" +
      "  position: absolute !important;\n" +
      "  left: -26px !important;\n" +
      "  top: 50% !important;\n" +
      "  transform: translateY(-50%) !important;\n" +
      "  font-size: 20px !important;\n" +
      "  line-height: 1 !important;\n" +
      "  pointer-events: none !important;\n" +
      "  z-index: 3 !important;\n" +
      "  animation: wiplabVineSwing 3.5s infinite ease-in-out !important;\n" +
      "}\n\n"
    );
  }

  function buildCrossCss(def) {
    if (!def.cross) return "";
    return (
      "#page_wrap .chat_box.chat .inner_box::after,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box::after,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box::after {\n" +
      "  content: \"" + def.cross + "\";\n" +
      "  position: absolute !important;\n" +
      "  bottom: -5px !important;\n" +
      "  right: 4px !important;\n" +
      "  color: var(--wiplab-border) !important;\n" +
      "  font-family: sans-serif !important;\n" +
      "  font-size: 22px !important;\n" +
      "  font-weight: 700 !important;\n" +
      "  line-height: 1 !important;\n" +
      "  text-shadow: 0 0 8px rgba(var(--wiplab-glow), 0.65) !important;\n" +
      "  transform: rotate(-20deg);\n" +
      "  opacity: 0;\n" +
      "  animation: wiplabSpinPlus 0.8s ease-out 0.6s forwards !important;\n" +
      "  pointer-events: none !important;\n" +
      "  z-index: 5 !important;\n" +
      "}\n\n"
    );
  }

  function generateWiplabCss(themeKey) {
    var def = THEME_DEFS[themeKey] || THEME_DEFS.pastel;
    var f = FONT_FILES[def.fontKey] || FONT_FILES.malgun;
    var fontFamilyCss = "\"" + f.family + "\", sans-serif";

    var css =
      "/* ===== 위플랩용 커스텀 채팅 CSS — " + def.label + " 테마 ===== */\n\n" +
      buildFontFace(def.fontKey) +
      ":root {\n" +
      "  --wiplab-border: " + def.border + ";\n" +
      "  --wiplab-glow: " + def.glow + ";\n" +
      "  --wiplab-text: " + def.text + ";\n" +
      "  --wiplab-nick-bg: " + def.nickBg + ";\n" +
      "  --wiplab-nick-text: " + def.nickText + ";\n" +
      "}\n\n" +
      "@keyframes wiplabBounceIn {\n" +
      "  0% { opacity: 0; transform: scale(0.5) translateY(30px); }\n" +
      "  60% { opacity: 1; transform: scale(1.1) translateY(-10px); }\n" +
      "  80% { transform: scale(0.95) translateY(5px); }\n" +
      "  100% { opacity: 1; transform: scale(1) translateY(0); }\n" +
      "}\n\n" +
      "@keyframes wiplabVineSwing {\n" +
      "  0%, 100% { transform: translateY(-50%) rotate(8deg); }\n" +
      "  50% { transform: translateY(-50%) rotate(-8deg); }\n" +
      "}\n\n" +
      "@keyframes wiplabSpinPlus {\n" +
      "  0% { transform: rotate(0deg) scale(0); opacity: 0; }\n" +
      "  50% { opacity: 1; }\n" +
      "  100% { transform: rotate(360deg) scale(1); opacity: 1; }\n" +
      "}\n\n" +
      "#page_wrap .chat_box.chat .inner_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca.ADBALLOON .donation_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca.VODADCON .donation_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca.ADCON .donation_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca.FOLLOW_ITEM .donation_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca.FOLLOW_ITEM_EFFECT .donation_box {\n" +
      "  animation: wiplabBounceIn 0.8s ease-out !important;\n" +
      "  transform-origin: top center !important;\n" +
      "  width: fit-content !important;\n" +
      "  min-width: 160px !important;\n" +
      "  max-width: 440px !important;\n" +
      "  margin: 36px 8px 18px 28px !important;\n" +
      "  padding: 30px 24px 16px !important;\n" +
      "  background: linear-gradient(to right, " + def.gradient[0] + " 0%, " + def.gradient[1] + " 50%, " + def.gradient[2] + " 100%) !important;\n" +
      "  border: 2px solid var(--wiplab-border) !important;\n" +
      "  border-radius: 28px !important;\n" +
      "  box-shadow: 0 0 8px rgba(var(--wiplab-glow), 0.35), 0 0 16px rgba(0, 0, 0, 0.35) !important;\n" +
      "  display: flex !important;\n" +
      "  flex-direction: column !important;\n" +
      "  align-items: center !important;\n" +
      "  justify-content: center !important;\n" +
      "  gap: 4px !important;\n" +
      "  position: relative !important;\n" +
      "  overflow: visible !important;\n" +
      "  text-align: center !important;\n" +
      "  box-sizing: border-box !important;\n" +
      "}\n\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .text_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .msg_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .text_box,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .msg_box {\n" +
      "  width: 100% !important;\n" +
      "  height: auto !important;\n" +
      "  margin: 0 !important;\n" +
      "  padding: 0 !important;\n" +
      "  background: none !important;\n" +
      "  border: none !important;\n" +
      "  box-shadow: none !important;\n" +
      "  position: static !important;\n" +
      "  overflow: visible !important;\n" +
      "  text-align: center !important;\n" +
      "}\n\n" +
      buildDecorationCss(def) +
      "#page_wrap .chat_box.chat p.text {\n" +
      "  color: var(--wiplab-text) !important;\n" +
      "  font-family: " + fontFamilyCss + " !important;\n" +
      "  font-size: 22px !important;\n" +
      "  font-weight: 800 !important;\n" +
      "  line-height: 1.6 !important;\n" +
      "  margin: 0 !important;\n" +
      "  padding: 0 !important;\n" +
      "  position: relative !important;\n" +
      "  top: -2px !important;\n" +
      "  white-space: normal !important;\n" +
      "  word-break: keep-all !important;\n" +
      "  overflow-wrap: anywhere !important;\n" +
      "  text-align: center !important;\n" +
      "  text-shadow: none !important;\n" +
      "  z-index: 1 !important;\n" +
      "}\n\n" +
      "#page_wrap .chat_box.chat p.name,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .text_box .nick,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .text_box .nick {\n" +
      "  animation: none !important;\n" +
      "  opacity: 1 !important;\n" +
      "  background: var(--wiplab-nick-bg) !important;\n" +
      "  color: var(--wiplab-nick-text) !important;\n" +
      "  font-family: " + fontFamilyCss + " !important;\n" +
      "  font-size: 17px !important;\n" +
      "  font-weight: 800 !important;\n" +
      "  line-height: 1.4 !important;\n" +
      "  padding: 6px 14px !important;\n" +
      "  border: none !important;\n" +
      "  border-radius: 20px !important;\n" +
      "  box-shadow: 0 0 8px rgba(var(--wiplab-glow), 0.5) !important;\n" +
      "  display: inline-flex !important;\n" +
      "  align-items: center !important;\n" +
      "  position: absolute !important;\n" +
      "  top: -18px !important;\n" +
      "  left: 24px !important;\n" +
      "  width: auto !important;\n" +
      "  max-width: calc(100% - 48px) !important;\n" +
      "  height: auto !important;\n" +
      "  min-height: 0 !important;\n" +
      "  margin: 0 !important;\n" +
      "  transform: none !important;\n" +
      "  text-shadow: none !important;\n" +
      "  white-space: nowrap !important;\n" +
      "  overflow: visible !important;\n" +
      "  z-index: 4 !important;\n" +
      "}\n\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .text_box .nick *,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .text_box .nick * {\n" +
      "  height: auto !important;\n" +
      "  min-height: 0 !important;\n" +
      "  max-height: none !important;\n" +
      "  line-height: inherit !important;\n" +
      "  overflow: visible !important;\n" +
      "  clip: auto !important;\n" +
      "}\n\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .text_box .val,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .text_box .val,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .msg_box .val,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .msg_box .val,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.afreeca .donation_box .msg,\n" +
      "#page_wrap .page_area.chat .chat_list .chat_box.soopg .donation_box .msg {\n" +
      "  color: var(--wiplab-text) !important;\n" +
      "  font-family: " + fontFamilyCss + " !important;\n" +
      "  font-size: 20px !important;\n" +
      "  font-weight: 800 !important;\n" +
      "  line-height: 1.55 !important;\n" +
      "  margin: 0 !important;\n" +
      "  padding: 0 !important;\n" +
      "  background: none !important;\n" +
      "  border: none !important;\n" +
      "  box-shadow: none !important;\n" +
      "  position: static !important;\n" +
      "  white-space: normal !important;\n" +
      "  word-break: keep-all !important;\n" +
      "  overflow-wrap: anywhere !important;\n" +
      "  text-align: center !important;\n" +
      "  text-shadow: none !important;\n" +
      "  overflow: visible !important;\n" +
      "  z-index: 1 !important;\n" +
      "}\n\n" +
      buildCrossCss(def);

    return css;
  }

  global.WiplabExport = {
    THEMES: THEME_DEFS,
    generate: generateWiplabCss
  };
})(typeof window !== "undefined" ? window : global);
