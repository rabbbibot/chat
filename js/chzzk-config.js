/**
 * 치지직 채팅 연동 공통 설정 — 방송 도우미
 * channel-settings.js 를 먼저 로드해야 합니다.
 */
(function (global) {
  var SITE_ORIGIN = "http://127.0.0.1:5600";
  var WORKER_PROXY = "https://muddy-dew-207b.sarahhha96.workers.dev/?url=";

  var DEFAULT_PROXIES = [
    WORKER_PROXY,
  ];

  function originProxyBase() {
    var base = location.pathname.replace(/\/[^/]*$/, "");
    return location.origin + base + "/proxy?url=";
  }

  function originProxyAlt() {
    var base = location.pathname.replace(/\/[^/]*$/, "");
    return location.origin + base + "/api/chzzk-proxy?url=";
  }

  function isSameOriginProxy(url) {
    if (!url || location.protocol === "file:") return false;
    try {
      return new URL(String(url), location.origin).origin === location.origin;
    } catch (e) {
      return false;
    }
  }

  var CHZZK_HEADERS = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: "https://chzzk.naver.com/",
    Origin: "https://chzzk.naver.com"
  };

  var runtimeProxies = null;
  var proxyConfigLoaded = false;
  var FETCH_TIMEOUT_MS = 12000;

  function resolveChannelId() {
    if (global.BangsongChannel) {
      return global.BangsongChannel.resolveChannelId() || "";
    }
    return "";
  }

  function resolveMeta() {
    if (global.BangsongChannel) {
      return global.BangsongChannel.getMeta();
    }
    return null;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var ms = timeoutMs || FETCH_TIMEOUT_MS;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    var opts = options || {};
    opts.signal = ctrl.signal;
    return fetch(url, opts).finally(function () { clearTimeout(timer); });
  }

  function getProxyBase() {
    var hash = location.hash.slice(1);
    if (hash) {
      var proxyMatch = hash.match(/(?:^|&)proxy=([^&]*)/);
      if (proxyMatch && proxyMatch[1]) {
        return decodeURIComponent(proxyMatch[1].replace(/\+/g, " "));
      }
    }
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      return originProxyBase();
    }
    if (/\.vercel\.app$/i.test(location.hostname) || /\.netlify\.app$/i.test(location.hostname)) {
      return originProxyBase();
    }
    return WORKER_PROXY;
  }

  function pageUrl(name) {
    if (location.protocol !== "file:" && location.hostname) {
      var base = location.pathname.replace(/\/[^/]*$/, "");
      return location.origin + base + "/" + name;
    }
    return SITE_ORIGIN + "/" + name;
  }

  async function loadProxyList() {
    if (proxyConfigLoaded && runtimeProxies) return runtimeProxies;
    proxyConfigLoaded = true;
    var list = DEFAULT_PROXIES.slice();
    try {
      var base = location.pathname.replace(/\/[^/]*$/, "");
      var res = await fetchWithTimeout(
        location.origin + base + "/chzzk-proxy.json?t=" + Date.now(),
        { method: "GET", credentials: "omit" },
        5000
      );
      var j = await res.json();
      if (j && j.krProxy) list.unshift(j.krProxy);
      if (j && Array.isArray(j.proxies)) {
        j.proxies.forEach(function (p) { list.unshift(p); });
      }
    } catch (e) {}
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      list.unshift(originProxyBase());
      list.unshift(originProxyAlt());
    } else if (/\.vercel\.app$/i.test(location.hostname) || /\.netlify\.app$/i.test(location.hostname)) {
      list.unshift(originProxyBase());
      list.unshift(originProxyAlt());
    }
    runtimeProxies = list.filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    runtimeProxies.sort(function (a, b) {
      var ao = isSameOriginProxy(a) ? 0 : 1;
      var bo = isSameOriginProxy(b) ? 0 : 1;
      return ao - bo;
    });
    return runtimeProxies;
  }

  function isChzzkApiSuccess(data) {
    if (!data || typeof data !== "object") return false;
    if (data.content != null) return true;
    if (Number(data.code) === 200) return true;
    return false;
  }

  function parseChzzkResponse(res, text) {
    var data = null;
    try { data = JSON.parse(text); } catch (e) {}
    if (data && Number(data.code) === 9004) {
      return { ok: false, err: new Error("치지직 해외 IP 차단(9004)") };
    }
    if (res.status === 404 && data && data.error === "not found") {
      return { ok: false, err: new Error("proxy not found") };
    }
    if (isChzzkApiSuccess(data)) {
      return { ok: true, data: data };
    }
    if (data && (data.code != null || data.message)) {
      return {
        ok: false,
        err: new Error((data && data.message) || ("치지직 API " + data.code)),
      };
    }
    if (!res.ok) {
      return { ok: false, err: new Error((data && data.message) || (data && data.error) || ("HTTP " + res.status)) };
    }
    if (!data) {
      return { ok: false, err: new Error("치지직 응답 파싱 실패") };
    }
    return { ok: true, data: data };
  }

  async function requestChzzk(apiUrl, mode) {
    if (mode === "direct") {
      return fetchWithTimeout(apiUrl, { method: "GET", headers: CHZZK_HEADERS, credentials: "omit" });
    }
    return fetchWithTimeout(getProxyBase() + encodeURIComponent(apiUrl), { method: "GET", credentials: "omit" });
  }

  async function chzzkFetch(apiUrl) {
    if (location.protocol === "file:") {
      throw new Error("file:// 로는 동작하지 않습니다. " + SITE_ORIGIN + " 에서 열어 주세요.");
    }

    var isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    var lastErr = null;
    var proxies = await loadProxyList();

    for (var i = 0; i < proxies.length; i++) {
      try {
        var proxied = await fetchWithTimeout(proxies[i] + encodeURIComponent(apiUrl), {
          method: "GET",
          credentials: "omit"
        });
        var proxiedText = await proxied.text();
        var parsed = parseChzzkResponse(proxied, proxiedText);
        if (parsed.ok) return parsed.data;
        lastErr = parsed.err;
      } catch (e) {
        lastErr = e;
      }
    }

    if (isLocal) {
      for (var j = 0; j < 2; j++) {
        try {
          var mode = j === 0 ? "proxy" : "direct";
          var res = await requestChzzk(apiUrl, mode);
          var text = await res.text();
          var localParsed = parseChzzkResponse(res, text);
          if (localParsed.ok) return localParsed.data;
          lastErr = localParsed.err;
        } catch (e) {
          lastErr = e;
        }
      }
    }

    var msg = (lastErr && lastErr.message) ? lastErr.message : "치지직 API 연결 실패";
    if (msg.indexOf("abort") >= 0 || (lastErr && lastErr.name === "AbortError")) {
      msg = "치지직 API 시간 초과 — 네트워크를 확인해 주세요";
    }
    throw new Error(msg);
  }

  function requireChannelId() {
    var id = resolveChannelId();
    if (!id) {
      throw new Error("치지직 채널이 설정되지 않았습니다. 홈에서 방송 URL을 입력해 주세요.");
    }
    return id;
  }

  global.ChzzkConfig = {
    getChannelId: resolveChannelId,
    requireChannelId: requireChannelId,
    get BROADCAST_URL() {
      var meta = resolveMeta();
      return meta ? meta.broadcastUrl : "";
    },
    get CHANNEL_ID() {
      return resolveChannelId();
    },
    get CHAT_PAGE_ID() {
      return resolveChannelId();
    },
    get CHAT_PAGE_URL() {
      var meta = resolveMeta();
      return meta ? meta.chatPageUrl : "";
    },
    SITE_ORIGIN: SITE_ORIGIN,
    getProxyBase: getProxyBase,
    chzzkFetch: chzzkFetch,
    songRequestUrl: function () { return pageUrl("song-request.html"); },
    liveChatUrl: function () { return pageUrl("live-chat.html"); }
  };
})(typeof window !== "undefined" ? window : global);
