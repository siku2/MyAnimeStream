import shutil
import subprocess

NPM_LOCATION = shutil.which("npm")

DEFAULT_FLAGS = ["--minified", "--no-babelrc", "--presets=stage-2"]
BABEL_ARGS = [NPM_LOCATION, "-s", "run", "babel", "--"]


def compile(script: str) -> str:
    args = BABEL_ARGS + DEFAULT_FLAGS
    return subprocess.run(args, input=script, stdout=subprocess.PIPE, encoding="utf-8", check=True).stdout
