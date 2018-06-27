import abc
import logging
import re
import sys
from collections import namedtuple
from datetime import datetime
from difflib import SequenceMatcher
from itertools import groupby
from operator import attrgetter
from typing import Any, Dict, Iterator, List, MutableSequence, NewType, Optional, Union

from .decorators import cached_property
from .exceptions import EpisodeNotFound
from .request import Request
from .stateful import BsonType, Expiring, Stateful
from .utils import thread_pool

log = logging.getLogger(__name__)

UID = NewType("UID", str)

RE_UID_CLEANER = re.compile(r"\W+")


def get_certainty(a: str, b: str) -> float:
    return round(SequenceMatcher(a=a, b=b).ratio(), 2)


class SearchResult(namedtuple("SearchResult", ("anime", "certainty"))):
    def to_dict(self):
        return {"anime": self.anime.to_dict(),
                "certainty": self.certainty}


VIDEO_MIME_TYPES = ("video/webm", "video/ogg", "video/mp4", "application/octet-stream")


class Stream(Expiring, abc.ABC):
    INCLUDE_CLS = True
    ATTRS = ("links", "poster")
    CHANGING_ATTRS = ("links",)
    EXPIRE_TIME = Expiring.DAY

    HOST = None
    PRIORITY = 1

    def __repr__(self) -> str:
        return f"{type(self).__name__} Stream: {self._req}"

    def __iter__(self) -> Iterator[str]:
        return iter(self.links)

    @classmethod
    def can_handle(cls, req: Request) -> bool:
        return req.yarl.host == cls.HOST

    @property
    @abc.abstractmethod
    def links(self) -> List[str]:
        ...

    @cached_property
    def poster(self) -> Optional[str]:
        return None

    @property
    def working(self) -> bool:
        return len(self.links) > 0

    @staticmethod
    def get_successful_links(sources: Union[Request, MutableSequence[Request]]) -> List[str]:
        if isinstance(sources, Request):
            sources = [sources]
        else:
            all(thread_pool.map(attrgetter("head_success"), sources))
        urls = []
        for source in sources:
            if source.head_success:
                content_type = source.head_response.headers.get("content-type")
                if not content_type:
                    log.debug(f"No content type for {source}")
                    continue
                if content_type.startswith(VIDEO_MIME_TYPES):
                    log.debug(f"Accepting {source}")
                    urls.append(source.url)
        return urls


class Episode(Stateful, abc.ABC):
    ATTRS = ("streams", "host_url")

    def __init__(self, req: Request):
        super().__init__(req)

    def __repr__(self) -> str:
        return f"{type(self).__name__} Ep.: {repr(self._req)}"

    @property
    def dirty(self) -> bool:
        if self._dirty:
            return True
        else:
            if hasattr(self, "_streams"):
                return any(stream.dirty for stream in self._streams)
            return False

    @dirty.setter
    def dirty(self, value: bool):
        self._dirty = value
        if hasattr(self, "_streams"):
            for stream in self._streams:
                stream.dirty = value

    @property
    @abc.abstractmethod
    def streams(self) -> List[Stream]:
        pass

    @cached_property
    def stream(self) -> Optional[Stream]:
        log.debug(f"{self} Searching for working stream...")
        for priority, streams in groupby(self.streams, attrgetter("PRIORITY")):
            streams = list(streams)
            log.debug(f"Looking at {len(streams)} stream(s) with priority {priority}")
            all(thread_pool.map(attrgetter("working"), streams))
            working_stream = next((stream for stream in streams if stream.working), None)
            if working_stream:
                log.debug(f"Found working stream: {working_stream}")
                return working_stream
        log.debug(f"No working stream for {self}")

    @cached_property
    def poster(self) -> Optional[str]:
        return next((stream.poster for stream in self.streams if stream.poster), None)

    @property
    @abc.abstractmethod
    def host_url(self) -> str:
        ...

    def serialise_special(self, key: str, value: Any) -> BsonType:
        if key == "streams":
            return [stream.state for stream in value if getattr(stream, "_links", False)]

    @classmethod
    def deserialise_special(cls, key: str, value: BsonType) -> Any:
        if key == "streams":
            streams = []
            for stream in value:
                m, c = stream["cls"].rsplit(".", 1)
                module = sys.modules.get(m)
                if module:
                    stream_cls = getattr(module, c)
                    streams.append(stream_cls.from_state(stream))
            return streams


