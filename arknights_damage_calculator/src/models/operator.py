from dataclasses import dataclass


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
        )

    @property
    def rarity_stars(self):
        if self.rarity.startswith("TIER_"):
            return int(self.rarity.replace("TIER_", ""))
        return None
