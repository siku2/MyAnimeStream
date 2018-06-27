async function postJSON(url, data) {
    return await $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        data: JSON.stringify(data)
    });
}

function sleep(timeout) {
    return new Promise(res => setTimeout(res, timeout));
}

function _animeNotFoundMsg() {
    const animeProvId = animeName.replace(/\W+/g, "").toLowerCase();
    console.log(animeProvId);
    const cookieName = "already-warned-" + animeProvId;
    if (!Cookies.get(cookieName)) {
        let alertMsg = "Couldn't find \"" + animeName + "\"!";
        if (Raven.isSetup()) {
            alertMsg += " A report has been created for you and you can expect for this anime to be available soon";
            Raven.captureMessage("Anime \"" + animeName + "\" not found.", {
                level: "info"
            });
        }
        Cookies.set(cookieName, "true", {
            expires: 1
        });
        alert(alertMsg);
    } else {
        console.log("Already warned about missing anime");
    }
}

function injectBalloonCSS() {
    const link = "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/balloon-css/0.5.0/balloon.min.css\">";
    $(link).appendTo("head");
}

function versionBiggerThan(a, b) {
    if (a === b) {
        return null;
    }

    const a_components = a.split(".");
    const b_components = b.split(".");
    const len = Math.min(a_components.length, b_components.length);

    for (let i = 0; i < len; i++) {
        if (parseInt(a_components[i]) > parseInt(b_components[i])) {
            return true;
        }
        if (parseInt(a_components[i]) < parseInt(b_components[i])) {
            return false;
        }
    }

    if (a_components.length > b_components.length) {
        return true;
    }

    if (a_components.length < b_components.length) {
        return false;
    }
}

$(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
    Raven.captureMessage(thrownError || jqXHR.statusText, {
        extra: {
            type: ajaxSettings.type,
            url: ajaxSettings.url,
            data: ajaxSettings.data,
            status: jqXHR.status,
            error: thrownError || jqXHR.statusText,
            response: jqXHR.responseText.substring(0, 100)
        }
    });
});