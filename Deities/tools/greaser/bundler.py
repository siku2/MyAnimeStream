from pathlib import Path
from typing import Any, Dict

from .lib import rollup


def bundle(entry_point: Path, name: str, options: Dict[str, Any]) -> str:
    return rollup.bundle(entry_point, name, options.get("globals"))
