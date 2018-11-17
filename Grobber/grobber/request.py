import inspect
import json
from string import Formatter
from typing import Any, Dict, List, Tuple, Union

import requests
import yarl
from bs4 import BeautifulSoup
from requests.exceptions import ConnectionError, ReadTimeout

from .decorators import cached_property

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0"
}


class UrlFormatter(Formatter):
    _FIELDS: Dict[Any, Any]

    def __init__(self) -> None:
        self._FIELDS = {}

    def add_field(self, key: Any, value: Any) -> None:
        self._FIELDS[key] = value

    def add_fields(self, fields: Dict[Any, Any] = None, **kwargs) -> None:
        fields = fields or {}
        fields.update(kwargs)

        for args in fields.items():
            self.add_field(*args)

    def get_value(self, key: Union[str, int], args: List[Any], kwargs: Dict[Any, Any]) -> Any:
        if key in self._FIELDS:
            value = self._FIELDS[key]
            if inspect.isfunction(value):
                value = value()

            return value

        return super().get_value(key, args, kwargs)


DefaultUrlFormatter = UrlFormatter()


class Request:
    ATTRS = ()

    _url: str
    _response: requests.Response
    _success: bool
    _text: str
    _json: Dict[str, Any]
    _bs: BeautifulSoup

    def __init__(self, url: str, params: Any = None, headers: Any = None, timeout: int = None, **request_kwargs) -> None:
        self._raw_url = url
        self._params = params
        self._headers = headers
        self._timeout = timeout
        self.request_kwargs = request_kwargs

        self.url_formatter = DefaultUrlFormatter

    def __hash__(self) -> int:
        return hash(self.url)

    def __eq__(self, other: "Request") -> bool:
        return self.url == other.url

    def __repr__(self) -> str:
        props: Tuple[str, ...] = (
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
        if self._timeout:
            data["timeout"] = self._timeout
        if self.request_kwargs:
            data["options"] = self.request_kwargs
        return data

    @classmethod
    def from_state(cls, state: dict) -> "Request":
        inst = cls(state["url"], state.get("params"), state.get("headers"), state.get("timeout"), **state.get("options", {}))
        return inst

    @classmethod
    def create_soup(cls, html: str) -> BeautifulSoup:
        return BeautifulSoup(html, "lxml")

    @property
    def headers(self):
        headers = DEFAULT_HEADERS.copy()
        if self._headers:
            headers.update(self._headers)
        return headers

    @cached_property
    def url(self) -> str:
        raw_url = self.url_formatter.format(self._raw_url)
        return requests.Request("GET", raw_url, params=self._params, headers=self.headers).prepare().url

    @url.setter
    def url(self, value: str):
        self._url = value
        self._dirty(3)

    @cached_property
    def yarl(self):
        return yarl.URL(self.url)

    @cached_property
    def response(self) -> requests.Response:
        return requests.get(self.url, headers=self.headers, timeout=self._timeout, **self.request_kwargs)

    @response.setter
    def response(self, value: requests.Response):
        self._response = value
        self._dirty(2)

    @cached_property
    def success(self) -> bool:
        try:
            return self.response.ok
        except (ConnectionError, ReadTimeout):
            return False

    @cached_property
    def head_response(self) -> requests.Response:
        if hasattr(self, "_response"):
            return self.response
        timeout = self._timeout or 3
        return requests.head(self.url, headers=self.headers, verify=False, timeout=timeout, **self.request_kwargs)

    @cached_property
    def head_success(self) -> bool:
        try:
            return self.head_response.ok
        except (ConnectionError, ReadTimeout):
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
    def json(self) -> Dict[str, Any]:
        return json.loads(self.text)

    @cached_property
    def bs(self) -> BeautifulSoup:
        return self.create_soup(self.text)

    def _dirty(self, flag: int):
        if flag > 2:
            del self._response
            del self._success
        if flag > 1:
            del self._text
        if flag > 0:
            del self._bs
            del self._json
