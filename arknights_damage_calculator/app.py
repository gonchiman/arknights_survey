import sys
from pathlib import Path

import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"

sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(SRC_DIR))

from src.ui.debug_pages.damage_calculator_debug import (
    render_damage_calculator_debug_page,
)
from src.ui.debug_pages.operator_loader_debug import render_debug_operator_loader_page
from src.services.damage_calculator import EnemyStats, calculate_normal_attack
from src.services.operator_loader import load_operators
from src.ui.operator_selector import render_operator_selector, render_operator_summary


DATA_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"


st.sidebar.title("ページ")

page = st.sidebar.radio(
    "表示するページ",
    [
        "メイン",
        "デバッグ: operator_loader.py",
        "デバッグ: damage_calculator.py",
    ],
)

if page == "メイン":
    st.title("Arknights Damage Calculator")

    try:
        operators = load_operators(DATA_PATH)
    except Exception as error:
        st.error(f"operators.json の読み込みに失敗しました: {error}")
        st.stop()

    selected_operator = render_operator_selector(
        operators,
        label="オペレーターを選択",
        key="main_operator_selector",
    )

    if selected_operator is not None:
        st.subheader("オペレーター情報")
        render_operator_summary(selected_operator)

        st.subheader("敵ステータス")
        enemy_def = st.number_input("敵防御力", min_value=0, value=300, step=1)
        enemy_res = st.number_input("敵術耐性", min_value=0, max_value=100, value=20, step=1)

        enemy = EnemyStats(defense=enemy_def, resistance=enemy_res)
        result = calculate_normal_attack(selected_operator, enemy)

        st.subheader("通常攻撃ダメージ")
        st.metric("ダメージ", result.damage)
        st.write(
            {
                "damage_type": result.damage_type,
                "atk": result.attack,
                "enemy_def": result.enemy_defense,
                "enemy_res": result.enemy_resistance,
            }
        )

elif page == "デバッグ: operator_loader.py":
    render_debug_operator_loader_page()

elif page == "デバッグ: damage_calculator.py":
    render_damage_calculator_debug_page()
