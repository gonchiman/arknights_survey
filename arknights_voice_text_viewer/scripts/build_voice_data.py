import json
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]

RAW_CHARWORD_TABLE_PATH = (
    ROOT_DIR
    / "data"
    / "raw"
    / "ArknightsGameData_YoStar"
    / "en_US"
    / "gamedata"
    / "excel"
    / "charword_table.json"
)
OUTPUT_VOICE_LINES_PATH = ROOT_DIR / "data" / "processed" / "voice_lines.json"


def load_charword_table(path=RAW_CHARWORD_TABLE_PATH):
    charword_table_path = Path(path)

    if not charword_table_path.exists():
        raise FileNotFoundError(
            f"charword_table.json not found: {charword_table_path}"
        )

    with charword_table_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError("charword_table.json must contain an object")

    return data


def build_voice_line(char_word_id, voice_data):
    if not isinstance(voice_data, dict):
        return None

    char_id = voice_data.get("charId")
    voice_text = voice_data.get("voiceText")

    if not char_id or not voice_text:
        return None

    return {
        "charWordId": voice_data.get("charWordId", char_word_id),
        "wordKey": voice_data.get("wordKey", char_id),
        "charId": char_id,
        "voiceId": voice_data.get("voiceId", ""),
        "voiceText": voice_text,
        "voiceTitle": voice_data.get("voiceTitle", ""),
        "voiceIndex": voice_data.get("voiceIndex", 0),
        "voiceType": voice_data.get("voiceType", ""),
        "unlockType": voice_data.get("unlockType", "DIRECT"),
        "unlockParam": voice_data.get("unlockParam", {}),
        "lockDescription": voice_data.get("lockDescription", ""),
        "placeType": voice_data.get("placeType", ""),
        "voiceAsset": voice_data.get("voiceAsset", ""),
    }


def build_voice_lines(charword_table):
    char_words = charword_table.get("charWords")

    if not isinstance(char_words, dict):
        raise ValueError("charword_table.json must contain a charWords object")

    voice_lines = []

    for char_word_id, voice_data in char_words.items():
        voice_line = build_voice_line(char_word_id, voice_data)

        if voice_line is not None:
            voice_lines.append(voice_line)

    voice_lines.sort(
        key=lambda voice_line: (
            voice_line["charId"],
            int(voice_line["voiceIndex"]),
            voice_line["charWordId"],
        )
    )

    return voice_lines


def write_voice_lines(voice_lines, path=OUTPUT_VOICE_LINES_PATH):
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(voice_lines, file, ensure_ascii=False, indent=2)


def main(
    input_path=RAW_CHARWORD_TABLE_PATH,
    output_path=OUTPUT_VOICE_LINES_PATH,
):
    charword_table = load_charword_table(input_path)
    voice_lines = build_voice_lines(charword_table)
    write_voice_lines(voice_lines, output_path)

    print(f"{len(voice_lines)} voice lines written to {output_path}")


if __name__ == "__main__":
    main()