class Anime(Expiring, abc.ABC):
    EPISODE_CLS = Episode

    INCLUDE_CLS = True
    ATTRS = ("id", "is_dub", "title", "episode_count", "episodes", "last_update")
    CHANGING_ATTRS = ("episode_count",)
    EXPIRE_TIME = 30 * Expiring.MINUTE  # 30 mins should be fine, right?

    _episodes: Dict[int, EPISODE_CLS]

    def __init__(self, req: Request):
        super().__init__(req)
        self._dirty = False
        self._last_update = datetime.now()

    def __getitem__(self, item: int) -> EPISODE_CLS:
        return self.get(item)

    def __bool__(self) -> bool:
        return True

    def __len__(self) -> int:
        return self.episode_count

    def __iter__(self) -> Iterator[EPISODE_CLS]:
        return iter(self.episodes.values())

    def __repr__(self) -> str:
        return self.uid

    def __str__(self) -> str:
        return self.title

    def __eq__(self, other: "Anime") -> bool:
        return self.uid == other.uid

    def __hash__(self) -> int:
        if hasattr(self, "_uid") or hasattr(self._req, "_response"):
            return hash(self.uid)
        return hash(self._req)

    @property
    def dirty(self) -> bool:
        if self._dirty:
            return True
        else:
            if hasattr(self, "_episodes"):
                return any(ep.dirty for ep in self._episodes.values())
            return False

    @dirty.setter
    def dirty(self, value: bool):
        self._dirty = value
        if hasattr(self, "_episodes"):
            for ep in self._episodes.values():
                ep.dirty = value

    @cached_property
    def uid(self) -> UID:
        name = RE_UID_CLEANER.sub("", type(self).__name__.lower())
        anime = RE_UID_CLEANER.sub("", self.title.lower())
        dub = "-dub" if self.is_dub else ""
        return UID(f"{name}-{anime}{dub}")

    @property
    def id(self) -> UID:
        return self.uid

    @id.setter
    def id(self, value: UID):
        self._uid = value

    @property
    @abc.abstractmethod
    def is_dub(self) -> False:
        ...

    @property
    @abc.abstractmethod
    def title(self) -> str:
        ...

    @cached_property
    def episode_count(self) -> int:
        return len(self.get_episodes())

    @property
    def episodes(self) -> Dict[int, EPISODE_CLS]:
        if hasattr(self, "_episodes"):
            if len(self._episodes) != self.episode_count:
                log.info("{self} doesn't have all episodes. updating!")
                for i in range(self.episode_count):
                    if i not in self._episodes:
                        self._episodes[i] = self.get_episode(i)
        else:
            eps = self.get_episodes()
            self._episodes = dict(enumerate(eps))
        return self._episodes

    def get(self, index: int) -> EPISODE_CLS:
        if hasattr(self, "_episodes"):
            ep = self._episodes.get(index)
            if ep is not None:
                return ep
        try:
            return self.episodes[index]
        except KeyError:
            raise EpisodeNotFound(index, self.episode_count)

    @abc.abstractmethod
    def get_episodes(self) -> List[EPISODE_CLS]:
        ...

    @abc.abstractmethod
    def get_episode(self, index: int) -> EPISODE_CLS:
        ...

    def to_dict(self) -> Dict[str, BsonType]:
        return {"uid": self.uid,
                "title": self.title,
                "episodes": self.episode_count,
                "dub": self.is_dub,
                "updated": self._last_update.isoformat()}

    @classmethod
    @abc.abstractmethod
    def search(cls, query: str, dub: bool = False) -> Iterator[SearchResult]:
        ...

    def serialise_special(self, key: str, value: Any) -> BsonType:
        if key == "episodes":
            return {str(i): ep.state for i, ep in value.items()}

    @classmethod
    def deserialise_special(cls, key: str, value: BsonType) -> Any:
        if key == "episodes":
            return {int(i): cls.EPISODE_CLS.from_state(ep) for i, ep in value.items()}
