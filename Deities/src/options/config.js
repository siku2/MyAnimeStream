const default_config = {
    lastVersion: null,
    dub: false,
    replaceStream: true,
    updateAnimeStatus: true,
    minWatchPercentageForSeen: .75
};

const _config = {
    async set(prop, value) {
        _config[prop] = value;
        await saveConfig();
    }
};
let _configReady = false;
let _configLoader;

const _configHandler = {
    get(obj, prop) {
        if (prop in obj && Object.keys(default_config).indexOf(prop) < 0) {
            return obj[prop];
        } else {
            return (async () => {
                if (!_configReady) {
                    if (!_configLoader) {
                        _configLoader = loadConfig();
                    }
                    await _configLoader;
                    _configReady = true;
                }
                if (prop === "all") {
                    return _config;
                }
                return _config[prop];
            })();
        }
    }
};

const config = new Proxy(_config, _configHandler);


async function loadConfig() {
    Object.assign(_config, default_config);

    if (username) {
        let resp;
        try {
            resp = await $.getJSON(grobberUrl + "/user/" + username + "/config");
        } catch (e) {
            console.warn("couldn't load config");
            Raven.captureMessage("Couldn't retrieve config.", {
                level: "warning",
                extra: {
                    error: e
                }
            });
        }

        if (resp && resp.success) {
            Object.assign(_config, resp.config);
            console.log("loaded config");
        }
    } else {
        console.warn("Can't load config (user not logged in)");
    }
}


async function saveConfig() {
    if (username) {
        console.debug("saving config");
        const resp = await postJSON(grobberUrl + "/user/" + username + "/config", _config);

        if (resp.success) {
            console.log("saved config");
            return true;
        } else {
            Raven.captureMessage("Couldn't save config.", {
                level: "warning",
                extra: {
                    response: resp
                }
            });
            return false;
        }
    } else {
        console.warn("can't save config (user not logged in)");
    }
}
