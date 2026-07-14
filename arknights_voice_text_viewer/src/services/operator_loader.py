import json
from pathlib import Path

from src.models.operator import Operator


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OPERATORS_PATH = ROOT_DIR / "data" / "processed" / "operators.json"


def load_operator_dicts(path=DEFAULT_OPERATORS_PATH):
    """operators.jsonを読み込み、辞書のリストとして返す。"""
    operators_path = Path(path)

    if not operators_path.exists():
        raise FileNotFoundError(f"operators.json not found: {operators_path}")

    with operators_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("operators.json must contain a list")

    return data


def load_operators(path=DEFAULT_OPERATORS_PATH):
    """operators.jsonを読み込み、Operatorのリストとして返す。"""
    return [
        Operator.from_dict(operator_data)
        for operator_data in load_operator_dicts(path)
    ]


def find_operator_by_id(operator_id, path=DEFAULT_OPERATORS_PATH):
    """指定したIDのOperatorを返す。見つからない場合はNoneを返す。"""
    for operator in load_operators(path):
        if operator.id == operator_id:
            return operator

    return None
