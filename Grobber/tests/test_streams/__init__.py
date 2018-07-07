from grobber.request import Request


class BasicStreamTest:
    CLS = None
    TESTS = []

    def setUp(self):
        self.requests = list(map(Request, self.TESTS))
        self.streams = list(map(self.CLS, self.requests))

    def test_can_handle(self):
        for req in self.requests:
            assert self.CLS.can_handle(req)

    def test_poster(self):
        for stream in self.streams:
            assert stream.poster

    def test_links(self):
        for stream in self.streams:
            assert stream.links
