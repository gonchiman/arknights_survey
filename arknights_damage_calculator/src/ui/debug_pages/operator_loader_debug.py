from pathlib import Path

try:
    from src.services.operator_loader import load_operator_dicts, load_operators
except ModuleNotFoundError:
    from services.operator_loader import load_operator_dicts, load_operators


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"


def render_debug_operator_loader_page():
    import streamlit as st

    st.title("Operator Loader Debug")
    st.caption("operator_loader.py の読み込み結果を確認するページ")

    data_path = st.text_input("operators.json path", value=str(DATA_PATH))

    try:
        operator_dicts = load_operator_dicts(data_path)
        operators = load_operators(data_path)
    except Exception as error:
        st.error(f"読み込みに失敗しました: {error}")
        return

    st.subheader("json.load result")
    st.write(
        {
            "type": type(operator_dicts).__name__,
            "count": len(operator_dicts),
        }
    )

    if operator_dicts:
        st.write("first item")
        st.json(operator_dicts[0])

    st.subheader("loaded operators")
    st.write(
        {
            "type": type(operators).__name__,
            "count": len(operators),
        }
    )

    if not operators:
        st.warning("No operators found.")
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
            "stars": selected_operator.rarity_stars,
            "damage_type": selected_operator.damage_type,
            "max_hp": selected_operator.stats.max_hp,
            "atk": selected_operator.stats.atk,
            "def": selected_operator.stats.defense,
            "res": selected_operator.stats.resistance,
        }
    )


def render_operator_loader_debug_page():
    render_debug_operator_loader_page()
