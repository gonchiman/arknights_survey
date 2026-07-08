try:
    from src.ui.damage_calculators.damage_calculator_01 import (
        render_damage_calculator_01,
    )
except ModuleNotFoundError:
    from ui.damage_calculators.damage_calculator_01 import render_damage_calculator_01


def render_damage_calculators_page(data_path):
    import streamlit as st

    st.title("Damage Calculators")

    calculator = st.selectbox(
        "計算機のバージョンを選択",
        [
            "damage_calculator_01",
        ],
    )

    if calculator == "damage_calculator_01":
        render_damage_calculator_01(data_path)
