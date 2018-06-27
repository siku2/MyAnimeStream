from typing import List, Optional

from . import register_stream
from ..decorators import cached_property
from ..models import Stream
from ..request import Request


class RapidVideo(Stream):
    HOST = "www.rapidvideo.com"

    @cached_property
    def poster(self) -> Optional[str]:
        link = self._req.bs.select_one("video#videojs").attrs.get("poster")
        if link and Request(link).head_success:
            return link
        return None

    @cached_property
    def links(self) -> List[str]:
        sources = [Request(source["src"]) for source in self._req.bs.select("video source")]
        return Stream.get_successful_links(sources)


register_stream(RapidVideo)
