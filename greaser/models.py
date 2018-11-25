import re
from collections import namedtuple
from pathlib import Path
from typing import Any, Dict, Match, Pattern

import yaml

GreaserContent = namedtuple("GreaserContent", ("scripts", "config"))


class UserscriptHeader:
    conf: Dict[str, Any]

    def __init__(self, conf: Dict[str, Any]):
        self.conf = conf

    def __repr__(self) -> str:
        return self.to_greasemonkey()

    def __getitem__(self, item):
        return self.conf[item]

    def __getattr__(self, key):
        return self.conf[key]

    def to_greasemonkey(self) -> str:
        conf_list = []
        for key, value in self.conf.items():
            if isinstance(value, list):
                conf_list.extend(f"// @{key} {val}" for val in value)
            else:
                conf_list.append(f"// @{key} {value}")
        conf = "\n".join(conf_list)
        return f"// ==UserScript==\n{conf}\n// ==/UserScript=="


class GreaserParserSettings:
    conf: Dict[str, Any]

    def __init__(self, conf: Dict[str, Any] = None):
        self.conf = conf or {}

    def __repr__(self) -> str:
        return repr(self.conf)

    def __getitem__(self, item):
        return self.get(item)

    def __getattr__(self, key):
        return self.get(key)

    def get(self, key):
        return self.conf.get(key, {})

    def update(self, options: Dict[str, Any]):
        for path, value in options:
            *parts, key = path.split(".")
            item = self
            for sub_key in parts:
                if sub_key not in item:
                    item[sub_key] = {}
                item = item[sub_key]
            item[key] = value


class GreaserConfig:
    header: UserscriptHeader
    settings: GreaserParserSettings

    def __init__(self, header: UserscriptHeader, settings: GreaserParserSettings):
        self.header = header
        self.settings = settings

    def __repr__(self) -> str:
        return repr(self.header) + "\n" + repr(self.settings)

    def __getattr__(self, key):
        return getattr(self.settings, key)

    @classmethod
    def load(cls, content: str) -> "GreaserConfig":
        data = yaml.load(content)
        header = UserscriptHeader(data["userscript"])
        settings = GreaserParserSettings(data.get("settings"))
        return cls(header, settings)


class GreaserFile:
    RE_LOG_MATCHER: Pattern = re.compile(r"\bconsole\.(debug|error|info|log|warn)\((.+)\);")
    STRING_MARKERS = ("\"", "'", "`")

    name: str
    fileid: str
    path: Path
    content: str

    def __init__(self, name: str, fileid: str, path: Path, content: str):
        self.name = name
        self.fileid = fileid
        self.path = path
        self.namespace = path.parent.stem
        self.content = content

    def __repr__(self) -> str:
        return self.fileid

    def process(self, options: Dict[str, Any]):
        if options.get("log_format"):
            log_format: str = options.get("log_format")

            def format_log(match: Match) -> str:
                method, message = match.groups()
                pre = "\" + " if message.startswith(self.STRING_MARKERS) else "\", "
                post = " + \"" if message.endswith(self.STRING_MARKERS) else ", \""
                message = f"{pre}{message}{post}"
                formatted_message = log_format.format(script=self, message=message)
                return f"console.{method}(\"{formatted_message}\")"

            self.content = self.RE_LOG_MATCHER.sub(format_log, self.content)

    def save(self):
        self.path.write_text(self.content, encoding="utf-8")
