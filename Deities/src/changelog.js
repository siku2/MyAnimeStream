import $ from "jquery";

import {username} from "./api";
import config from "./config";
import {grobberUrl} from "./constants";
import {versionBiggerThan} from "./utils";

async function closeChangelog() {
    $("div.changelog-popup").remove();
    await config.set("lastVersion", GM_info.script.version);
    console.log("updated version");
}

async function showChangelog(toVersion, fromVersion) {
    const html = await $.get(grobberUrl + "/templates/changelog/" + fromVersion + "/" + toVersion);
    if (html.success === false) {
        console.log("no changes to show");
        return;
    }
    $.injectCSS({
        ".changelog-popup": {
            position: "fixed",
            "z-index": "2000",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "90%",
            "box-shadow": "0 0 100vh 10vh hsla(0, 5%, 4%, 0.7)"
        }
    });
    $("<div class='changelog-popup'></div>")
        .html(html)
        .appendTo("body");
    $("button.close-changelog-btn").click(closeChangelog);
}


export default async function checkForUpdate() {
    const localVersion = GM_info.script.version;
    if (username) {
        const remoteVersion = await config.lastVersion;
        if (!remoteVersion) {
            console.log("No remote version... Setting to", localVersion);
            await config.set("lastVersion", localVersion);
            return;
        }

        if (versionBiggerThan(localVersion, remoteVersion)) {
            console.log("showing changelog");
            await showChangelog(localVersion, remoteVersion);
        } else {
            console.debug("no new version");
        }
    } else {
        console.log("not checking for update because user isn't logged in");
    }

}