/**
 * 래비의 방송도우미 — 화면 중앙 confirm / alert
 */
(function (global) {
  var activeResolve = null;
  var built = false;

  function ensureDom() {
    if (built) return;
    built = true;
    var root = document.createElement("div");
    root.id = "bangsongDialog";
    root.className = "bangsong-dialog";
    root.hidden = true;
    root.innerHTML =
      '<div class="bangsong-dialog-backdrop" data-dialog-cancel="1"></div>' +
      '<div class="bangsong-dialog-box" role="dialog" aria-modal="true" aria-labelledby="bangsongDialogMessage">' +
        '<p class="bangsong-dialog-message" id="bangsongDialogMessage"></p>' +
        '<div class="bangsong-dialog-actions">' +
          '<button type="button" class="bangsong-dialog-btn cancel" data-dialog-cancel="1">취소</button>' +
          '<button type="button" class="bangsong-dialog-btn ok" data-dialog-ok="1">확인</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-dialog-ok]")) {
        e.preventDefault();
        closeDialog(true);
      } else if (e.target.closest("[data-dialog-cancel]")) {
        e.preventDefault();
        closeDialog(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!activeResolve || root.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        closeDialog(true);
      }
    });
  }

  function closeDialog(result) {
    if (!activeResolve) return;
    var resolve = activeResolve;
    activeResolve = null;
    var root = document.getElementById("bangsongDialog");
    if (root) root.hidden = true;
    document.body.classList.remove("bangsong-dialog-open");
    resolve(!!result);
  }

  function openDialog(message, mode) {
    ensureDom();
    return new Promise(function (resolve) {
      activeResolve = resolve;
      var root = document.getElementById("bangsongDialog");
      var msgEl = document.getElementById("bangsongDialogMessage");
      var cancelBtn = root.querySelector(".bangsong-dialog-btn.cancel");
      msgEl.textContent = String(message || "");
      cancelBtn.hidden = mode !== "confirm";
      root.hidden = false;
      document.body.classList.add("bangsong-dialog-open");
      var focusBtn = mode === "confirm" ? cancelBtn : root.querySelector(".bangsong-dialog-btn.ok");
      if (focusBtn) focusBtn.focus();
    });
  }

  function alert(message) {
    return openDialog(message, "alert").then(function () {});
  }

  function confirm(message) {
    return openDialog(message, "confirm");
  }

  global.BangsongDialog = {
    alert: alert,
    confirm: confirm,
  };

  global.alert = function (message) {
    alert(message);
  };
})((typeof window !== "undefined") ? window : global);
