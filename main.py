from pathlib import Path
import importlib.util
import sys

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

for entry in ("", str(ROOT_DIR)):
    while entry in sys.path:
        sys.path.remove(entry)

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

spec = importlib.util.spec_from_file_location("cpx_backend_main", BACKEND_DIR / "main.py")
backend_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_main)

app = backend_main.app
