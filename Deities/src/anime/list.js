class AnimeListEntry {
    constructor(el) {
        this.el = el;
    }

    get name() {
        return this.el.find("td.title a.link").text().replace(".", "");
    }

    get link() {
        return this.el.find("td.title a.link").attr("href");
    }

    get uid() {
        return (async () => {
            if (!this._uid) {
                this._uid = await findAnimeUID(this.name);
            }
            return this._uid;
        })();
    }

    get uidValid() {
        return (async () => await this.uid && this._latestEpisode >= 0)();
    }

    get airing() {
        return this.el.find("span.content-status").text().trim() === "Airing";
    }

    get previousLatestEpisode() {
        return isNaN(this._previousLatestEpisode) ? this.latestEpisode : this._previousLatestEpisode;
    }

    set previousLatestEpisode(value) {
        this._previousLatestEpisode = value;
    }

    get latestEpisode() {
        return this._latestEpisode;
    }

    set latestEpisode(value) {
        this._latestEpisode = value;
    }

    get currentEpisode() {
        return parseInt(this.el.find("td.progress span a").text());
    }

    get nUnseenEpisodes() {
        return (this.latestEpisode - this.currentEpisode) || 0;
    }

    get nNewEpisodes() {
        return (this.latestEpisode - this.previousLatestEpisode) || 0;
    }

    removePrevious() {
        this.el.find(".episode-status").remove();
    }

    async show() {
        let text;
        let explanation;
        let onClick;
        let href;
        const classList = ["content-status", "episode-status"];

        if (await this.uidValid) {
            if (this.nNewEpisodes > 0) {
                text = (this.nNewEpisodes === 1) ? "new episode!" : "new episodes!";
                classList.push("new-episode");
                explanation = "There " +
                    ((this.nNewEpisodes === 1) ? "is an episode" : ("are " + this.nNewEpisodes.toString() + " episodes")) +
                    " you haven't watched yet!";
                href = this.link + "/episode/" + (this.currentEpisode + 1).toString();
            } else if (this.nUnseenEpisodes > 0) {
                text = (this.nUnseenEpisodes === 1) ? "unseen episode!" : "unseen episodes!";
                classList.push("unseen-episode");
                explanation = "There " +
                    ((this.nUnseenEpisodes === 1) ? "is an episode" : ("are " + this.nUnseenEpisodes.toString() + " episodes")) +
                    " you haven't watched yet!";
                href = this.link + "/episode/" + (this.currentEpisode + 1).toString();
            }
        }
        else if (await this.uid) {
            text = "uid invalid";
            explanation = "There was a UID cached but the server didn't accept it. Just open the anime page and it should fix itself";
        } else {
            text = "unknown uid";
            explanation = "There was no UID cached. Just open the anime page and it should fix itself";
        }
        if (text) {
            const beforeElement = this.el.find("td.title span.content-status");
            this.removePrevious();
            if (beforeElement.is(":visible")) {
                text = "| " + text;
            }
            let el;
            if (href) {
                el = $("<a></a>").attr("href", href);
            } else {
                el = $("<span></span>");
            }
            el.text(text);
            classList.forEach((cls) => el.addClass(cls));
            if (explanation) {
                el.attr("data-balloon-pos", "up");
                el.attr("data-balloon", explanation);
            }
            if (onClick) {
                el.click(onClick);
            }
            beforeElement.after(el);
        }
    }
}

async function getCurrentlyWatchingAnimeList() {
    let allEntries;
    while (!allEntries || allEntries.length <= 1) {
        allEntries = $("table.list-table tbody.list-item");
        await sleep(100);
    }
    const watching = allEntries.filter((idx, el) => $(el).find("td.data.status").hasClass("watching"));
    const watchingList = [];
    for (const el of watching) {
        watchingList.push(new AnimeListEntry($(el)));
    }
    return watchingList;
}

async function displayCachedAnimeList(list) {
    if (!username) {
        console.log("not logged in -> not caching anime list");
    }
    const resp = await $.getJSON(grobberUrl + "/user/" + username + "/episodes");
    const cachedList = resp.episodes;
    if (!cachedList) {
        console.debug("No Anime List cached");
        return;
    }
    for (const anime of list) {
        const cachedAnime = cachedList[anime.name];
        if (cachedAnime) {
            anime._uid = cachedAnime.uid;
            anime.latestEpisode = cachedAnime.latestEpisode;
            anime.previousLatestEpisode = cachedAnime.previousLatestEpisode;
            anime.show();
        }
    }
}

async function cacheAnimeList(list) {
    if (!username) {
        console.log("not logged in -> not caching anime list");
    }

    const cachedList = {};
    for (const anime of list) {
        cachedList[anime.name] = {
            uid: anime._uid,
            latestEpisode: anime.latestEpisode,
            previousLatestEpisode: anime.previousLatestEpisode
        };
    }
    await postJSON(grobberUrl + "/user/" + username + "/episodes", cachedList);
}

async function highlightAnimeWithUnwatchedEpisodes() {
    injectBalloonCSS();
    $.injectCSS({
        ".episode-status.new-episode": {
            "font-weight": "bolder",
            color: "#787878" + " !important"
        }
    });

    const watchingList = await getCurrentlyWatchingAnimeList();

    const cacheDisplayPromise = displayCachedAnimeList(watchingList);

    const uids = {};
    for (const item of watchingList) {
        if (await item.uid) {
            uids[await item.uid] = item;
        }
    }
    const resp = await postJSON(grobberUrl + "/anime/episode-count", Object.keys(uids));
    if (!resp.success) {
        console.warn("Got turned down when asking for episode counts: ", resp);
        return;
    }

    await cacheDisplayPromise;
    Object.entries(resp.anime).forEach(([uid, epCount]) => uids[uid].latestEpisode = epCount);
    watchingList.forEach((anime) => anime.show());

    cacheAnimeList(watchingList);
}