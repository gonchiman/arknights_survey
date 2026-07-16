from pathlib import Path

try:
    from src.services.voice_line_loader import (
        filter_voice_lines_by_char_id,
        load_voice_lines,
    )
except ModuleNotFoundError:
    from services.voice_line_loader import (
        filter_voice_lines_by_char_id,
        load_voice_lines,
    )


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "voice_lines.json"


def _matches_query(voice_line, query):
    if not query:
        return True

    normalized_query = query.casefold()

    return any(
        normalized_query in value.casefold()
        for value in (
            voice_line.voice_title,
            voice_line.voice_text,
            voice_line.voice_id,
            voice_line.char_word_id,
        )
    )


def _render_voice_line(st, voice_line):
    title = voice_line.voice_title or voice_line.voice_id or voice_line.char_word_id

    st.subheader(title)
    st.write(voice_line.voice_text)

    with st.expander("詳細"):
        st.write(
            {
                "char_word_id": voice_line.char_word_id,
                "word_key": voice_line.word_key,
                "char_id": voice_line.char_id,
                "voice_id": voice_line.voice_id,
                "voice_index": voice_line.voice_index,
                "voice_type": voice_line.voice_type,
                "unlock_type": voice_line.unlock_type,
                "unlock_params": list(voice_line.unlock_params),
                "lock_description": voice_line.lock_description,
                "place_type": voice_line.place_type,
                "voice_asset": voice_line.voice_asset,
            }
        )


def render_voice_text_page(data_path=DATA_PATH):
    import streamlit as st

    st.title("Arknights Voice Text Viewer")
    st.caption("オペレーターごとの英語ボイステキストを表示するページ")

    try:
        voice_lines = load_voice_lines(data_path)
    except Exception as error:
        st.error(f"voice_lines.json の読み込みに失敗しました: {error}")
        return

    if not voice_lines:
        st.warning("表示できるボイステキストがありません。")
        return

    char_ids = sorted({voice_line.char_id for voice_line in voice_lines})

    selected_char_id = st.selectbox(
        "オペレーターID",
        char_ids,
    )

    query = st.text_input(
        "ボイスを検索",
        placeholder="タイトルまたは本文を入力",
    )

    selected_voice_lines = filter_voice_lines_by_char_id(
        voice_lines,
        selected_char_id,
    )
    selected_voice_lines = [
        voice_line
        for voice_line in selected_voice_lines
        if _matches_query(voice_line, query)
    ]
    selected_voice_lines.sort(
        key=lambda voice_line: (
            voice_line.voice_index,
            voice_line.char_word_id,
        )
    )

    st.write(
        {
            "char_id": selected_char_id,
            "voice_line_count": len(selected_voice_lines),
        }
    )

    if not selected_voice_lines:
        st.info("条件に一致するボイステキストはありません。")
        return

    for voice_line in selected_voice_lines:
        _render_voice_line(st, voice_line)
