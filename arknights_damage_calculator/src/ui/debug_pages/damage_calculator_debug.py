from dataclasses import asdict
from types import SimpleNamespace

try:
    from src.services.damage_calculator import (
        EnemyStats,
        calculate_arts_damage,
        calculate_damage_by_type,
        calculate_normal_attack,
        calculate_normal_attack_damage,
        calculate_physical_damage,
    )
except ModuleNotFoundError:
    from services.damage_calculator import (
        EnemyStats,
        calculate_arts_damage,
        calculate_damage_by_type,
        calculate_normal_attack,
        calculate_normal_attack_damage,
        calculate_physical_damage,
    )


def _build_debug_operator(name, atk, damage_type):
    return SimpleNamespace(
        name=name,
        damage_type=damage_type,
        stats=SimpleNamespace(atk=atk),
    )


def _render_result(st, result):
    st.subheader("計算結果")

    if hasattr(result, "__dataclass_fields__"):
        st.json(asdict(result))
        st.metric("damage", result.damage)
        return

    st.metric("damage", result)


def render_damage_calculator_debug_page():
    import streamlit as st

    st.title("Damage Calculator Debug")
    st.caption("damage_calculator.py の各計算関数を選んで確認するページ")

    target = st.selectbox(
        "テストする関数",
        [
            "calculate_normal_attack",
            "calculate_normal_attack_damage",
            "calculate_damage_by_type",
            "calculate_physical_damage",
            "calculate_arts_damage",
        ],
    )

    st.subheader("入力")

    operator_name = st.text_input("operator name", value="Debug Operator")
    atk = st.number_input("atk", min_value=0, value=600, step=1)
    enemy_def = st.number_input("enemy_def", min_value=0, value=300, step=1)
    enemy_res = st.number_input("enemy_res", min_value=0, max_value=100, value=20, step=1)
    damage_type = st.selectbox("damage_type", ["physical", "arts"])

    enemy = EnemyStats(defense=enemy_def, resistance=enemy_res)
    operator = _build_debug_operator(operator_name, atk, damage_type)

    st.subheader("使用する式")

    if target == "calculate_physical_damage":
        st.code(
            "physical_damage = max(atk - enemy_def, atk * 0.05)",
            language="text",
        )
        result = calculate_physical_damage(atk, enemy_def)

    elif target == "calculate_arts_damage":
        st.code(
            "arts_damage = atk * max(100 - enemy_res, 5) / 100",
            language="text",
        )
        result = calculate_arts_damage(atk, enemy_res)

    elif target == "calculate_damage_by_type":
        st.code(
            "damage = calculate_damage_by_type(atk, damage_type, enemy)",
            language="python",
        )
        result = calculate_damage_by_type(atk, damage_type, enemy)

    elif target == "calculate_normal_attack_damage":
        st.code(
            "damage = calculate_normal_attack_damage(operator, enemy_def, enemy_res)",
            language="python",
        )
        result = calculate_normal_attack_damage(operator, enemy_def, enemy_res)

    else:
        st.code(
            "result = calculate_normal_attack(operator, enemy)",
            language="python",
        )
        result = calculate_normal_attack(operator, enemy)

    _render_result(st, result)

    st.subheader("補足")
    st.write("ステージ補正は、ver1.0ではまだ実装せず 1.0 固定として扱います。")


def render_debug_damage_calculator_page():
    render_damage_calculator_debug_page()


def render_damage_calculator_page():
    render_damage_calculator_debug_page()
