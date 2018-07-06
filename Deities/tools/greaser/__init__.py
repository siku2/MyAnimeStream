import shutil
import sys
import textwrap
from pathlib import Path
from typing import Any, Dict

from .bundler import bundle
from .merger import combine
from .processor import process
from .scraper import scrape

__version__ = "1.0.0"


class Indenter:
    def __init__(self, indent: int = 2):
        self._old_targets = []
        self._current_target = None
        self.indent = indent

    def __getattr__(self, name: str) -> Any:
        return getattr(self._current_target, name)

    def __enter__(self):
        self._current_target = sys.stdout
        self._old_targets.append(self._current_target)
        sys.stdout = self

    def __exit__(self, *args):
        self._current_target = self._old_targets.pop()
        sys.stdout = self._current_target

    def write(self, s: str):
        text = textwrap.indent(s, self.indent * " ")
        self._current_target.write(text)


def build(source_dir: str, output_dir: str, options: Dict[str, Any] = None):
    build_path = Path(".build")
    build_project = build_path / "project"

    print(">>> CREATING BUILD CONTEXT")
    shutil.copytree(source_dir, build_project, copy_function=shutil.copy)

    try:
        print(">>> SCRAPING")
        with Indenter():
            scripts, config = scrape(build_project)
            print(f"Scraped directory. Found {len(scripts)} script file(s)")
            if options is not None:
                config.settings.update(options)
            entry_name = config.entry
            if not entry_name:
                print("No entry point (entry) specified, using index.js")
                entry_name = "index.js"
            entry_point = build_project / entry_name
            out_name = config.header.name.lower() + ".user.js"

        print(">>> PROCESSING FILES")
        with Indenter():
            for script in scripts.values():
                print(f"processing {script.fileid}")
                with Indenter():
                    script.process(config.processor)
                    script.save()

        print(">>> BUNDLING")
        with Indenter():
            built_script = bundle(entry_point, build_path)

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
            out_file = Path(output_dir) / out_name
            out_file.write_text(finished_script)
            print("saved to", out_file)
    finally:
        print(">>> REMOVING BUILD CONTEXT")
        shutil.rmtree(str(build_path), ignore_errors=True)
