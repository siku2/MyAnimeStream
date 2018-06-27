import subprocess
from pathlib import Path

BABEL_CWD = Path(__file__).parent
BABEL_SRC = BABEL_CWD / "node_modules" / "babel-cli" / "bin" / "babel.js"

DEFAULT_FLAGS = ["--minified", "--no-babelrc", "--presets=stage-2"]
BABEL_ARGS = ["node.exe", str(BABEL_SRC)]


def compile(script: str) -> str:
    args = BABEL_ARGS + DEFAULT_FLAGS
    return subprocess.run(args, cwd=str(BABEL_CWD), input=script, stdout=subprocess.PIPE, encoding="utf-8", check=True).stdout
