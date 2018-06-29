from datetime import datetime
from pathlib import Path

from ..changelog import upload

test_file = Path(__file__).parent / "changelog.log"


def test_parser():
    changelog = upload.parse_changelog(test_file.read_text())
    assert changelog["version_num"] == 4294967296
    assert changelog["release"] == datetime(2018, 6, 28)
    changes = changelog["changes"]
    assert len(changes) == 3
