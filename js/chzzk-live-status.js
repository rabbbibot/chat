/**
 * 치지직 방송 상태 / 채팅 채널 ID 조회
 * channel-settings.js 를 먼저 로드해야 합니다.
 */
(function (global) {
  var DEFAULT_PROXIES = [
    "https://muddy-dew-207b.sarahhha96.workers.dev/?url=",
  ];

  function originProxyBase() {
    var base = location.pathname.replace(/\/[^/]*$/, "");
    return location.origin + base + "/proxy?url=";
  }

  function originProxyAlt() {
    var base = location.pathname.replace(/\/[^/]*$/, "");
    return location.origin + base + "/api/chzzk-proxy?url=";
  }

  function isChzzkApiSuccess(data) {
    if (!data || typeof data !== "object") return false;
    if (data.content != null) return true;
    if (Number(data.code) === 200) return true;
    return false;
  }

  function parseChzzkFetchResult(res, text) {
    var data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {}
    if (data && Number(data.code) === 9004) {
      return { ok: false, retry: true, err: new Error("9004") };
    }
    if (res.status === 404 && data && data.error === "not found") {
      return { ok: false, retry: true, err: new Error("proxy not found") };
    }
    if (isChzzkApiSuccess(data)) {
      return { ok: true, data: data };
    }
    if (data && (data.code != null || data.message)) {
      return {
        ok: false,
        retry: true,
        err: new Error((data && data.message) || ("치지직 API " + data.code)),
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        retry: true,
        err: new Error((data && data.message) || (data && data.error) || ("HTTP " + res.status)),
      };
    }
    if (data) return { ok: true, data: data };
    return { ok: false, retry: true, err: new Error("응답 파싱 실패") };
  }

  var runtimeProxies = [];
  var proxyConfigLoaded = false;
  var FETCH_TIMEOUT_MS = 8000;

  function getBroadcastChannelId() {
    try {
      if (global.BangsongChannel && typeof global.BangsongChannel.resolveChannelId === "function") {
        var id = global.BangsongChannel.resolveChannelId();
        if (id && /^[a-f0-9]{32}$/i.test(String(id))) return String(id).toLowerCase();
      }
    } catch (e) {}
    return "";
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var ms = timeoutMs || FETCH_TIMEOUT_MS;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    var opts = options || {};
    opts.signal = ctrl.signal;
    return fetch(url, opts).finally(function () { clearTimeout(timer); });
  }

  async function loadProxyConfig() {
    if (proxyConfigLoaded) return;
    proxyConfigLoaded = true;
    runtimeProxies = DEFAULT_PROXIES.slice();
    // 같은 오리진에 /proxy 또는 /api/chzzk-proxy 같은 자체 백엔드를 배포했다면 우선 사용됩니다.
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1" ||
        /\.vercel\.app$/i.test(location.hostname) || /\.netlify\.app$/i.test(location.hostname)) {
      runtimeProxies.unshift(originProxyAlt());
      runtimeProxies.unshift(originProxyBase());
    }
    runtimeProxies = runtimeProxies.filter(function (v, i, a) {
      return v && a.indexOf(v) === i;
    });
  }

  async function chzzkFetch(apiUrl) {
    if (location.protocol === "file:") {
      throw new Error("file:// 불가");
    }
    await loadProxyConfig();
    var lastErr = null;

    for (var i = 0; i < runtimeProxies.length; i++) {
      try {
        var res = await fetchWithTimeout(runtimeProxies[i] + encodeURIComponent(apiUrl), {
          method: "GET",
          credentials: "omit",
        });
        var text = await res.text();
        var parsed = parseChzzkFetchResult(res, text);
        if (parsed.ok) return parsed.data;
        if (parsed.retry) {
          lastErr = parsed.err;
          continue;
        }
        lastErr = parsed.err || new Error("프록시 실패");
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("프록시 연결 실패");
  }

  var CHAT_CID_CACHE_KEY = "bangsong_chat_channel_id_v1";

  function readChatChannelCache(channelId) {
    var ss = global.BangsongChannelStorage;
    var raw = null;
    if (ss && typeof ss.getItem === "function") {
      raw = ss.getItem(CHAT_CID_CACHE_KEY);
    }
    if (raw === null || raw === "") {
      try {
        raw = localStorage.getItem(CHAT_CID_CACHE_KEY + ":" + channelId);
      } catch (e) {}
    }
    if (!raw) return "";
    try {
      var data = JSON.parse(raw);
      if (data && data.channelId === channelId && data.chatChannelId) {
        return String(data.chatChannelId);
      }
    } catch (e2) {}
    return String(raw || "").trim();
  }

  function writeChatChannelCache(channelId, chatChannelId) {
    if (!channelId || !chatChannelId) return;
    var payload = JSON.stringify({
      channelId: channelId,
      chatChannelId: String(chatChannelId),
      at: Date.now(),
    });
    var ss = global.BangsongChannelStorage;
    if (ss && typeof ss.setItem === "function") {
      ss.setItem(CHAT_CID_CACHE_KEY, payload);
    }
    try {
      localStorage.setItem(CHAT_CID_CACHE_KEY + ":" + channelId, payload);
    } catch (e) {}
  }

  async function fetchLiveStatusContent() {
    var channelId = getBroadcastChannelId();
    if (!channelId) {
      throw new Error("치지직 채널이 설정되지 않았습니다. 홈에서 방송 URL을 입력해 주세요.");
    }
    var urls = [
      "https://api.chzzk.naver.com/polling/v2/channels/" + channelId + "/live-status?_t=" + Date.now(),
    ];
    var lastErr = null;
    for (var i = 0; i < urls.length; i++) {
      try {
        var s = await chzzkFetch(urls[i]);
        if (s && s.content) return s.content;
        if (s && s.code != null && Number(s.code) >= 400) {
          lastErr = new Error((s.message || "live-status") + " (" + s.code + ")");
        }
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return null;
  }

  async function resolveChatChannelId(options) {
    options = options || {};
    var allowOffline = options.allowOffline !== false;
    var channelId = getBroadcastChannelId();
    if (!channelId) {
      throw new Error("치지직 채널이 설정되지 않았습니다. 홈에서 방송 URL을 입력해 주세요.");
    }
    var content = await fetchLiveStatusContent();
    var cid = content && content.chatChannelId;
    if (cid) {
      writeChatChannelCache(channelId, cid);
      return String(cid);
    }
    if (allowOffline) {
      var cached = readChatChannelCache(channelId);
      if (cached) return cached;
    }
    throw new Error("chatChannelId 없음 — 방송 중인지 확인해 주세요");
  }

  function getChatPageUrl() {
    var channelId = getBroadcastChannelId();
    if (!channelId) return "https://chzzk.naver.com/";
    return "https://chzzk.naver.com/live/" + channelId;
  }

  global.ChzzkLiveStatus = {
    get BROADCAST_CHANNEL_ID() {
      return getBroadcastChannelId();
    },
    get CHAT_PAGE_ID() {
      return getBroadcastChannelId();
    },
    get CHANNEL_ID() {
      return getBroadcastChannelId();
    },
    getChatPageUrl: getChatPageUrl,
    chzzkFetch: chzzkFetch,
    fetchLiveStatusContent: fetchLiveStatusContent,
    resolveChatChannelId: resolveChatChannelId,
    readChatChannelCache: readChatChannelCache,
  };
})(typeof window !== "undefined" ? window : global);
