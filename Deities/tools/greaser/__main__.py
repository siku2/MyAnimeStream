import importlib
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, "..")))

greaser = importlib.import_module("greaser")
greaser.build(sys.argv[1], sys.argv[2])
