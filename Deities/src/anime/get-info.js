let _animeUidCache;

let animeName;
let animeUID;
let animeEpisodes;


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

function updatePreviousLastEpisode() {
    const cachedList = JSON.parse(localStorage.getItem("cachedAnimeList"));
    if (cachedList) {
        const cachedAnime = cachedList[animeName];
        if (cachedAnime) {
            console.debug("set prevLatestEpisode to", animeEpisodes);
            cachedAnime.previousLatestEpisode = animeEpisodes;
        }
    }
    localStorage.setItem("cachedAnimeList", JSON.stringify(cachedList));
}


async function getAnimeInfo() {
    animeName = document.querySelector("h1>span[itemprop=name]").innerText;
    animeUID = await findAnimeUID(animeName);

    if (animeUID) {
        const data = await $.getJSON(grobberUrl + "/anime/" + animeUID);
        if (data.success) {
            animeEpisodes = data.episodes;
            updatePreviousLastEpisode();
            return true;
        } else {
            console.warn("Unsuccessful request for uid \"" + animeUID + "\":", data);
        }
    }
    console.log("Searching for anime", animeName);
    const result = await $.getJSON(grobberUrl + "/search/" + animeName, {
        dub: await config.dub
    });
    if (!result.success || result.anime.length === 0) {
        console.error("Couldn't find anime \"" + animeName + "\"");
        return false;
    }

    console.log("got answer", result);
    const data = result.anime[0].anime;
    animeUID = data.uid;
    animeEpisodes = data.episodes;
    updatePreviousLastEpisode();
    await setAnimeUID(animeName, animeUID);
    return true;
}
