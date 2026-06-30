import json
import sys
from dataclasses import asdict, is_dataclass
from pathlib import Path


sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OPERATORS_JSON = PROJECT_ROOT / "data" / "processed" / "operators.json"
DISPLAY_LIMIT = 1

sys.path.append(str(PROJECT_ROOT))

from src.services.operator_loader import load_operator_dicts, load_operators


def print_json(title, value):
    print(title)
    print(json.dumps(value, ensure_ascii=False, indent=2))


def display_list(name, values):
    print(f"{name} type: {type(values).__name__}")
    print(f"{name} count: {len(values)}")

    display_values = values[:DISPLAY_LIMIT]
    if len(values) > DISPLAY_LIMIT:
        print(f"{name} display: first {DISPLAY_LIMIT} items")
    else:
        print(f"{name} display: all items")

    return display_values


def dataclass_to_dict(value):
    if is_dataclass(value):
        return asdict(value)
    return value


def main():
    print("=== check_operator_loader.py ===")
    print(f"json path: {OPERATORS_JSON}")

    print()
    print("=== load_operator_dicts() ===")
    operator_dicts = load_operator_dicts(OPERATORS_JSON)
    display_operator_dicts = display_list("data", operator_dicts)
    print_json("data =", display_operator_dicts)

    print()
    print("=== load_operators() ===")
    operators = load_operators(OPERATORS_JSON)
    display_operators = display_list("operators", operators)
    operator_dicts_for_display = [
        dataclass_to_dict(operator) for operator in display_operators
    ]
    print_json("operators =", operator_dicts_for_display)

    print()
    print("確認: load_operator_dicts() は辞書のリストを作る")
    print("確認: load_operators() は Operator オブジェクトのリストを作る")


if __name__ == "__main__":
    main()
