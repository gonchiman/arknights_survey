def get_operator_display_name(operator):
    rarity = operator.rarity_stars
    rarity_text = f"{rarity} stars" if rarity is not None else operator.rarity

    return (
        f"{operator.name} "
        f"({rarity_text}, {operator.damage_type}, ATK {operator.stats.atk})"
    )


def find_operator_by_name(operators, name):
    for operator in operators:
        if operator.name == name:
            return operator

    return None


def render_operator_selector(operators, label="Operator", key=None):
    import streamlit as st

    if not operators:
        st.warning("No operators found.")
        return None

    return st.selectbox(
        label,
        operators,
        format_func=get_operator_display_name,
        key=key,
    )


def render_operator_summary(operator):
    import streamlit as st

    if operator is None:
        return

    st.write(
        {
            "id": operator.id,
            "name": operator.name,
            "rarity": operator.rarity,
            "stars": operator.rarity_stars,
            "damage_type": operator.damage_type,
            "max_hp": operator.stats.max_hp,
            "atk": operator.stats.atk,
            "def": operator.stats.defense,
            "res": operator.stats.resistance,
        }
    )

