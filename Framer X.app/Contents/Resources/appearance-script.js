window.hasDarkAppearance = {{ hasDarkAppearance }}

function _setHasDarkAppearance(isDark, thisFrameOnly) {
    window.hasDarkAppearance = isDark
    if (isDark) {
        document.body.classList.add("dark")
    } else {
        document.body.classList.remove("dark")
    }

    // Apply the same appearance to subframes
    if (!thisFrameOnly) {
        for (var i = 0; i < window.frames.length; i++) {
            window.frames[i].postMessage({ appearance: isDark ? "dark" : "light" }, "*")
        }
    }
}

window.addEventListener("message", function(event) {
    if (!event.data || !event.data.appearance) return
    window._setHasDarkAppearance(event.data.appearance === "dark")
})

document.addEventListener("DOMContentLoaded", function() {
    window._setHasDarkAppearance(window.hasDarkAppearance, true)
})
