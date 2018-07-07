from unittest import TestCase

from grobber.streams.rapidvideo import RapidVideo

from . import BasicStreamTest


class TestRapidVideo(BasicStreamTest, TestCase):
    CLS = RapidVideo
    TESTS = [
        "https://www.rapidvideo.com/e/FT1V2OC6JT",
        "https://www.rapidvideo.com/e/FT1RA054X0",
        "https://www.rapidvideo.com/e/FKIWCBGG6H"
    ]
