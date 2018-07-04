import re
from typing import Any, Dict, Match, Pattern

from .lib.babel import compile_js
from .lib.uglify import uglify
from .scraper import GreaserFile

RE_LOG_MATCHER: Pattern = re.compile(r"\bconsole\.(debug|error|info|log|warn)\((.+)\);")
STRING_MARKERS = ("\"", "'", "`")


def process_script(script: GreaserFile, options: Dict[str, Any]):
    if options.get("log_format"):
        log_format: str = options.get("log_format")

        def format_log(match: Match) -> str:
            method, message = match.groups()
            pre = "\" + " if message.startswith(STRING_MARKERS) else "\", "
            post = " + \"" if message.endswith(STRING_MARKERS) else ", \""
            message = f"{pre}{message}{post}"
            formatted_message = log_format.format(script=script, message=message)
            return f"console.{method}(\"{formatted_message}\")"

        script.content = RE_LOG_MATCHER.sub(format_log, script.content)


def process(script: str, options: Dict[str, Any]) -> str:
    print("compiling script using babel...", end=" ", flush=True)
    script = compile_js(script)
    print("done\nUglifying...", end=" ", flush=True)
    script = uglify(script)
    print("done")
    return script
