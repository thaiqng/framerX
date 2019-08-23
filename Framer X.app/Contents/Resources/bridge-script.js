window._webkit = {}
window._framerServiceEndpoints = {{ appServicesConfig }}

window._webkit.webViewBridge_ = function(data) {
    webkit.messageHandlers._webkit.postMessage(data)
}

window._bridge = function(method, args) {
    window._webkit.webViewBridge_(JSON.stringify({ method: method, arguments: args }))
}

document.addEventListener("DOMContentLoaded", function() {
    window._bridge("DOMContentLoaded")
})

window.addEventListener("error", function(event) {
    window._bridge("error", event)
})
