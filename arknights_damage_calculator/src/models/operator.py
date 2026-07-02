from dataclasses import dataclass


@dataclass
class OperatorStats:
    max_hp: int
    atk: int
    defense: int
    resistance: int


def infer_damage_type(profession, sub_profession_id):
    if profession in {"CASTER", "SUPPORT"}:
        return "arts"

    if sub_profession_id in {"artsfghter"}:
        return "arts"

    return "physical"


@dataclass
class Operator:
    id: str
    name: str
    rarity: str
    profession: str
    sub_profession_id: str
    max_hp: int
    atk: int
    defense: int
    magic_resistance: int
    base_attack_time: float
    block_cnt: int
    damage_type: str

    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data["id"],
            name=data["name"],
            rarity=data["rarity"],
            profession=data["profession"],
            sub_profession_id=data["sub_profession_id"],
            max_hp=data["max_hp"],
            atk=data["atk"],
            defense=data["def"],
            magic_resistance=data["magic_resistance"],
            base_attack_time=data["base_attack_time"],
            block_cnt=data["block_cnt"],
            damage_type=data.get(
                "damage_type",
                infer_damage_type(data["profession"], data["sub_profession_id"]),
            ),
        )

    @property
    def rarity_stars(self):
        if self.rarity.startswith("TIER_"):
            return int(self.rarity.replace("TIER_", ""))
        return None

    @property
    def stats(self):
        return OperatorStats(
            max_hp=self.max_hp,
            atk=self.atk,
            defense=self.defense,
            resistance=self.magic_resistance,
        )
