from __future__ import annotations

from typing import TYPE_CHECKING

from src.models.trait import Trait, TraitCandidate

if TYPE_CHECKING:
    from src.models.operator import Operator


PHASE_PREFIX = "PHASE_"


def phase_to_number(phase: str | int) -> int:
    """昇進段階を比較用の整数へ変換する。"""
    if isinstance(phase, bool):
        raise TypeError("phase must be a str or int")

    if isinstance(phase, int):
        if phase < 0:
            raise ValueError("phase must be 0 or greater")
        return phase

    if not isinstance(phase, str):
        raise TypeError("phase must be a str or int")

    if not phase.startswith(PHASE_PREFIX):
        raise ValueError(f"Unknown phase: {phase}")

    phase_number = phase.removeprefix(PHASE_PREFIX)

    if not phase_number.isdigit():
        raise ValueError(f"Unknown phase: {phase}")

    return int(phase_number)


def is_trait_candidate_unlocked(
    candidate: TraitCandidate,
    phase: str | int,
    level: int,
    potential_rank: int = 0,
) -> bool:
    """現在の育成状態で特性候補が解放されているか判定する。"""
    if level < 1:
        raise ValueError("level must be 1 or greater")

    if potential_rank < 0:
        raise ValueError("potential_rank must be 0 or greater")

    current_phase = phase_to_number(phase)
    required_phase = phase_to_number(candidate.unlock_phase)

    if potential_rank < candidate.required_potential_rank:
        return False

    if current_phase > required_phase:
        return True

    if current_phase < required_phase:
        return False

    return level >= candidate.unlock_level


def select_trait_candidate(
    trait: Trait | None,
    phase: str | int,
    level: int,
    potential_rank: int = 0,
) -> TraitCandidate | None:
    """解放済みの候補のうち、データ上で最後の候補を返す。"""
    if trait is None:
        return None

    unlocked_candidates = [
        candidate
        for candidate in trait.candidates
        if is_trait_candidate_unlocked(
            candidate,
            phase=phase,
            level=level,
            potential_rank=potential_rank,
        )
    ]

    if not unlocked_candidates:
        return None

    return unlocked_candidates[-1]


def select_operator_trait_candidate(
    operator: Operator,
    phase: str | int,
    level: int,
    potential_rank: int = 0,
) -> TraitCandidate | None:
    """Operatorから現在有効な特性候補を取得する。"""
    return select_trait_candidate(
        operator.trait,
        phase=phase,
        level=level,
        potential_rank=potential_rank,
    )
