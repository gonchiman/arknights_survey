try:
    from src.ui.debug_pages.damage_calculator_debug import (
        render_damage_calculator_debug_page,
    )
    from src.ui.debug_pages.operator_loader_debug import render_debug_operator_loader_page
    from src.ui.debug_pages.trait_calculator_debug import (
        render_trait_calculator_debug_page,
    )
except ModuleNotFoundError:
    from ui.debug_pages.damage_calculator_debug import (
        render_damage_calculator_debug_page,
    )
    from ui.debug_pages.operator_loader_debug import render_debug_operator_loader_page
    from ui.debug_pages.trait_calculator_debug import (
        render_trait_calculator_debug_page,
    )


def render_debugs_page():
    import streamlit as st

    st.title("Debugs")

    debug_page = st.selectbox(
        "デバッグするモジュール",
        [
            "operator_loader.py",
            "damage_calculator.py",
            "trait_calculator.py",
        ],
    )

    if debug_page == "operator_loader.py":
        render_debug_operator_loader_page()

    elif debug_page == "damage_calculator.py":
        render_damage_calculator_debug_page()

    elif debug_page == "trait_calculator.py":
        render_trait_calculator_debug_page()
