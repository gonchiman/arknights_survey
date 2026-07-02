import sys
from pathlib import Path

import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"

sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(SRC_DIR))

from src.ui.pages.damage_calculators_page import render_damage_calculators_page
from src.ui.pages.debugs_page import render_debugs_page


DATA_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"


st.sidebar.title("ページ")

page = st.sidebar.radio(
    "表示するページ",
    [
        "ホーム",
        "ダメージ計算機",
        "デバッグ",
    ],
)

if page == "ホーム":
    st.title("Arknights Damage Calculator")
    st.write("このアプリでは、アークナイツのダメージ計算を確認できます。")
    st.write("左のサイドバーから、ダメージ計算機またはデバッグページへ移動できます。")

elif page == "ダメージ計算機":
    render_damage_calculators_page(DATA_PATH)

elif page == "デバッグ":
    render_debugs_page()
