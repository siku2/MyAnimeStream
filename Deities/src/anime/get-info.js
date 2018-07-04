let _animeUidCache;

let animeName;
let animeUID;
let animeEpisodes;


async function findAnimeUID(name) {
    name = name.replace(".", "");
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
    name = name.replace(".", "");
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
    console.debug("set prevLatestEpisode to", animeEpisodes);
    const name = animeName.replace(".", "");
    const update = {};
    update[name + ".uid"] = animeUID;
    update[name + ".latestEpisode"] = animeEpisodes;
    update[name + ".previousLatestEpisode"] = animeEpisodes;
    await postJSON(grobberUrl + "/user/" + username + "/episodes", update);
}


async function getAnimeInfo() {
    animeName = document.querySelector("h1>span[itemprop=name]").innerText;
    animeUID = await findAnimeUID(animeName);

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
