from dataclasses import dataclass


@dataclass(frozen=True)
class Operator:
    id: str
    name: str
    rarity: str
    profession: str
    sub_profession_id: str

    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data["id"],
            name=data["name"],
            rarity=data["rarity"],
            profession=data["profession"],
            sub_profession_id=data.get(
                "sub_profession_id",
                data.get("subProfessionId", ""),
            ),
        )

    @property
    def rarity_stars(self):
        if self.rarity.startswith("TIER_"):
            return int(self.rarity.replace("TIER_", ""))
        return None
