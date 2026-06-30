import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
OPERATORS_JSON = PROJECT_ROOT / "data" / "processed" / "operators.json"

sys.path.append(str(PROJECT_ROOT))

from src.models.operator import Operator
from src.services.operator_loader import load_operator_dicts, load_operators


def main():
    operator_dicts = load_operator_dicts(OPERATORS_JSON)
    operators = load_operators(OPERATORS_JSON)

    print("=== check_operator_loader.py ===")
    print(f"json path: {OPERATORS_JSON}")
    print(f"operator_dicts type: {type(operator_dicts).__name__}")
    print(f"operator_dicts count: {len(operator_dicts)}")
    print(f"operators type: {type(operators).__name__}")
    print(f"operators count: {len(operators)}")

    assert isinstance(operator_dicts, list)
    assert isinstance(operators, list)
    assert len(operator_dicts) == len(operators)
    assert all(isinstance(operator, Operator) for operator in operators)

    if operators:
        first_operator = operators[0]
        print("first operator:")
        print(f"  name: {first_operator.name}")
        print(f"  rarity: {first_operator.rarity}")
        print(f"  atk: {first_operator.atk}")

    print("result: OK")


if __name__ == "__main__":
    main()
