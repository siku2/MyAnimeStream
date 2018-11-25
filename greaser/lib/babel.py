from . import npm

DEFAULT_FLAGS = ["--minified", "--no-babelrc", "--presets=stage-2"]


def compile_js(script: str) -> str:
    return npm.run("babel", DEFAULT_FLAGS, script)
