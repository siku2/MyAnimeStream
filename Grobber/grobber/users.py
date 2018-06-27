from flask import Blueprint, Response, request

from . import proxy
from .exceptions import InvalidRequest, UserNotFound
from .utils import *

users = Blueprint("Users", __name__, url_prefix="/user")


@users.route("/<username>/config")
def get_user_config(username: str) -> Response:
    user_data = proxy.user_collection.find_one(username)
    if user_data:
        return create_response(config=user_data["config"])
    else:
        return error_response(UserNotFound(username))


@users.route("/<username>/config", methods=("POST",))
def set_user_config(username: str) -> Response:
    update = request.get_json()
    if not update:
        return error_response(InvalidRequest("Config missing"))

    proxy.user_collection.update_one({"_id": username},
                                     {"$setOnInsert": {"_id": username},
                                      "$set": {"config": update},
                                      "$currentDate": {"last_edit": True},
                                      "$inc": {"edits": 1}
                                      }, upsert=True)
    return create_response()
