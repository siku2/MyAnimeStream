from pathlib import Path

from .models import GreaserConfig, GreaserContent, GreaserFile


def scrape(directory: Path) -> GreaserContent:
    config_file = directory / "USERSCRIPT.yml"
    if config_file.exists():
        config = GreaserConfig.load(config_file.read_text())
    else:
        raise FileNotFoundError("No \"USERSCRIPT.yml\" file found!")

    script_files = directory.rglob("*.js")
    scripts = {}
    for script_file in script_files:
        name = script_file.stem
        fileid = "/".join((*script_file.parent.relative_to(directory).parts, name))
        file = GreaserFile(name, fileid, script_file, script_file.read_text())
        scripts[fileid] = file
        print(f"found file: {fileid}")
    return GreaserContent(scripts, config)
