import sys
from pathlib import Path

import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"

sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(SRC_DIR))

from src.ui.voice_text_page import render_voice_text_page


st.set_page_config(
    page_title="Arknights Voice Text Viewer",
    layout="wide",
)

render_voice_text_page()
