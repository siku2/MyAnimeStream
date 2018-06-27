from typing import Any, Dict

from .lib.babel import compile
from .lib.uglify import uglify


def process(script: str, options: Dict[str, Any]) -> str:
    print("compiling script using babel...", end=" ", flush=True)
    script = compile(script)
    print("done\nUglifying...", end=" ", flush=True)
    script = uglify(script)
    print("done")
    return script
