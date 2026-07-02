try:
    from src.services.damage_calculator import EnemyStats, calculate_damage_by_type
    from src.services.operator_loader import load_operators
    from src.ui.operator_selector import (
        get_operator_damage_type,
        render_operator_selector,
        render_operator_summary,
    )
except ModuleNotFoundError:
    from services.damage_calculator import EnemyStats, calculate_damage_by_type
    from services.operator_loader import load_operators
    from ui.operator_selector import (
        get_operator_damage_type,
        render_operator_selector,
        render_operator_summary,
    )


def _get_default_damage_type_index(operator, damage_type_options):
    operator_damage_type = get_operator_damage_type(operator)

    if operator_damage_type in damage_type_options:
        return damage_type_options.index(operator_damage_type)

    return 0


def render_damage_calculator_01(data_path):
    import streamlit as st

    st.title("Damage Calculator 01")
    st.caption("ver1.0 用の通常攻撃ダメージ計算機")

    try:
        operators = load_operators(data_path)
    except Exception as error:
        st.error(f"operators.json の読み込みに失敗しました: {error}")
        return

    selected_operator = render_operator_selector(
        operators,
        label="オペレーターを選択",
        key="damage_calculator_01_operator",
    )

    if selected_operator is None:
        return

    st.subheader("オペレーター情報")
    render_operator_summary(selected_operator)

    st.subheader("ダメージ条件")
    damage_type_options = ["physical", "arts"]
    damage_type = st.selectbox(
        "ダメージ種別",
        damage_type_options,
        index=_get_default_damage_type_index(selected_operator, damage_type_options),
        key="damage_calculator_01_damage_type",
    )
    enemy_def = st.number_input(
        "敵防御力",
        min_value=0,
        value=300,
        step=1,
        key="damage_calculator_01_enemy_def",
    )
    enemy_res = st.number_input(
        "敵術耐性",
        min_value=0,
        max_value=100,
        value=20,
        step=1,
        key="damage_calculator_01_enemy_res",
    )

    enemy = EnemyStats(defense=enemy_def, resistance=enemy_res)
    damage = calculate_damage_by_type(selected_operator.stats.atk, damage_type, enemy)

    st.subheader("通常攻撃ダメージ")
    st.metric("ダメージ", damage)
    st.write(
        {
            "damage_type": damage_type,
            "atk": selected_operator.stats.atk,
            "enemy_def": enemy.defense,
            "enemy_res": enemy.resistance,
        }
    )

    st.subheader("使用する式")
    if damage_type == "physical":
        st.code(
            "物理ダメージ = max(攻撃力 - 敵防御力, 攻撃力 * 0.05)",
            language="text",
        )
    else:
        st.code(
            "術ダメージ = 攻撃力 * max(100 - 敵術耐性, 5) / 100",
            language="text",
        )
