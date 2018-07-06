from pathlib import Path

from . import npm


def bundle(entry_point: Path, build_dir: Path) -> str:
    res = npm.run("parcel", [str(entry_point), "-d", str(build_dir), "--out-file", "_build.js"])
    print(res)
    return (build_dir / "_build.js").read_text("utf-8")
