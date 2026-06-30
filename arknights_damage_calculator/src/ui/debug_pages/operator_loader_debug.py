from dataclasses import asdict, is_dataclass
from pathlib import Path

import streamlit as st

from src.services.operator_loader import load_operator_dicts, load_operators


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OPERATORS_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"


def to_display_data(value):
    if is_dataclass(value):
        return asdict(value)
    return value


def render_debug_operator_loader_page():
    st.title("デバッグ: operator_loader.py")

    st.write("`operator_loader.py` の関数が作るデータを確認します。")

    operators_path = st.text_input(
        "operators.json のパス",
        value=str(DEFAULT_OPERATORS_PATH),
    )

    display_limit = st.number_input(
        "表示件数",
        min_value=1,
        max_value=20,
        value=1,
    )

    if st.button("読み込む"):
        path = Path(operators_path)

        st.subheader("load_operator_dicts()")

        data = load_operator_dicts(path)

        st.write("作られるもの: 辞書のリスト")
        st.write("型:", type(data).__name__)
        st.write("件数:", len(data))
        st.json(data[:display_limit])

        st.subheader("load_operators()")

        operators = load_operators(path)

        st.write("作られるもの: Operator オブジェクトのリスト")
        st.write("型:", type(operators).__name__)
        st.write("件数:", len(operators))

        display_operators = [
            to_display_data(operator)
            for operator in operators[:display_limit]
        ]

        st.json(display_operators)
