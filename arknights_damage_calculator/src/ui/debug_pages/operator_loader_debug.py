from pathlib import Path

try:
    from src.services.operator_loader import load_operator_dicts, load_operators
except ModuleNotFoundError:
    from services.operator_loader import load_operator_dicts, load_operators


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"


def _render_trait_debug(st, operator_dict, operator):
    st.subheader("trait")

    st.write("raw trait")
    raw_trait = operator_dict.get("trait") if operator_dict else None

    if raw_trait is None:
        st.info("operators.json の trait は null です。")
    else:
        st.json(raw_trait)

    st.write("loaded Trait")

    if operator.trait is None:
        st.info("Operator.trait は None です。")
        return

    st.write(
        {
            "type": type(operator.trait).__name__,
            "candidate_count": len(operator.trait.candidates),
        }
    )

    for index, candidate in enumerate(operator.trait.candidates, start=1):
        with st.expander(f"candidate {index}", expanded=index == 1):
            st.write(
                {
                    "unlock_phase": candidate.unlock_phase,
                    "unlock_level": candidate.unlock_level,
                    "required_potential_rank": candidate.required_potential_rank,
                    "description": candidate.description,
                    "prefab_key": candidate.prefab_key,
                    "range_id": candidate.range_id,
                }
            )

            if not candidate.blackboard:
                st.info("blackboard は空です。")
                continue

            st.table(
                [
                    {
                        "key": item.key,
                        "value": item.value,
                        "value_str": item.value_str,
                    }
                    for item in candidate.blackboard
                ]
            )


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
            "profession": selected_operator.profession,
            "sub_profession_id": selected_operator.sub_profession_id,
            "damage_type": selected_operator.damage_type,
            "max_hp": selected_operator.stats.max_hp,
            "atk": selected_operator.stats.atk,
            "def": selected_operator.stats.defense,
            "res": selected_operator.stats.resistance,
        }
    )

    selected_operator_dict = next(
        (
            operator_dict
            for operator_dict in operator_dicts
            if operator_dict.get("id") == selected_operator.id
        ),
        None,
    )

    _render_trait_debug(st, selected_operator_dict, selected_operator)


def render_operator_loader_debug_page():
    render_debug_operator_loader_page()
