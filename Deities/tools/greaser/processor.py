from typing import Any, Dict

from .lib import babel, terser


def process(script: str, options: Dict[str, Any]) -> str:
    print("compiling script using babel...", end=" ", flush=True)
    script = babel.compile_js(script)
    print("done\nCompressing using Terser...", end=" ", flush=True)
    script = terser.compress(script)
    print("done")
    return script
