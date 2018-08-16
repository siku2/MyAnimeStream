from pathlib import Path
from typing import Dict

from . import npm


def bundle(entry_point: Path, name: str, global_modules: Dict[str, str]) -> str:
    args = ["-i", str(entry_point), "-n", name, "-f", "iife"]
    if global_modules:
        global_modules = [f"{internal}:{external}" for external, internal in global_modules.items()]
        args.extend(["-g", ",".join(global_modules)])
    return npm.run("rollup", args)
