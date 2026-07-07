from dataclasses import dataclass


MIN_DAMAGE_RATE = 0.05


@dataclass
class EnemyStats:
    defense: int = 0
    resistance: int = 0


@dataclass
class DamageResult:
    attacker_name: str
    damage_type: str
    attack: int
    enemy_defense: int
    enemy_resistance: int
    damage: int


def calculate_physical_damage(atk, enemy_def):
    minimum_damage = int(atk * MIN_DAMAGE_RATE)
    return max(int(atk - enemy_def), minimum_damage)


def calculate_arts_damage(atk, enemy_res):
    damage_rate = max(100 - enemy_res, MIN_DAMAGE_RATE * 100) / 100
    return int(atk * damage_rate)


def calculate_damage_by_type(atk, damage_type, enemy):
    if damage_type == "physical":
        return calculate_physical_damage(atk, enemy.defense)

    if damage_type == "arts":
        return calculate_arts_damage(atk, enemy.resistance)

    raise ValueError(f"Unknown damage type: {damage_type}")


def calculate_normal_attack(operator, enemy=None):
    if enemy is None:
        enemy = EnemyStats()

    damage = calculate_damage_by_type(
        operator.stats.atk,
        operator.damage_type,
        enemy,
    )

    return DamageResult(
        attacker_name=operator.name,
        damage_type=operator.damage_type,
        attack=operator.stats.atk,
        enemy_defense=enemy.defense,
        enemy_resistance=enemy.resistance,
        damage=damage,
    )


def calculate_normal_attack_damage(operator, enemy_def=0, enemy_res=0):
    enemy = EnemyStats(defense=enemy_def, resistance=enemy_res)
    return calculate_normal_attack(operator, enemy).damage


def calculate_attack_timeline(damage, duration_seconds, attack_interval_seconds):
    if duration_seconds < 0:
        raise ValueError("duration_seconds must be 0 or greater")

    if attack_interval_seconds <= 0:
        raise ValueError("attack_interval_seconds must be greater than 0")

    attack_count = int(duration_seconds // attack_interval_seconds)
    timeline = []
    cumulative_damage = 0

    for attack_index in range(1, attack_count + 1):
        attack_time = round(attack_index * attack_interval_seconds, 2)
        cumulative_damage += damage

        timeline.append(
            {
                "time": attack_time,
                "damage": damage,
                "cumulative_damage": cumulative_damage,
            }
        )

    return timeline
