/**
 * 치지직 채널 설정 — URL 붙여넣기 / localStorage / ?channel=,?chatChannel= 파라미터
 *
 * 치지직은 채널ID(방송/자기 채널, /live/{id})와 채팅채널ID(채팅 팝업, /chat/{id})가
 * 서로 다른 값입니다. /chat/ 링크로 받은 값은 채팅 접속에는 바로 쓸 수 있지만
 * 방송 상태 조회(폴링) 같은 channelId 기반 API에는 쓸 수 없습니다.
 */
(function (global) {
  var STORAGE_KEY = "bangsong_channel_v1";
  var HEX32 = /^[a-f0-9]{32}$/i;

  function parseChannelInput(input) {
    var s = String(input || "").trim();
    if (!s) return null;
    if (HEX32.test(s)) return { id: s.toLowerCase(), kind: "live" };

    var chatPatterns = [
      /chzzk\.naver\.com\/chat\/([a-f0-9]{32})/i
    ];
    for (var i = 0; i < chatPatterns.length; i++) {
      var mc = s.match(chatPatterns[i]);
      if (mc && mc[1]) return { id: mc[1].toLowerCase(), kind: "chat" };
    }

    var livePatterns = [
      /chzzk\.naver\.com\/live\/([a-f0-9]{32})/i,
      /m\.chzzk\.naver\.com\/([a-f0-9]{32})/i,
      /chzzk\.naver\.com\/[^/?#]*\/([a-f0-9]{32})/i,
      /chzzk\.naver\.com\/([a-f0-9]{32})/i
    ];
    for (var j = 0; j < livePatterns.length; j++) {
      var ml = s.match(livePatterns[j]);
      if (ml && ml[1]) return { id: ml[1].toLowerCase(), kind: "live" };
    }
    return null;
  }

  function parseChannelId(input) {
    var parsed = parseChannelInput(input);
    return parsed ? parsed.id : null;
  }

  function loadStoredRecord() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var j = JSON.parse(raw);
      if (j && j.channelId && HEX32.test(j.channelId)) {
        return {
          channelId: j.channelId,
          kind: j.kind === "chat" ? "chat" : "live",
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

  function getChannelInfoFromQuery() {
    try {
      var sp = new URLSearchParams(location.search);
      var chat = sp.get("chatChannel");
      if (chat && HEX32.test(String(chat).trim())) {
        return { id: String(chat).trim().toLowerCase(), kind: "chat" };
      }
      var id = parseChannelId(sp.get("channel") || sp.get("chzzk"));
      if (id) return { id: id, kind: "live" };
    } catch (e) {}
    return null;
  }

  function getChannelFromQuery() {
    var info = getChannelInfoFromQuery();
    return info ? info.id : null;
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

  function resolveChannelInfo() {
    /* 로그인 시 항상 자기 채널 — 시청자 채팅 청취·답장이 같은 방 */
    var fromAuth = getAuthChannelId();
    if (fromAuth) return { id: fromAuth, kind: "live" };

    var fromQuery = getChannelInfoFromQuery();
    if (fromQuery) return fromQuery;

    var rec = loadStoredRecord();
    if (rec && rec.channelId) return { id: rec.channelId, kind: rec.kind || "live" };
    return null;
  }

  function resolveChannelId() {
    var info = resolveChannelInfo();
    return info ? info.id : null;
  }

  function resolveChannelKind() {
    var info = resolveChannelInfo();
    return info ? info.kind : null;
  }

  function buildMeta(channelId, kind) {
    if (!channelId) return null;
    if (kind === "chat") {
      return {
        channelId: channelId,
        kind: "chat",
        broadcastUrl: "https://chzzk.naver.com/chat/" + channelId,
        liveUrl: "https://chzzk.naver.com/chat/" + channelId,
        chatPageUrl: "https://chzzk.naver.com/chat/" + channelId
      };
    }
    return {
      channelId: channelId,
      kind: "live",
      broadcastUrl: "https://m.chzzk.naver.com/" + channelId,
      liveUrl: "https://chzzk.naver.com/live/" + channelId,
      chatPageUrl: "https://chzzk.naver.com/live/" + channelId
    };
  }

  function save(input, options) {
    options = options || {};
    var parsed = parseChannelInput(input);
    if (!parsed) {
      return {
        ok: false,
        error: "치지직 방송/채팅 URL 또는 32자리 채널 ID를 입력해 주세요.\n예: https://chzzk.naver.com/chat/채널ID"
      };
    }
    var rec = {
      channelId: parsed.id,
      kind: parsed.kind,
      sourceInput: String(input || "").trim(),
      savedAt: Date.now(),
      connectionEnabled: options.connectionEnabled === true
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
    } catch (e) {
      return { ok: false, error: "저장 실패: " + e.message };
    }
    return { ok: true, record: rec, meta: buildMeta(parsed.id, parsed.kind) };
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
    var authId = getAuthChannelId();
    if (authId) {
      params.channel = authId;
    } else {
      var info = getChannelInfoFromQuery() || (function () {
        var rec = loadStoredRecord();
        return rec ? { id: rec.channelId, kind: rec.kind || "live" } : null;
      })();
      if (info) {
        if (info.kind === "chat") params.chatChannel = info.id;
        else params.channel = info.id;
      }
    }

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
    parseChannelInput: parseChannelInput,
    resolveChannelId: resolveChannelId,
    resolveChannelKind: resolveChannelKind,
    resolveChannelInfo: resolveChannelInfo,
    getAuthChannelId: getAuthChannelId,
    getChannelFromQuery: getChannelFromQuery,
    getChannelInfoFromQuery: getChannelInfoFromQuery,
    loadStoredRecord: loadStoredRecord,
    getStoredChannelId: getStoredChannelId,
    isConnectionEnabled: isConnectionEnabled,
    getMeta: function () {
      var info = resolveChannelInfo();
      return info ? buildMeta(info.id, info.kind) : null;
    },
    save: save,
    clear: clear,
    pageUrl: pageUrl
  };
})(typeof window !== "undefined" ? window : global);
