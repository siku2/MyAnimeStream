import $ from "jquery";
import Plyr from "plyr";

import config from "../../../config";
import {anime, prefetchNextEpisode} from "../../../api";
import {grobberUrl} from "../../../constants";
import {currentURL} from "../../../core";

let currentPlayer;
let currentEpisodeIndex;

async function finishedEpisode() {
    if (!await config.updateAnimeStatus) {
        console.log("Not updating anime status because of user settings");
    }
    console.log("finished Episode");
}

async function onVideoEnd() {
    await finishedEpisode();
    if (currentEpisodeIndex + 1 < anime.episodesAvailable) {
        const url = new URL((currentEpisodeIndex + 2).toString(), window.location.href);
        url.searchParams.set("autoplay", "true");
        window.location.href = url.toString();
    } else {
        console.log("reached the last episode");
    }
}

async function onPageLeave() {
    if (!currentPlayer.ended) {
        const percentage = currentPlayer.currentTime / currentPlayer.duration;
        const minPercentage = await config.minWatchPercentageForSeen;
        if (percentage > minPercentage) {
            console.log("Left page with video at " + Math.round(100 * percentage).toString() + "% Counting as finished!");
            await finishedEpisode();
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("autoplay");
        history.pushState(null, null, url.toString());
    }
}

function setupPlyr() {
    const playerEl = document.getElementById("player");
    if (playerEl) {
        currentPlayer = new Plyr("#player");

        if (currentURL.searchParams.get("autoplay") === "true") {
            currentPlayer.play();
        }

        currentPlayer.on("ended", onVideoEnd);
        window.addEventListener("beforeunload", onPageLeave);
    } else {
        console.warn("Couldn't find player, assuming this is an iframe!");
    }
}


export default async function showAnimeEpisode(episodeIndex) {
    currentEpisodeIndex = episodeIndex;

    console.log("Creating video embed");
    const html = await $.get(grobberUrl + "/templates/player/" + anime.uid + "/" + episodeIndex.toString());
    $(html).insertAfter("div.unit-summary");
    setupPlyr();

    prefetchNextEpisode(episodeIndex);
}
