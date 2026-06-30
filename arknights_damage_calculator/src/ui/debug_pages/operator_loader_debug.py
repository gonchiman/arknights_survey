from dataclasses import asdict, is_dataclass
from pathlib import Path

import streamlit as st

from src.services.operator_loader import (
    filter_playable_operators,
    find_operator_by_id,
    load_operator_dicts,
    load_operators,
)


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OPERATORS_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"


def to_display_data(value):
    if is_dataclass(value):
        return asdict(value)
    return value


def render_debug_operator_loader_page():
    st.title("デバッグ: operator_loader.py")

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

    selected_function = st.selectbox(
        "確認する関数",
        [
            "load_operator_dicts()",
            "load_operators()",
            "filter_playable_operators()",
            "find_operator_by_id()",
        ],
    )

    path = Path(operators_path)

    st.divider()

    if selected_function == "load_operator_dicts()":
        st.subheader("load_operator_dicts()")

        data = load_operator_dicts(path)

        st.write("作られるもの: 辞書のリスト")
        st.write("型:", type(data).__name__)
        st.write("件数:", len(data))
        st.json(data[:display_limit])

    elif selected_function == "load_operators()":
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

    elif selected_function == "filter_playable_operators()":
        st.subheader("filter_playable_operators()")

        operators = load_operators(path)
        playable_operators = filter_playable_operators(operators)

        st.write("作られるもの: プレイアブルオペレーターだけのリスト")
        st.write("型:", type(playable_operators).__name__)
        st.write("件数:", len(playable_operators))

        display_playable_operators = [
            to_display_data(operator)
            for operator in playable_operators[:display_limit]
        ]

        st.json(display_playable_operators)

    elif selected_function == "find_operator_by_id()":
        st.subheader("find_operator_by_id()")

        operators = load_operators(path)
        operator_ids = [operator.id for operator in operators]

        selected_operator_id = st.selectbox(
            "検索する operator_id",
            operator_ids,
        )

        found_operator = find_operator_by_id(selected_operator_id, path)

        st.write("作られるもの: 指定したIDに一致する Operator")
        st.write("検索ID:", selected_operator_id)

        if found_operator is None:
            st.warning("一致するオペレーターが見つかりませんでした。")
        else:
            st.json(to_display_data(found_operator))