from operator import attrgetter

from grobber.request import Request


class BasicStreamTest:
    CLS = None
    TESTS = []

    def setUp(self):
        self.requests = list(map(Request, self.TESTS))
        self.streams = list(map(self.CLS, self.requests))

    def test_can_handle(self):
        assert all(map(self.CLS.can_handle, self.requests))

    def test_poster(self):
        assert all(map(attrgetter("poster"), self.streams))

    def test_links(self):
        assert all(map(attrgetter("links"), self.streams))
