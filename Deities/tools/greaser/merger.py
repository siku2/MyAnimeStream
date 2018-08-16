from .models import UserscriptHeader


def combine(header: UserscriptHeader, script: str) -> str:
    return header.to_greasemonkey() + "\n" + script
