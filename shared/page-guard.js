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

  document.addEventListener("keydown", function (event) {
    var key = String(event.key || "").toLowerCase();
    var blocked =
      event.key === "F12" ||
      (event.ctrlKey && event.shiftKey && ["i", "c", "j"].includes(key)) ||
      (event.ctrlKey && key === "u");
    if (blocked) event.preventDefault();
  });
})();
