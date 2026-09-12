/**
 * 채널별 localStorage 키 — OAuth channelId 기준 격리
 */
(function (global) {
  function resolveChannelId() {
    if (global.BangsongChannel && typeof global.BangsongChannel.resolveChannelId === "function") {
      var cid = global.BangsongChannel.resolveChannelId();
      if (cid) return String(cid).toLowerCase();
    }
    return "";
  }

  function scopedKey(baseKey, channelId) {
    var cid = channelId || resolveChannelId();
    if (!cid) return baseKey;
    return baseKey + ":" + cid;
  }

  function canPersist() {
    return !!resolveChannelId();
  }

  function migrateGlobalToScoped(baseKey, channelId) {
    var key = scopedKey(baseKey, channelId);
    try {
      if (localStorage.getItem(key)) return key;
      var legacy = localStorage.getItem(baseKey);
      if (legacy) {
        localStorage.setItem(key, legacy);
      }
    } catch (e) {}
    return key;
  }

  function migrateLegacyPrefixToScoped(baseKey, legacyPrefix, channelId) {
    var key = scopedKey(baseKey, channelId);
    try {
      if (localStorage.getItem(key)) return key;
      var cid = channelId || resolveChannelId();
      if (!cid) return key;
      var legacyKey = legacyPrefix + cid;
      var legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        localStorage.setItem(key, legacy);
        return key;
      }
      var globalLegacy = localStorage.getItem(baseKey);
      if (globalLegacy) {
        localStorage.setItem(key, globalLegacy);
      }
    } catch (e) {}
    return key;
  }

  function getItem(baseKey, channelId) {
    var key = migrateGlobalToScoped(baseKey, channelId);
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function setItem(baseKey, value, channelId) {
    var cid = channelId || resolveChannelId();
    if (!cid) return false;
    var key = scopedKey(baseKey, cid);
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeItem(baseKey, channelId) {
    var key = scopedKey(baseKey, channelId);
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function matchesBaseKey(eventKey, baseKey) {
    if (!eventKey || !baseKey) return false;
    if (eventKey === baseKey) return true;
    var cid = resolveChannelId();
    return !!cid && eventKey === baseKey + ":" + cid;
  }

  function readJson(baseKey, channelId) {
    var raw = getItem(baseKey, channelId);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeJson(baseKey, value, channelId) {
    try {
      return setItem(baseKey, JSON.stringify(value), channelId);
    } catch (e) {
      return false;
    }
  }

  global.BangsongChannelStorage = {
    resolveChannelId: resolveChannelId,
    scopedKey: scopedKey,
    canPersist: canPersist,
    migrateGlobalToScoped: migrateGlobalToScoped,
    migrateLegacyPrefixToScoped: migrateLegacyPrefixToScoped,
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    matchesBaseKey: matchesBaseKey,
    readJson: readJson,
    writeJson: writeJson,
  };
})(typeof window !== "undefined" ? window : global);
