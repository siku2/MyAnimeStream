import logging
import os
from operator import attrgetter, methodcaller

import raven
from flask import Flask, Response, redirect, request, url_for
from raven.conf import setup_logging
from raven.contrib.flask import Sentry
from raven.handlers.logging import SentryHandler
from werkzeug.routing import BaseConverter

from . import __info__, proxy, sources
from .exceptions import GrobberException, InvalidRequest, UIDUnknown
from .forward import forward
from .models import UID
from .templates import templates
from .users import users
from .utils import *

log = logging.getLogger(__name__)

app = Flask(__name__)
sentry_client = raven.Client(release=__info__.__version__)
Sentry(app, sentry_client)
sentry_handler = SentryHandler(sentry_client)
sentry_handler.setLevel(logging.ERROR)
setup_logging(sentry_handler)


class UIDConverter(BaseConverter):
    def to_python(self, value):
        return UID(value)

    def to_url(self, value):
        return super().to_url(value)


app.url_map.converters["UID"] = UIDConverter

app.register_blueprint(templates)
app.register_blueprint(users)
app.register_blueprint(forward)

app.config["SERVER_NAME"] = os.getenv("SERVER_NAME")

log.info(f"Grobber version {__info__.__version__} running!")


@app.errorhandler(GrobberException)
def handle_grobber_exception(e: GrobberException) -> Response:
    return error_response(e)


@app.teardown_appcontext
def teardown_appcontext(error):
    proxy.teardown()
    sources.save_dirty()


@app.after_request
def after_request(response: Response) -> Response:
    response.headers["Grobber-Version"] = __info__.__version__
    return response


@app.route("/search/<query>")
def search(query: str) -> Response:
    num_results = cast_argument(request.args.get("results"), int, 1)
    if not (0 < num_results <= 10):
        raise InvalidRequest(f"Can only request up to 10 results (not {num_results})")
    result_iter = sources.search_anime(query, dub=proxy.requests_dub)
    num_consider_results = max(num_results, 10)
    results_pool = []
    for result in result_iter:
        if len(results_pool) >= num_consider_results:
            break
        results_pool.append(result)
    results = sorted(results_pool, key=attrgetter("certainty"), reverse=True)[:num_results]
    ser_results = list(thread_pool.map(methodcaller("to_dict"), results))
    return create_response(anime=ser_results)


@app.route("/anime/episode-count", methods=("POST",))
def get_anime_episode_count() -> Response:
    anime_uids = request.json
    if not isinstance(anime_uids, list):
        raise InvalidRequest("Body needs to contain a list of uids!")
    if len(anime_uids) > 30:
        raise InvalidRequest(f"Too many anime requested, max is 30! ({len(anime_uids)})")
    anime = filter(None, [sources.get_anime(uid) for uid in anime_uids])
    anime_counts = list(thread_pool.map(lambda a: (a.uid, a.episode_count), anime))
    return create_response(anime=dict(anime_counts))


@app.route("/anime/<UID:uid>")
def get_anime(uid: UID) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        raise UIDUnknown(uid)
    return create_response(anime.to_dict())


@app.route("/anime/<UID:uid>/state")
def get_anime_state(uid: UID) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        raise UIDUnknown(uid)
    return create_response(data=anime.state)


@app.route("/anime/<UID:uid>/<int:index>/state")
def get_episode_state(uid: UID, index: int) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        raise UIDUnknown(uid)
    episode = anime[index]
    return create_response(data=episode.state)


@app.route("/anime/<UID:uid>/<int:index>/poster")
def get_episode_poster(uid: UID, index: int) -> Response:
    anime = sources.get_anime(uid)
    if not anime:
        raise UIDUnknown(uid)
    episode = anime[index]
    poster = episode.poster or url_for("static", filename="images/default_poster.png", _external=True)
    return redirect(poster)
