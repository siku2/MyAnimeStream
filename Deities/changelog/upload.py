import re
from collections import namedtuple
from datetime import datetime
from typing import Any, List, Pattern

from dateutil.parser import parser as date_parser

RE_HEADER_PARSER: Pattern = re.compile(r"^[ \t]*(\w+)\s*:[ \t]*([>|])?\s*(.+?);$", re.S | re.M)
RE_PARSER: Pattern = re.compile(r"^[ \t]*(?<!//)[ \t]*(\w+)(?:\[(\d+)\])?:\s*([>|])?\s*(.+?);$", re.S | re.M)
RE_NEWLINE_STRIPPER: Pattern = re.compile(r"\s+")

FILE_SPLITTER = "---"

ChangelogHeader = namedtuple("ChangelogHeader", ("version", "release"))


def parse_logs(text: str) -> List[dict]:
    changes = []
    for match in RE_PARSER.finditer(text):
        change_type, priority, text_style, text = match.groups(None)
        if text_style:
            if text_style == "|":
                text = text.strip()
            elif text_style == ">":
                text = RE_NEWLINE_STRIPPER.sub(" ", text)
            else:
                raise SyntaxError(f"Unknown text style (text_style)") from None
        change = {
            "type": change_type.upper(),
            "text": text
        }
        if priority:
            try:
                priority = int(priority)
            except TypeError:
                priority = None
            if not priority or priority < 0:
                raise SyntaxError(f"Priority must be a positive integer (not {priority})") from None
            change["priority"] = priority
        changes.append(change)
    return changes


def parse_header(text: str) -> ChangelogHeader:
    headers = {}
    for match in RE_HEADER_PARSER.finditer(text):
        key, text_style, value = match.groups(None)
        if text_style:
            if text_style == "|":
                value = value.strip()
            elif text_style == ">":
                value = RE_NEWLINE_STRIPPER.sub(" ", value)
            else:
                raise SyntaxError(f"Unknown text style (text_style)") from None
        headers[key] = value

    version = headers["version"]
    version = tuple(map(int, version.split(".")))

    release = headers.get("release")
    if release:
        release = date_parser().parse(release)
    else:
        print("No release specified, using NOW")
        release = datetime.now()

    return ChangelogHeader(version, release)


def parse_changelog(text: str) -> dict:
    header, changes = text.split(FILE_SPLITTER, 1)
    header = parse_header(header)
    changes = parse_logs(changes)

    version_num = sum(part << (len(header.version) - i) * 16 for i, part in enumerate(header.version, 1))

    return {
        "version_num": version_num,
        "release": header.release,
        "changes": changes
    }


if __name__ == "__main__":
    from argparse import ArgumentParser

    parser = ArgumentParser("Changelogger", description="A tool to make changelogs easy or something like that")
    parser.add_argument("file", type=open, help="The file you'd like to parse")
    parser.add_argument("-o", "--output", help="output", default="json")

    args = parser.parse_args()
    changelog = parse_changelog(args.file.read())

    if args.output == "json":
        import json
        from json import JSONEncoder


        class ConsoleEncoder(JSONEncoder):
            def default(self, o: Any) -> Any:
                if isinstance(o, datetime):
                    return o.isoformat()
                return super().default(o)


        print(json.dumps(changelog, cls=ConsoleEncoder, indent=4))
    elif args.output.startswith("mongodb://"):
        from pymongo import MongoClient

        client = MongoClient(args.output)
        database = client.myanimestream
        database.changelog.update_one({"version_num": changelog["version_num"]}, {"$set": changelog}, upsert=True)
        print("Uploaded changelog to MongoDb")
