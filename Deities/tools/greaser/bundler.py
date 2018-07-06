from pathlib import Path

from .lib import parcel


def bundle(entry_point: Path, build_dir: Path) -> str:
    return parcel.bundle(entry_point, build_dir)
