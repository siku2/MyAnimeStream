from unittest import TestCase

from grobber.streams.mp4upload import Mp4Upload

from . import BasicStreamTest


class TestMp4Upload(BasicStreamTest, TestCase):
    CLS = Mp4Upload
    TESTS = [
        "https://www.mp4upload.com/embed-c7fehm6nsprf.html"
    ]
