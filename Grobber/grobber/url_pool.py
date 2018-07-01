import logging
from datetime import datetime, timedelta
from typing import List

from . import proxy
from .exceptions import GrobberException
from .request import Request

log = logging.getLogger(__name__)


class UrlPool:
    name: str
    urls: List[str]
    ttl: timedelta

    def __init__(self, name: str, urls: List[str], ttl: int = 3600):
        self._url = None
        self._next_update = None

        self.name = name
        self.urls = urls
        self.ttl = timedelta(seconds=ttl)

    def __str__(self) -> str:
        return f"<Pool {self.name}>"

    @property
    def url(self) -> str:
        if (not self._next_update) or datetime.now() > self._next_update:
            self.fetch()

        if (not self._next_update) or datetime.now() > self._next_update:
            log.debug(f"searching new url for {self}")
            self.update_url()
            self._next_update = datetime.now() + self.ttl
            self.upload()

        return self._url

    def fetch(self):
        doc = proxy.url_pool_collection.find_one(self.name)
        if not doc:
            log.debug(f"creating pool for {self}")
        else:
            log.debug("initialising from database")
            self._url = doc["url"]
            self._next_update = doc["next_update"]

    def upload(self):
        proxy.url_pool_collection.update_one(dict(_id=self.name), {"$set": dict(url=self._url, next_update=self._next_update)}, upsert=True)

    def update_url(self):
        for i, url in enumerate(self.urls):
            req = Request(url)
            req.request_kwargs["timeout"] = 3
            req.request_kwargs["allow_redirects"] = True
            log.debug(f"trying {req}")
            if req.head_success:
                self.urls.insert(0, self.urls.pop(i))
                self._url = req.head_response.url
                log.debug(f"{req} successful, moving to front! ({self._url})")
                break
        else:
            raise GrobberException("No working url found")
