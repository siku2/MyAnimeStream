import * as animePage from "./pages/anime/_router";
import {sleep} from "../utils";

async function waitForSelector(selector, timeout) {
    let result = document.querySelector(selector);
    while (!result) {
        await sleep(timeout);
        result = document.querySelector(selector);
    }
    return result;
}

async function watchUrl(callback) {
    console.log("starting url watcher");
    let currentHref = location.href;
    while (true) {
        if (location.href !== currentHref) {
            console.log("URL changed");
            callback();
            currentHref = location.href;

        }
        await sleep(100);
    }
}

let _urlWatcher;

export async function route(path) {
    console.debug("waiting for Kitsu");
    await waitForSelector("div.ember-view", 20);
    console.info("Kitsu loaded");

    if (!_urlWatcher) {
        _urlWatcher = watchUrl(() => route(location.pathname));
    }

    if (path.match(/^\/anime\/[\w-]+/)) {
        await animePage.route(path.replace(/^\/anime\/[\w-]+/, ""));
    }
}