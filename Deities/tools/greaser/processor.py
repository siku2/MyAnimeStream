from typing import Any, Dict

from .lib.babel import compile_js


def process(script: str, options: Dict[str, Any]) -> str:
    print("compiling script using babel...", end=" ", flush=True)
    script = compile_js(script)
    print("done")
    return script
