import shutil
import subprocess

NPM_LOCATION = shutil.which("npm")

DEFAULT_FLAGS = ["-c", "-m"]
UGLIFY_ARGS = [NPM_LOCATION, "-s", "run", "uglify", "--"]


def uglify(script: str) -> str:
    args = UGLIFY_ARGS + DEFAULT_FLAGS
    return subprocess.run(args, input=script, stdout=subprocess.PIPE, encoding="utf-8", check=True).stdout
