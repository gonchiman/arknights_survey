ALL_FILTER_LABEL = "すべて"

PROFESSION_LABELS = {
    "PIONEER": "先鋒",
    "WARRIOR": "前衛",
    "TANK": "重装",
    "SNIPER": "狙撃",
    "CASTER": "術師",
    "MEDIC": "医療",
    "SUPPORT": "補助",
    "SPECIAL": "特殊",
    "TOKEN": "トークン",
    "TRAP": "召喚物",
}

PROFESSION_ORDER = [
    "PIONEER",
    "WARRIOR",
    "TANK",
    "SNIPER",
    "CASTER",
    "MEDIC",
    "SUPPORT",
    "SPECIAL",
]


def get_profession_display_name(profession):
    if not profession:
        return "不明"

    return PROFESSION_LABELS.get(profession, profession)


def get_rarity_display_name(rarity_stars):
    if rarity_stars is None:
        return ALL_FILTER_LABEL

    return f"星{rarity_stars}"


def get_operator_display_name(operator):
    rarity = operator.rarity_stars
    rarity_text = f"星{rarity}" if rarity is not None else operator.rarity
    profession_text = get_profession_display_name(operator.profession)

    return (
        f"{operator.name} "
        f"({rarity_text}, {profession_text}, {operator.sub_profession_id}, "
        f"{operator.damage_type}, ATK {operator.stats.atk})"
    )


def get_operator_damage_type(operator):
    damage_type = getattr(operator, "damage_type", None)

    if damage_type is None:
        return None

    return str(damage_type).strip().lower()


def find_operator_by_name(operators, name):
    for operator in operators:
        if operator.name == name:
            return operator

    return None


def filter_operators(
    operators,
    rarity_stars=None,
    profession=None,
    sub_profession_id=None,
):
    filtered_operators = list(operators)

    if rarity_stars is not None:
        filtered_operators = [
            operator
            for operator in filtered_operators
            if operator.rarity_stars == rarity_stars
        ]

    if profession is not None:
        filtered_operators = [
            operator
            for operator in filtered_operators
            if operator.profession == profession
        ]

    if sub_profession_id is not None:
        filtered_operators = [
            operator
            for operator in filtered_operators
            if operator.sub_profession_id == sub_profession_id
        ]

    return filtered_operators


def get_rarity_options(operators):
    rarity_values = {
        operator.rarity_stars
        for operator in operators
        if operator.rarity_stars is not None
    }
    return [None] + sorted(rarity_values, reverse=True)


def get_profession_options(operators):
    profession_values = {operator.profession for operator in operators if operator.profession}
    ordered_professions = [
        profession
        for profession in PROFESSION_ORDER
        if profession in profession_values
    ]
    extra_professions = sorted(profession_values - set(ordered_professions))
    return [None] + ordered_professions + extra_professions


def get_sub_profession_options(operators):
    sub_profession_values = {
        operator.sub_profession_id
        for operator in operators
        if operator.sub_profession_id
    }
    return [None] + sorted(sub_profession_values)


def render_operator_selector(operators, label="Operator", key=None):
    import streamlit as st

    if not operators:
        st.warning("No operators found.")
        return None

    key_prefix = key or "operator_selector"
    rarity = st.selectbox(
        "レアリティ",
        get_rarity_options(operators),
        format_func=get_rarity_display_name,
        key=f"{key_prefix}_rarity",
    )

    rarity_filtered_operators = filter_operators(operators, rarity_stars=rarity)
    profession = st.selectbox(
        "職業",
        get_profession_options(rarity_filtered_operators),
        format_func=lambda value: (
            ALL_FILTER_LABEL
            if value is None
            else get_profession_display_name(value)
        ),
        key=f"{key_prefix}_profession",
    )

    profession_filtered_operators = filter_operators(
        rarity_filtered_operators,
        profession=profession,
    )
    sub_profession_id = st.selectbox(
        "職分",
        get_sub_profession_options(profession_filtered_operators),
        format_func=lambda value: ALL_FILTER_LABEL if value is None else value,
        key=f"{key_prefix}_sub_profession",
    )

    filtered_operators = filter_operators(
        profession_filtered_operators,
        sub_profession_id=sub_profession_id,
    )

    if not filtered_operators:
        st.warning("No operators match the filters.")
        return None

    st.caption(f"{len(filtered_operators)} / {len(operators)} operators")

    return st.selectbox(
        label,
        filtered_operators,
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
            "profession": operator.profession,
            "sub_profession_id": operator.sub_profession_id,
            "damage_type": operator.damage_type,
            "max_hp": operator.stats.max_hp,
            "atk": operator.stats.atk,
            "def": operator.stats.defense,
            "res": operator.stats.resistance,
        }
    )

