class AnimeListEntry {
    constructor(el) {
        this.el = el;
    }

    get name() {
        return this.el.find("td.title a.link").text();
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
        return (async () => await this.uid && this._latestEpisode !== undefined)();
    }

    get airing() {
        return this.el.find("span.content-status").text().trim() === "Airing";
    }

    get latestEpisode() {
        return this._latestEpisode
    }

    set latestEpisode(value) {
        this._latestEpisode = value
    }

    get currentEpisode() {
        return parseInt(this.el.find("td.progress span a").text());
    }

    get nNewEpisodes() {
        if (!this.latestEpisode) {
            return 0;
        }
        return this.latestEpisode - this.currentEpisode;
    }

    async show() {
        let text;
        let explanation;
        let onClick;
        const classList = ["content-status", "episode-status"];

        if (await this.uidValid) {
            if (this.nNewEpisodes > 0) {
                if (this.airing) {
                    text = (this.nNewEpisodes === 1) ? "new episode!" : "new episodes!";
                    classList.push("new-episode");
                    explanation = "There " +
                        ((this.nNewEpisodes === 1) ? "is an episode" : ("are " + this.nNewEpisodes.toString() + " episodes")) +
                        " you haven't watched yet!";
                    onClick = () => window.location.pathname = this.link + "/episode/" + (this.currentEpisode + 1).toString();
                }
            }
        }
        else if (await this.uid) {
            text = "uid invalid";
            explanation = "There was an UID cached but the server didn't accept it. Just open the anime page and it should fix itself";
        } else {
            text = "unknown uid";
            explanation = "There was no UID cached. Just open the anime page and it should fix itself";
        }
        if (text) {
            const beforeElement = this.el.find("td.title span.content-status");
            if (beforeElement.is(":visible")) {
                text = "| " + text;
            }
            const el = $("<span></span>").text(text);
            classList.forEach(cls => el.addClass(cls));
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

function displayCachedAnimeList(list) {
    const cachedList = JSON.parse(localStorage.getItem("cachedAnimeList"));
    if (!cachedList) {
        console.debug("No Anime List cached");
        return;
    }
    for (const anime of list) {
        const cachedAnime = cachedList[anime.name];
        if (cachedAnime) {
            anime._uid = cachedAnime.uid;
            anime._latestEpisode = cachedAnime.latestEpisode;
            anime.show();
        }
    }
}

function cacheAnimeList(list) {
    const cachedList = {};
    for (const anime of list) {
        cachedList[anime.name] = {uid: anime._uid, latestEpisode: anime._latestEpisode};
    }
    localStorage.setItem("cachedAnimeList", JSON.stringify(cachedList));
}

async function highlightAnimeWithUnwatchedEpisodes() {
    injectBalloonCSS();
    $.injectCSS({
        "span.episode-status.new-episode": {
            "font-weight": "bolder",
            color: "#787878" + " !important"
        }
    });
    
    const watchingList = await getCurrentlyWatchingAnimeList();

    displayCachedAnimeList(watchingList);

    const uids = {};
    for (item of watchingList) {
        if (await item.uid) {
            uids[await item.uid] = item;
        }
    }
    const resp = await postJSON(grobberUrl + "/anime/episode-count", Object.keys(uids));
    if (!resp.success) {
        console.warn("Got turned down when asking for episode counts: ", resp);
        return;
    }

    Object.entries(resp.anime).forEach(([uid, epCount]) => uids[uid].latestEpisode = epCount);
    watchingList.forEach(anime => anime.show());

    cacheAnimeList(watchingList);
}