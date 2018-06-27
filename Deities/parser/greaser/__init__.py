import sys
from pathlib import Path
from typing import Any, Dict

from .merger import combine, merge
from .processor import process
from .scraper import scrape

__version__ = "0.0.3"


class Indenter:
    def __init__(self, indent=2):
        self._old_targets = []
        self._current_target = None
        self.indent = indent

    def __getattr__(self, name):
        return getattr(self._current_target, name)

    def __enter__(self):
        self._current_target = sys.stdout
        self._old_targets.append(self._current_target)
        sys.stdout = self

    def __exit__(self, *args):
        self._current_target = self._old_targets.pop()
        sys.stdout = self._current_target

    def write(self, s):
        self._current_target.write((self.indent * " ") + s)


def build(source_dir: str, output_dir: str, options: Dict[str, Any] = None):
    print(">>> SCRAPING")
    with Indenter():
        scripts, config = scrape(source_dir)
        print(f"Scraped directory. Found {len(scripts)} script file(s)")
        if options is not None:
            config.settings.update(options)

    print(">>> MERGING")
    with Indenter():
        built_script = merge(scripts, config.merger)
        print(f"Merged scripts. Length: {len(built_script)}")

    print(">>> PROCESSING")
    with Indenter():
        if config.processor.get("enabled", True):
            built_script = process(built_script, config.processor)
            print(f"Processed script. Length: {len(built_script)}")
        else:
            print("Processing disabled")

    print(">>> FINISHING")
    with Indenter():
        finished_script = combine(config.header, built_script)
        print("Combined with header")

    print(">>> SAVING")
    with Indenter():
        out_name = config.header.name.lower() + ".user.js"
        out_file = Path(output_dir) / out_name
        out_file.write_text(finished_script)
        print("saved file to", out_file)
