from flask import Blueprint, Response, redirect, request

from .url_pool import UrlPool

forward = Blueprint("Forward", __name__, url_prefix="/forward")


@forward.route("/gogoanime/<path:url>")
def gogoanime(url: str) -> Response:
    url += "?" + request.query_string.decode("utf-8")
    return redirect(gogoanime_pool.url + "/" + url)


@forward.route("/gogoanime/search")
def gogoanime_search() -> Response:
    url = "//search.html?" + request.query_string.decode("utf-8")
    return redirect(gogoanime_pool.url + url)


@forward.route("/gogoanime/episodes")
def gogoanime_episodes() -> Response:
    url = "//load-list-episode?" + request.query_string.decode("utf-8")
    return redirect(gogoanime_pool.url + url)


gogoanime_pool = UrlPool("GogoAnime", ["https://gogoanime.io", "http://gogoanime.io", "https://www3.gogoanime.se"])
