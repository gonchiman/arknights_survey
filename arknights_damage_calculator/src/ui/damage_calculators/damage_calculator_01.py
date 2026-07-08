try:
    from src.services.damage_calculator import EnemyStats, calculate_damage_by_type
    from src.services.operator_loader import filter_playable_operators, load_operators
    from src.ui.operator_selector import (
        get_operator_damage_type,
        render_operator_selector,
    )
except ModuleNotFoundError:
    from services.damage_calculator import EnemyStats, calculate_damage_by_type
    from services.operator_loader import filter_playable_operators, load_operators
    from ui.operator_selector import (
        get_operator_damage_type,
        render_operator_selector,
    )


def render_damage_calculator_01(data_path):
    import streamlit as st

    st.title("Damage Calculator 01")
    st.caption("ver1.0 用の通常攻撃ダメージ計算機")

    try:
        operators = filter_playable_operators(load_operators(data_path))
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

    damage_type = get_operator_damage_type(selected_operator)

    if damage_type not in {"physical", "arts"}:
        st.error(f"未対応のダメージ種別です: {damage_type}")
        return

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

    st.table(
        {
            "項目": ["ダメージ種別", "基礎攻撃力"],
            "値": [damage_type, selected_operator.stats.atk],
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
