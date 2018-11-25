import atexit
import shutil
import signal
import sys
import textwrap
from functools import partial
from pathlib import Path
from typing import Any, Callable, Dict

from .bundler import bundle
from .merger import combine
from .processor import process
from .scraper import scrape

__version__ = "1.0.0"


class IndentedWriter:
    def __init__(self, stream, indent: int):
        self.stream = stream
        self.indent = indent

    def __getattr__(self, name: str) -> Any:
        return getattr(self.stream, name)

    def write(self, s: str):
        text = textwrap.indent(s, self.indent * "\t")
        self.stream.write(text)


class _Indenter:
    def __init__(self, indent: int = 1):
        self._old_stdouts = []
        self._old_stderrs = []
        self.indent = indent

    def __enter__(self):
        self._old_stdouts.append(sys.stdout)
        self._old_stderrs.append(sys.stderr)
        sys.stdout = IndentedWriter(sys.stdout, self.indent)
        sys.stderr = IndentedWriter(sys.stderr, self.indent)

    def __exit__(self, *args):
        sys.stdout = self._old_stdouts.pop()
        sys.stderr = self._old_stderrs.pop()


Indenter = _Indenter()


def remove_build_folder(build_dir: str):
    print(">>> REMOVING BUILD CONTEXT")
    shutil.rmtree(build_dir, ignore_errors=True)


def call_at_exit(func: Callable):
    atexit.register(func)
    signal.signal(signal.SIGTERM, func)
    signal.signal(signal.SIGINT, func)


def build(source_dir: str, output_dir: str, options: Dict[str, Any] = None):
    build_path = Path(".build")
    build_project = build_path / "project"

    print(">>> CREATING BUILD CONTEXT")
    with Indenter:
        if build_path.exists():
            print("removing old build context")
            shutil.rmtree(str(build_path), ignore_errors=True)
        print("copying project tree")
        shutil.copytree(source_dir, build_project, copy_function=shutil.copy)
        call_at_exit(partial(remove_build_folder, str(build_path)))

    print(">>> SCRAPING")
    with Indenter:
        scripts, config = scrape(build_project)
        print(f"Scraped directory. Found {len(scripts)} script file(s)")
        if options is not None:
            config.settings.update(options)
        entry_name = config.entry
        if not entry_name:
            print("No entry point (entry) specified, using index.js")
            entry_name = "index.js"
        entry_point = build_project / entry_name
        out_name = config.header.name.lower()
        out_file = Path(output_dir) / (out_name + ".user.js")

    print(">>> PROCESSING FILES")
    with Indenter:
        if config.processor.get("file_enabled", True):
            for script in scripts.values():
                print(f"processing {script.fileid}")
                with Indenter:
                    script.process(config.processor)
                    script.save()
        else:
            print("processing files disabled")

    print(">>> BUNDLING")
    with Indenter:
        built_script = bundle(entry_point, out_name, config.bundler)
        print(f"Bundled script. Length: {len(built_script)}")

    print(">>> PROCESSING")
    with Indenter:
        if config.processor.get("script_enabled", True):
            built_script = process(built_script, config.processor)
            print(f"Processed script. Length: {len(built_script)}")
        else:
            print("Processing disabled")

    print(">>> FINISHING")
    with Indenter:
        finished_script = combine(config.header, built_script)
        print("Combined with header")
        finished_script.strip()

    print(">>> SAVING")
    with Indenter:
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(finished_script, "utf-8")
        print("saved to", out_file)
