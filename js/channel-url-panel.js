/**
 * 로그인 없이 치지직 채팅/방송 URL을 입력해 채널을 연결하는 패널.
 * channel-settings.js(BangsongChannel)를 먼저 로드해야 합니다.
 */
(function () {
  function dispatchChannelUpdated() {
    try { window.dispatchEvent(new CustomEvent("bangsong-channel-updated")); } catch (e) {}
  }

  function init() {
    var input = document.getElementById("channel_url_input");
    var btn = document.getElementById("channel_url_save");
    var status = document.getElementById("channel_url_status");
    if (!input || !btn || !status || !window.BangsongChannel) return;

    function setStatus(text, level) {
      status.textContent = text;
      status.className = "channel-settings-status" + (level ? " " + level : "");
    }

    function kindLabel(kind) {
      return kind === "chat" ? "채팅 링크" : "채널 ID";
    }

    function prefill() {
      var rec = window.BangsongChannel.loadStoredRecord();
      var fromQuery = window.BangsongChannel.getChannelInfoFromQuery();
      if (fromQuery) {
        input.value = fromQuery.id;
        setStatus("URL 파라미터로 연결됨 · " + kindLabel(fromQuery.kind) + ": " + fromQuery.id, "ok");
        return;
      }
      if (rec && rec.channelId) {
        input.value = rec.sourceInput || rec.channelId;
        setStatus("연결됨 · " + kindLabel(rec.kind) + ": " + rec.channelId, "ok");
        return;
      }
      setStatus("아직 연결된 채널이 없습니다.", "warn");
    }

    function save() {
      var result = window.BangsongChannel.save(input.value, { connectionEnabled: true });
      if (!result.ok) {
        setStatus(result.error || "치지직 채팅/방송 URL을 확인해 주세요.", "err");
        return;
      }
      setStatus("연결됨 · " + kindLabel(result.record.kind) + ": " + result.record.channelId, "ok");
      dispatchChannelUpdated();
    }

    btn.addEventListener("click", save);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") save();
    });

    prefill();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
