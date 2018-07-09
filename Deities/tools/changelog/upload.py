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
                raise SyntaxError(f"Unknown text style ({text_style})") from None
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


def get_version_code(*parts) -> int:
    return sum(part << (len(parts) - i) * 16 for i, part in enumerate(parts, 1))


def get_version(code: int):
    return tuple((code & (16 ** (4 * i) - 1)) >> ((i - 1) * 16) for i in range(3, 0, -1))


def parse_changelog(text: str) -> dict:
    header, changes = text.split(FILE_SPLITTER, 1)
    header = parse_header(header)
    changes = parse_logs(changes)

    version_num = get_version_code(*header.version)

    return {
        "version_num": version_num,
        "release": header.release,
        "changes": changes
    }


def format_json(changelog: dict) -> str:
    import json
    from json import JSONEncoder

    class ConsoleEncoder(JSONEncoder):
        def default(self, o: Any) -> Any:
            if isinstance(o, datetime):
                return o.isoformat()
            return super().default(o)

    return json.dumps(changelog, cls=ConsoleEncoder, indent=4)


def format_markdown(changelog: dict) -> str:
    from collections import defaultdict
    from operator import itemgetter

    version = ".".join(map(str, get_version(changelog["version_num"])))
    release = changelog["release"].strftime("%d %b %Y")

    markdown = [f"# Version {version} ({release})"]

    categories = defaultdict(list)
    for change in changelog["changes"]:
        log_type = change["type"]
        text = change["text"]
        priority = change.get("priority", 0)
        categories[log_type].insert(0, (text, priority))

    for category_changes in categories.values():
        category_changes.sort(key=itemgetter(1), reverse=True)

    for category, changes in categories.items():
        markdown.append(f"\n### {category}")
        for change, priority in changes:
            change = f"**{change}**" if priority else change
            markdown.append(f"- {change}")

    return "\n".join(markdown)


if __name__ == "__main__":
    from argparse import ArgumentParser

    parser = ArgumentParser("Changelogger", description="A tool to make changelogs easy or something like that")
    parser.add_argument("file", type=open, help="The file you'd like to parse")
    parser.add_argument("-o", "--output", help="output", default="json")

    args = parser.parse_args()
    changelog = parse_changelog(args.file.read())

    if args.output == "json":
        print(format_json(changelog))
    elif args.output == "markdown":
        print("=====")
        print(format_markdown(changelog))
        print("=====")
    elif args.output.startswith("mongodb://"):
        from pymongo import MongoClient

        client = MongoClient(args.output)
        database = client.MyAnimeStream
        database.changelog.update_one({"version_num": changelog["version_num"]}, {"$set": changelog}, upsert=True)
        print("Uploaded changelog to MongoDb")
