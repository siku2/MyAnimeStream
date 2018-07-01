from typing import Any

import requests
import urllib3
import yarl
from bs4 import BeautifulSoup
from requests.exceptions import ConnectionError

from .decorators import cached_property

urllib3.disable_warnings()

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0"
}


class Request:
    ATTRS = ()

    _url: str
    _response: requests.Response
    _success: bool
    _text: str
    _bs: BeautifulSoup

    def __init__(self, url: str, params: Any = None, headers: Any = None):
        self._raw_url = url
        self._params = params
        self._headers = headers
        self.request_kwargs = {}

    def __hash__(self) -> int:
        return hash(self.url)

    def __eq__(self, other: "Request") -> bool:
        return self.url == other.url

    def __repr__(self) -> str:
        props = (
            hasattr(self, "_response") and "REQ",
            hasattr(self, "_text") and "TXT",
            hasattr(self, "_bs") and "BS"
        )
        cached = ",".join(filter(None, props))
        return f"<{self.url} ({cached})>"

    @property
    def state(self) -> dict:
        data = {"url": self._raw_url}
        if self._params:
            data["params"] = self._params
        if self._headers:
            data["headers"] = self._params
        return data

    @classmethod
    def from_state(cls, state: dict) -> "Request":
        inst = cls(state["url"], state.get("params", None))
        return inst

    @property
    def headers(self):
        headers = DEFAULT_HEADERS.copy()
        if self._headers:
            headers.update(self._headers)
        return headers

    @cached_property
    def url(self) -> str:
        return requests.Request("GET", self._raw_url, params=self._params, headers=self.headers).prepare().url

    @url.setter
    def url(self, value: str):
        self._url = value
        self._dirty(3)

    @cached_property
    def yarl(self):
        return yarl.URL(self.url)

    @cached_property
    def response(self) -> requests.Response:
        return requests.get(self.url, headers=self.headers, verify=False, **self.request_kwargs)

    @response.setter
    def response(self, value: requests.Response):
        self._response = value
        self._dirty(2)

    @cached_property
    def success(self) -> bool:
        try:
            return self.response.ok
        except ConnectionError:
            return False

    @cached_property
    def head_response(self) -> requests.Response:
        if hasattr(self, "_response"):
            return self.response
        return requests.head(self.url, headers=self.headers, verify=False, **self.request_kwargs)

    @cached_property
    def head_success(self) -> bool:
        try:
            return self.head_response.ok
        except ConnectionError:
            return False

    @cached_property
    def text(self) -> str:
        self.response.encoding = "utf-8-sig"
        text = self.response.text.replace("\ufeff", "")
        return text

    @text.setter
    def text(self, value: str):
        self._text = value
        self._dirty(1)

    @cached_property
    def bs(self) -> BeautifulSoup:
        return BeautifulSoup(self.text, "lxml")

    def _dirty(self, flag: int):
        if flag > 2:
            del self._response
            del self._success
        if flag > 1:
            del self._text
        if flag > 0:
            del self._bs
