import json
from pathlib import Path

from src.models.voice_line import VoiceLine


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_VOICE_LINES_PATH = ROOT_DIR / "data" / "processed" / "voice_lines.json"


def load_voice_line_dicts(path=DEFAULT_VOICE_LINES_PATH):
    """voice_lines.jsonを読み込み、辞書のリストとして返す。"""
    voice_lines_path = Path(path)

    if not voice_lines_path.exists():
        raise FileNotFoundError(
            f"voice_lines.json not found: {voice_lines_path}"
        )

    with voice_lines_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("voice_lines.json must contain a list")

    return data


def load_voice_lines(path=DEFAULT_VOICE_LINES_PATH):
    """voice_lines.jsonを読み込み、VoiceLineのリストとして返す。"""
    voice_line_dicts = load_voice_line_dicts(path)
    return [
        VoiceLine.from_dict(voice_line_data)
        for voice_line_data in voice_line_dicts
    ]


def filter_voice_lines_by_char_id(voice_lines, char_id):
    """char_idが一致するVoiceLineだけを返す。"""
    return [
        voice_line
        for voice_line in voice_lines
        if voice_line.char_id == char_id
    ]


def find_voice_line_by_id(char_word_id, path=DEFAULT_VOICE_LINES_PATH):
    """char_word_idが一致するVoiceLineを1件返す。"""
    voice_lines = load_voice_lines(path)

    for voice_line in voice_lines:
        if voice_line.char_word_id == char_word_id:
            return voice_line

    return None
