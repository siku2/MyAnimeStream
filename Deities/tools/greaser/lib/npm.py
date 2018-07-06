import shutil
import subprocess
from typing import List

NPM_LOCATION = shutil.which("npm")
NPM_RUN = [NPM_LOCATION, "-s", "run"]


def run(script: str, arguments: List[str], inp: str = None, **options) -> str:
    args = NPM_RUN.copy()
    args.extend([script, "--", *arguments])
    kwargs = dict(input=inp, stdout=subprocess.PIPE, encoding="utf-8", check=True)
    kwargs.update(options)
    return subprocess.run(args, **kwargs).stdout
