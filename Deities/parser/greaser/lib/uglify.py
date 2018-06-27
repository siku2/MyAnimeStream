import subprocess
from pathlib import Path

UGLIFY_CWD = Path(__file__).parent
UGLIFY_SRC = UGLIFY_CWD / "node_modules" / "uglify-es" / "bin" / "uglifyjs"

DEFAULT_FLAGS = ["-c", "-m"]
UGLIFY_ARGS = ["node.exe", str(UGLIFY_SRC)]


def uglify(script: str) -> str:
    args = UGLIFY_ARGS + DEFAULT_FLAGS
    return subprocess.run(args, cwd=str(UGLIFY_CWD), input=script, stdout=subprocess.PIPE, encoding="utf-8", check=True).stdout
