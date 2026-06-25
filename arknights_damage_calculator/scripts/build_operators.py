import json
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]

RAW_CHARACTER_TABLE_PATH = ROOT_DIR / "data" / "raw" / "ArknightsGameData" / "character_table.json"
OUTPUT_OPERATORS_PATH = ROOT_DIR / "data" / "processed" / "operators.json"


def load_character_table():
    with RAW_CHARACTER_TABLE_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def get_latest_attributes(character):
    phases = character.get("phases", [])

    if not phases:
        return None

    latest_phase = phases[-1]
    key_frames = latest_phase.get("attributesKeyFrames", [])

    if not key_frames:
        return None

    latest_key_frame = key_frames[-1]
    return latest_key_frame.get("data")


def build_operator(character_id, character):
    attributes = get_latest_attributes(character)

    if attributes is None:
        return None

    return {
        "id": character_id,
        "name": character.get("name"),
        "rarity": character.get("rarity"),
        "profession": character.get("profession"),
        "sub_profession_id": character.get("subProfessionId"),
        "max_hp": attributes.get("maxHp"),
        "atk": attributes.get("atk"),
        "def": attributes.get("def"),
        "magic_resistance": attributes.get("magicResistance"),
        "base_attack_time": attributes.get("baseAttackTime"),
        "block_cnt": attributes.get("blockCnt"),
    }


def main():
    character_table = load_character_table()

    operators = []

    for character_id, character in character_table.items():
        # 星6だけ抽出
        # ArknightsGameDataでは 星6 = rarity 5
        if character.get("rarity") != 5:
            continue

        operator = build_operator(character_id, character)

        if operator is not None:
            operators.append(operator)

    OUTPUT_OPERATORS_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_OPERATORS_PATH.open("w", encoding="utf-8") as f:
        json.dump(operators, f, ensure_ascii=False, indent=2)

    print(f"{len(operators)} operators written to {OUTPUT_OPERATORS_PATH}")


if __name__ == "__main__":
    main()
