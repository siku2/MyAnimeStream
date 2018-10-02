from unittest import TestCase

from grobber.streams.rapidvideo import RapidVideo
from . import BasicStreamTest


# pytestmark = pytest.mark.skip("RapidVideo is having problems")


class TestRapidVideo(BasicStreamTest, TestCase):
    CLS = RapidVideo
    TESTS = [
        "https://www.rapidvideo.com/e/FU2NL58UVC"
    ]
