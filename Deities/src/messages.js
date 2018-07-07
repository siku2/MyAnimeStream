import Raven from "raven-js";
import * as Cookies from "js-cookie";

import {anime} from "./api";

export async function showModal(message) {
    alert(message);
}

export function animeNotFound() {
    const animeProvId = anime.name.replace(/\W+/g, "").toLowerCase();
    const cookieName = "already-warned-" + animeProvId;
    if (!Cookies.get(cookieName)) {
        let alertMsg = "Couldn't find \"" + anime.name + "\"!";

        if (Raven.isSetup()) {
            alertMsg += " A report has been created for you and you can expect for this anime to be available soon";
            Raven.captureMessage("Anime \"" + anime.name + "\" not found.", {
                level: "info"
            });
        }
        Cookies.set(cookieName, "true", {
            expires: 1
        });
        return showModal(alertMsg);
    } else {
        console.log("Already warned about missing anime");
        return Promise.resolve();
    }
}