let _animeUidCache;

let animeName;
let animeUID;
let animeEpisodes;
let animeStatus;


async function findAnimeUID(name) {
    if (!_animeUidCache) {
        _animeUidCache = JSON.parse(localStorage.getItem("AnimeUIDs")) || {};
    }
    const dub = await config.dub;
    const cat = _animeUidCache[dub ? "dub" : "sub"];
    if (cat) {
        return cat[name];
    }
}

async function setAnimeUID(name, uid) {
    const dub = (await config.dub) ? "dub" : "sub";
    _animeUidCache = JSON.parse(localStorage.getItem("AnimeUIDs")) || {};
    const cat = _animeUidCache[dub];
    if (cat) {
        cat[name] = uid;
    } else {
        _animeUidCache[dub] = {[name]: uid};
    }

    localStorage.setItem("AnimeUIDs", JSON.stringify(_animeUidCache));
}

async function updatePreviousLastEpisode() {
    if (animeStatus !== "WATCHING") {
        console.log("Not watching anime");
        return;
    }

    console.debug("setting prevLatestEpisode to", animeEpisodes);
    const name = safeMongoKey(animeName);
    const update = {};
    update[name + ".uid"] = animeUID;
    update[name + ".latestEpisode"] = animeEpisodes;
    update[name + ".previousLatestEpisode"] = animeEpisodes;
    await postJSON(grobberUrl + "/user/" + username + "/episodes", update);
}


function determineAnimeStatus() {
    if (document.querySelector("a#myinfo_status")) {
        animeStatus = "ABSENT";
    } else {
        animeStatus = document.querySelector("select#myinfo_status > [selected]").text.toUpperCase();
    }
}


async function getAnimeInfo() {
    animeName = document.querySelector("h1>span[itemprop=name]").innerText;
    animeUID = await findAnimeUID(animeName);

    determineAnimeStatus();

    let data;
    if (animeUID) {
        data = await $.getJSON(grobberUrl + "/anime/" + animeUID);
        if (!data.success) {
            console.warn("Unsuccessful request for uid \"" + animeUID + "\":", data);
        }
    } else {
        console.log("Searching for anime", animeName);
        const result = await $.getJSON(grobberUrl + "/search/" + animeName, {
            dub: await config.dub
        });
        if (!result.success || result.anime.length === 0) {
            console.error("Couldn't find anime \"" + animeName + "\"");
            return false;
        }

        console.log("got answer", result);
        data = result.anime[0].anime;
        animeUID = data.uid;
        await setAnimeUID(animeName, animeUID);
    }
    animeEpisodes = data.episodes;
    updatePreviousLastEpisode();
    return true;
}
