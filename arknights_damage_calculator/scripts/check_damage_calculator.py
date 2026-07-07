import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"

sys.path.append(str(SRC_DIR))

from services.damage_calculator import (
    EnemyStats,
    calculate_arts_damage,
    calculate_attack_timeline,
    calculate_normal_attack,
    calculate_normal_attack_damage,
    calculate_physical_damage,
)
from services.operator_loader import load_operators


def main():
    operators = load_operators(DATA_PATH)
    enemy_def = 300
    enemy_res = 20

    print("=== damage_calculator.py check ===")
    print(f"enemy_def: {enemy_def}")
    print(f"enemy_res: {enemy_res}")

    assert calculate_physical_damage(610, 300) == 310
    assert calculate_physical_damage(610, 700) == 30
    assert calculate_arts_damage(612, 20) == 489
    assert calculate_arts_damage(612, 120) == 30

    timeline = calculate_attack_timeline(
        damage=100,
        duration_seconds=5.0,
        attack_interval_seconds=2.0,
    )
    assert timeline == [
        {"time": 2.0, "damage": 100, "cumulative_damage": 100},
        {"time": 4.0, "damage": 100, "cumulative_damage": 200},
    ]

    enemy = EnemyStats(defense=enemy_def, resistance=enemy_res)

    for operator in operators:
        result = calculate_normal_attack(operator, enemy)
        damage = calculate_normal_attack_damage(operator, enemy_def, enemy_res)

        assert result.damage == damage
        print(f"{operator.name}: {damage}")
        assert damage > 0

    print("result: OK")


if __name__ == "__main__":
    main()
