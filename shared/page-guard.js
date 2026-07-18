(function () {
  if (window.__pageGuardInstalled) return;
  window.__pageGuardInstalled = true;

  document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  document.addEventListener("selectstart", function (event) {
    if (event.target && /INPUT|TEXTAREA/.test(event.target.tagName)) return;
    event.preventDefault();
  });

  document.addEventListener("copy", function (event) {
    if (event.target && /INPUT|TEXTAREA/.test(event.target.tagName)) return;
    event.preventDefault();
  });

  document.addEventListener("dragstart", function (event) {
    event.preventDefault();
  });

  document.addEventListener("keydown", function (event) {
    var key = String(event.key || "").toLowerCase();
    var blocked =
      event.key === "F12" ||
      (event.ctrlKey && event.shiftKey && ["i", "c", "j"].includes(key)) ||
      (event.ctrlKey && ["s", "u"].includes(key));
    if (blocked) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  document.documentElement.dataset.siteGuard = "active";
  console.log(
    "%c脚本.top  SECURE RESOURCE INDEX",
    "padding:8px 12px;border-radius:8px;background:#07111f;color:#38bdf8;font:700 14px monospace"
  );
  console.log("未经授权，请勿复制、镜像或重新分发本站内容。");
})();
