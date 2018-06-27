let currentURL;
let username;

function addUserContext() {
    if (Raven.isSetup()) {
        username = unsafeWindow.MAL.USER_NAME;
        if (username) {
            console.log("Set user context for", username);
            Raven.setUserContext({
                username: username,
                mobile: isMobilePage()
            });
        } else {
            console.log("Not logged in");
        }
    }
}


function init() {
    currentURL = new URL(window.location.href);
    setupPlatform();

    observe();

    addUserContext();

    route();
}

function _init() {
    $(init);
}

if (ravenDSN) {
    Raven.config(ravenDSN, {
        release: GM_info.script.version,
        tags: {
            manager_version: GM_info.version
        },
        ignoreErrors: [
            /{"isTrusted":(true|false)}/g,
            "rubiconClickTracking is not defined"
        ]
    }).install();

    console.info("Using Raven DSN!");
    Raven.context(_init);
} else {
    console.warn("No Raven DSN provided, not installing!");
    _init();
}
