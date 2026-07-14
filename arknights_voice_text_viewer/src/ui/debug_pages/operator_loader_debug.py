from src.services.operator_loader import (
    DEFAULT_OPERATORS_PATH,
    find_operator_by_id,
    load_operator_dicts,
    load_operators,
)


def _render_load_operator_dicts_debug(st, data_path):
    operator_dicts = load_operator_dicts(data_path)

    st.write(
        {
            "type": type(operator_dicts).__name__,
            "count": len(operator_dicts),
        }
    )

    if operator_dicts:
        st.write("first item")
        st.json(operator_dicts[0])
    else:
        st.warning("operators.json は空です。")


def _render_load_operators_debug(st, data_path):
    operators = load_operators(data_path)

    st.write(
        {
            "type": type(operators).__name__,
            "count": len(operators),
        }
    )

    if not operators:
        st.warning("Operatorが見つかりません。")
        return

    selected_operator = st.selectbox(
        "表示するOperator",
        operators,
        format_func=lambda operator: operator.name,
    )

    st.write(
        {
            "id": selected_operator.id,
            "name": selected_operator.name,
            "rarity": selected_operator.rarity,
            "rarity_stars": selected_operator.rarity_stars,
            "profession": selected_operator.profession,
            "sub_profession_id": selected_operator.sub_profession_id,
        }
    )


def _render_find_operator_by_id_debug(st, data_path):
    operator_id = st.text_input(
        "検索するOperator ID",
        value="char_002_amiya",
    )

    if not operator_id:
        st.info("Operator IDを入力してください。")
        return

    operator = find_operator_by_id(operator_id, data_path)

    if operator is None:
        st.warning(f"Operatorが見つかりません: {operator_id}")
        return

    st.write(
        {
            "id": operator.id,
            "name": operator.name,
            "rarity": operator.rarity,
            "rarity_stars": operator.rarity_stars,
            "profession": operator.profession,
            "sub_profession_id": operator.sub_profession_id,
        }
    )


def render_debug_operator_loader_page():
    import streamlit as st

    st.title("Operator Loader Debug")
    st.caption("operator_loader.pyの関数を個別に確認するページ")

    data_path = st.text_input(
        "operators.json path",
        value=str(DEFAULT_OPERATORS_PATH),
    )
    function_name = st.selectbox(
        "確認する関数",
        [
            "load_operator_dicts",
            "load_operators",
            "find_operator_by_id",
        ],
    )

    try:
        if function_name == "load_operator_dicts":
            _render_load_operator_dicts_debug(st, data_path)
        elif function_name == "load_operators":
            _render_load_operators_debug(st, data_path)
        elif function_name == "find_operator_by_id":
            _render_find_operator_by_id_debug(st, data_path)
    except Exception as error:
        st.error(f"実行に失敗しました: {error}")


def render_operator_loader_debug_page():
    render_debug_operator_loader_page()
