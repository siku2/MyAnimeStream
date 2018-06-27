from typing import Any, Dict

from .scraper import GreaserFile, UserscriptHeader


def merge(scripts: Dict[str, GreaserFile], options: Dict[str, Any]) -> str:
    order = options.get("order", {})
    first = order.get("first", None)
    last = order.get("last", None)

    first_scripts = []
    last_scripts = []

    if first:
        print(f"{len(scripts)} scripts left. Respecting first scripts")
        if not isinstance(first, list):
            first = [first]
        for script in first:
            if script not in scripts:
                raise KeyError(f"Couldn't find script \"{script}\" in your project. Did you misstype?")
            first_scripts.append(scripts.pop(script))

    if last:
        print(f"{len(scripts)} scripts left. Respecting last scripts")
        if not isinstance(last, list):
            last = [last]
        for script in last:
            if script not in scripts:
                raise KeyError(f"Couldn't find script \"{script}\" in your project. Did you misstype?")
            last_scripts.append(scripts.pop(script))

    print(f"{len(scripts)} scripts left. Using no particular order")

    ordered_scripts = [*first_scripts, *scripts.values(), *last_scripts]

    script = "\n".join(script.content for script in ordered_scripts)
    return script


def combine(header: UserscriptHeader, script: str) -> str:
    return header.to_greasemonkey() + "\n" + script
