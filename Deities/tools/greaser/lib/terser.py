from . import npm


def compress(script: str) -> str:
    return npm.run("terser", ["-c", "-m"], script)
