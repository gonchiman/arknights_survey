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

    with operators_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("operators.json must contain a list")

    return data


def load_operators(path=DEFAULT_OPERATORS_PATH):
    """operators.jsonを読み込み、Operatorオブジェクトのリストとして返す。"""
    operator_dicts = load_operator_dicts(path)
    return [Operator.from_dict(operator_data) for operator_data in operator_dicts]


def find_operator_by_id(operator_id, path=DEFAULT_OPERATORS_PATH):
    """idが一致するOperatorを1件返す。見つからない場合はNoneを返す。"""
    operators = load_operators(path)

    for operator in operators:
        if operator.id == operator_id:
            return operator

    return None


def filter_playable_operators(operators):
    """char_で始まる通常オペレーターだけを返す。"""
    return [operator for operator in operators if operator.id.startswith("char_")]
