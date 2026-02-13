(function () {
  function ensureContainer() {
    var id = 'error-guard-banner'
    var existing = document.getElementById(id)
    if (existing) return existing
    var el = document.createElement('div')
    el.id = id
    el.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:2147483647;display:none'
    var inner = document.createElement('div')
    inner.style.cssText = 'background:#1f2937;color:#fff;border-radius:8px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.2);font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial'
    var row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:12px;align-items:flex-start'
    var msg = document.createElement('div')
    msg.setAttribute('data-msg', '1')
    msg.style.cssText = 'flex:1;min-width:0'
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = '关闭'
    btn.style.cssText = 'border:0;background:#111827;color:#fff;border-radius:6px;padding:6px 10px;cursor:pointer'
    btn.onclick = function () {
      el.style.display = 'none'
    }
    row.appendChild(msg)
    row.appendChild(btn)
    inner.appendChild(row)
    el.appendChild(inner)
    document.body.appendChild(el)
    return el
  }

  function show(message) {
    try {
      var el = ensureContainer()
      var msg = el.querySelector('[data-msg]')
      if (msg) msg.textContent = message
      el.style.display = 'block'
    } catch (e) {}
  }

  window.addEventListener('error', function (event) {
    try {
      var message = event && event.message ? event.message : '发生未知错误'
      show('页面发生错误：' + message + '。你可以尝试刷新页面。')
    } catch (e) {}
  })

  window.addEventListener('unhandledrejection', function (event) {
    try {
      var reason = event && event.reason ? String(event.reason) : 'Promise 未处理拒绝'
      show('页面发生错误：' + reason + '。你可以尝试刷新页面。')
    } catch (e) {}
  })
})()

