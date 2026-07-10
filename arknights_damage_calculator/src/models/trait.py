from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class TraitBlackboardItem:
    key: str
    value: float
    value_str: str | None = None

    @classmethod
    def from_dict(cls, data):
        return cls(
            key=data["key"],
            value=float(data.get("value", 0)),
            value_str=data.get("valueStr"),
        )


@dataclass(frozen=True)
class TraitCandidate:
    unlock_phase: str
    unlock_level: int
    required_potential_rank: int
    description: str
    blackboard: tuple[TraitBlackboardItem, ...] = field(default_factory=tuple)
    prefab_key: str | None = None
    range_id: str | None = None

    @classmethod
    def from_dict(cls, data):
        unlock_condition = data.get("unlockCondition") or {}
        description = (
            data.get("description")
            or data.get("overrideDescripton")
            or ""
        )

        return cls(
            unlock_phase=unlock_condition.get("phase", "PHASE_0"),
            unlock_level=int(unlock_condition.get("level", 1)),
            required_potential_rank=int(data.get("requiredPotentialRank", 0)),
            description=description,
            blackboard=tuple(
                TraitBlackboardItem.from_dict(item)
                for item in data.get("blackboard", [])
            ),
            prefab_key=data.get("prefabKey"),
            range_id=data.get("rangeId"),
        )

    def get_blackboard_value(self, key, default=None):
        for item in self.blackboard:
            if item.key == key:
                return item.value

        return default


@dataclass(frozen=True)
class Trait:
    candidates: tuple[TraitCandidate, ...] = field(default_factory=tuple)

    @classmethod
    def from_dict(cls, data):
        if not data:
            return None

        return cls(
            candidates=tuple(
                TraitCandidate.from_dict(candidate)
                for candidate in data.get("candidates", [])
            )
        )
