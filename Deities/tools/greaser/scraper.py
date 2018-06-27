from collections import namedtuple
from pathlib import Path
from typing import Any, Dict

import yaml


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
    name: str
    fileid: str
    path: Path
    content: str

    def __init__(self, name: str, fileid: str, path: Path, content: str):
        self.name = name
        self.fileid = fileid
        self.path = path
        self.content = content

    def __repr__(self) -> str:
        return self.fileid


GreaserContent = namedtuple("GreaserContent", ("scripts", "config"))


def scrape(directory: str) -> GreaserContent:
    directory = Path(directory)

    config_file = directory / "USERSCRIPT.yml"
    if config_file.exists():
        config = GreaserConfig.load(config_file.read_text())
    else:
        raise FileNotFoundError("No \"USERSCRIPT.yml\" file found!")

    script_files = directory.rglob("*.js")
    scripts = {}
    for script_file in script_files:
        name = script_file.stem
        fileid = "/".join((*script_file.parent.relative_to(directory).parts, name))
        file = GreaserFile(name, fileid, script_file, script_file.read_text())
        scripts[fileid] = file
        print(f"found file: {fileid}")
    return GreaserContent(scripts, config)
