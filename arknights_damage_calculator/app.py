import sys
from pathlib import Path

import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parent

sys.path.append(str(PROJECT_ROOT))

from src.ui.debug_pages.operator_loader_debug import render_debug_operator_loader_page


st.sidebar.title("ページ")

page = st.sidebar.radio(
    "表示するページ",
    [
        "メイン",
        "デバッグ: operator_loader.py",
    ],
)

if page == "メイン":
    st.title("Arknights Damage Calculator")
    st.write("ここに通常のダメージ計算画面を作る")

elif page == "デバッグ: operator_loader.py":
    render_debug_operator_loader_page()
