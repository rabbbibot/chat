/**
 * 치지직 채널 설정 — URL 붙여넣기 / localStorage / ?channel= 파라미터
 */
(function (global) {
  var STORAGE_KEY = "bangsong_channel_v1";
  var HEX32 = /^[a-f0-9]{32}$/i;

  function parseChannelId(input) {
    var s = String(input || "").trim();
    if (!s) return null;
    if (HEX32.test(s)) return s.toLowerCase();

    var patterns = [
      /chzzk\.naver\.com\/live\/([a-f0-9]{32})/i,
      /chzzk\.naver\.com\/chat\/([a-f0-9]{32})/i,
      /m\.chzzk\.naver\.com\/([a-f0-9]{32})/i,
      /chzzk\.naver\.com\/[^/?#]*\/([a-f0-9]{32})/i,
      /chzzk\.naver\.com\/([a-f0-9]{32})/i
    ];

    for (var i = 0; i < patterns.length; i++) {
      var m = s.match(patterns[i]);
      if (m && m[1]) return m[1].toLowerCase();
    }
    return null;
  }

  function loadStoredRecord() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var j = JSON.parse(raw);
      if (j && j.channelId && HEX32.test(j.channelId)) {
        return {
          channelId: j.channelId,
          sourceInput: j.sourceInput || "",
          savedAt: j.savedAt || 0,
          connectionEnabled: j.connectionEnabled === true
        };
      }
    } catch (e) {}
    return null;
  }

  function getStoredChannelId() {
    var rec = loadStoredRecord();
    return rec ? rec.channelId : null;
  }

  function isConnectionEnabled(rec) {
    rec = rec || loadStoredRecord();
    return !!(rec && rec.connectionEnabled);
  }

  function getChannelFromQuery() {
    try {
      var sp = new URLSearchParams(location.search);
      return parseChannelId(sp.get("channel") || sp.get("chzzk"));
    } catch (e) {
      return null;
    }
  }

  function getAuthChannelId() {
    try {
      if (global.BangsongAuth && typeof global.BangsongAuth.getMe === "function") {
        var me = global.BangsongAuth.getMe();
        if (me && me.loggedIn && me.channelId && HEX32.test(String(me.channelId))) {
          return String(me.channelId).toLowerCase();
        }
      }
    } catch (e) {}
    return null;
  }

  function resolveChannelId() {
    /* 로그인 시 항상 자기 채널 — 시청자 채팅 청취·답장이 같은 방 */
    var fromAuth = getAuthChannelId();
    if (fromAuth) return fromAuth;

    var fromQuery = getChannelFromQuery();
    if (fromQuery) return fromQuery;

    var rec = loadStoredRecord();
    if (isConnectionEnabled(rec)) return rec.channelId;
    if (rec && rec.channelId) return rec.channelId;
    return null;
  }

  function buildMeta(channelId) {
    if (!channelId) return null;
    return {
      channelId: channelId,
      broadcastUrl: "https://m.chzzk.naver.com/" + channelId,
      liveUrl: "https://chzzk.naver.com/live/" + channelId,
      chatPageUrl: "https://chzzk.naver.com/live/" + channelId
    };
  }

  function save(input, options) {
    options = options || {};
    var id = parseChannelId(input);
    if (!id) {
      return {
        ok: false,
        error: "치지직 방송 URL 또는 32자리 채널 ID를 입력해 주세요.\n예: https://chzzk.naver.com/live/채널ID"
      };
    }
    var rec = {
      channelId: id,
      sourceInput: String(input || "").trim(),
      savedAt: Date.now(),
      connectionEnabled: options.connectionEnabled === true
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
    } catch (e) {
      return { ok: false, error: "저장 실패: " + e.message };
    }
    return { ok: true, record: rec, meta: buildMeta(id) };
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function pageUrl(name, extraParams) {
    var base = location.pathname.replace(/\/[^/]*$/, "");
    var origin = location.origin || "http://127.0.0.1:5600";
    var url = origin + base + "/" + name;
    var params = extraParams ? Object.assign({}, extraParams) : {};
    var id = getAuthChannelId() || getChannelFromQuery() || getStoredChannelId();
    if (id) params.channel = String(id).toLowerCase();

    var obsKey = "";
    try {
      var sp = new URLSearchParams(location.search);
      obsKey = String(sp.get("k") || sp.get("key") || "").trim();
    } catch (e) {}
    if (!obsKey && global.BangsongAuth && global.BangsongAuth.getObsKey) {
      obsKey = global.BangsongAuth.getObsKey() || "";
    }
    if (obsKey) params.k = obsKey;

    var keys = Object.keys(params).filter(function (k) {
      return params[k] != null && params[k] !== "";
    });
    if (!keys.length) return url;
    return url + "?" + keys.map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
  }

  global.BangsongChannel = {
    STORAGE_KEY: STORAGE_KEY,
    parseChannelId: parseChannelId,
    resolveChannelId: resolveChannelId,
    getAuthChannelId: getAuthChannelId,
    getChannelFromQuery: getChannelFromQuery,
    loadStoredRecord: loadStoredRecord,
    getStoredChannelId: getStoredChannelId,
    isConnectionEnabled: isConnectionEnabled,
    getMeta: function () {
      return buildMeta(resolveChannelId());
    },
    save: save,
    clear: clear,
    pageUrl: pageUrl
  };
})(typeof window !== "undefined" ? window : global);
