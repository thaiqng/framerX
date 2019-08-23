;(function setup() {
    var sentryId = "66e90dac3a594415ba30098b9f9fcac4"
    var sentryServer = "https://app.getsentry.com/92817"

    // Template variables, replaced by Framer.
    var proxyServer = "{{ proxy }}"
    var userEmail = "{{ userEmail }}"
    var userName = "{{ userName }}"
    var userId = "{{ userId }}"

    // Add the Sentry key to the server URL.
    var dsn = proxyServer.replace("://", "://" + sentryId + "@") + "/" + sentryServer

    if (!window.Raven) {
        console.log("Raven not loaded, skipping Sentry setup (this is likely a debug build)")
        return
    }

    console.log("Loading Sentry for", dsn)

    // Configure Sentry
    Raven.config(dsn, {
        environment: Vekter.build.type,
        release: Vekter.build.hash,
        ignoreErrors: ["Component exceeded time limit"],
        dataCallback: function(data) {
            data.extra["document"] = JSON.stringify(Vekter.serializeDocument())
            return data
        },
    }).install()

    // Set user context.
    Raven.setUserContext({
        email: userEmail,
        namer: userName,
        id: userId,
    })

    // Show bug report dialog when ctrl-alt-cmd-B is pressed.
    window.addEventListener("keydown", function(event) {
        if (event.metaKey && event.ctrlKey && event.altKey && String.fromCharCode(event.which) === "B") {
            var report = prompt("What’s wrong?")
            if (report !== null) {
                Raven.captureMessage(report)
            }
            event.preventDefault()
        }
    })
})()
