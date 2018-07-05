const settingPaths = ["/editprofile.php", "/notification/setting", "/ownlist/style", "/account/payment"];

const PageEnum = Object.freeze({
    UNKNOWN: -1,
    GENERAL: 0,
    SETTINGS: 1,
    ANIMELIST: 2,
    ANIME: 100,
    ANIMEDETAILS: 101,
    EPISODES: 102,
    EPISODE: 103
});

let currentPage;

async function routeAnimePage(path) {
    const foundAnimeInfo = await getAnimeInfo();
    if (!foundAnimeInfo) {
        _animeNotFoundMsg();
        return;
    }

    patchNoEpisodeTab();

    if (path.match(/^\/anime\/\d+\/[\w-]+\/?$/)) {
        currentPage = PageEnum.ANIMEDETAILS;
        showAnimeDetails();
    } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/?$/)) {
        currentPage = PageEnum.EPISODES;
        showAnimeEpisodes();
    } else if (path.match(/^\/anime\/\d+\/[\w-]+\/episode\/\d+\/?$/)) {
        currentPage = PageEnum.EPISODE;
        showAnimeEpisode();
    } else {
        console.warn("Unknown anime page");
    }
}


async function route() {
    const path = window.location.pathname;
    const params = window.location.search;

    if (settingPaths.indexOf(path) > -1) {
        addSettingsButton();
    }

    if (path.match(/^\/anime\/\d+\/[\w-]+\/?/)) {
        routeAnimePage(path, params);
    } else if (path.match(/^\/animelist\/\w+$/)) {
        currentPage = PageEnum.ANIMELIST;
        showAnimeList();
    } else if (path.match(/^\/editprofile\.php$/) && params.match(/^\?go=myanimestream$/)) {
        currentPage = PageEnum.SETTINGS;
        showSettings();
    } else {
        currentPage = PageEnum.UNKNOWN;
    }

    changelogCheckVersion();
}
