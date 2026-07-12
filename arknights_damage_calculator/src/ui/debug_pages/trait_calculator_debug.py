from dataclasses import asdict
from pathlib import Path

try:
    from src.services.operator_loader import filter_playable_operators, load_operators
    from src.services.trait_calculator import (
        is_trait_candidate_unlocked,
        phase_to_number,
        select_operator_trait_candidate,
        select_trait_candidate,
    )
except ModuleNotFoundError:
    from services.operator_loader import filter_playable_operators, load_operators
    from services.trait_calculator import (
        is_trait_candidate_unlocked,
        phase_to_number,
        select_operator_trait_candidate,
        select_trait_candidate,
    )


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "operators.json"


def _render_candidate(st, candidate):
    if candidate is None:
        st.warning("該当する TraitCandidate はありません。")
        return

    st.success("TraitCandidate を取得しました。")
    st.json(asdict(candidate))

    if candidate.blackboard:
        st.subheader("blackboard")
        st.table(
            [
                {
                    "key": item.key,
                    "value": item.value,
                    "value_str": item.value_str,
                }
                for item in candidate.blackboard
            ]
        )


def _select_operator(st, operators):
    default_index = next(
        (
            index
            for index, operator in enumerate(operators)
            if operator.trait is not None and operator.trait.candidates
        ),
        0,
    )

    return st.selectbox(
        "オペレーター",
        operators,
        index=default_index,
        format_func=lambda operator: (
            f"{operator.name} ({len(operator.trait.candidates)} candidates)"
            if operator.trait is not None
            else f"{operator.name} (traitなし)"
        ),
    )


def render_trait_calculator_debug_page():
    import streamlit as st

    st.title("Trait Calculator Debug")
    st.caption("trait_calculator.py の各関数を選んで確認するページ")

    target = st.selectbox(
        "テストする関数",
        [
            "select_operator_trait_candidate",
            "select_trait_candidate",
            "is_trait_candidate_unlocked",
            "phase_to_number",
        ],
    )

    st.subheader("入力")

    phase = st.selectbox("phase", ["PHASE_0", "PHASE_1", "PHASE_2"])

    if target == "phase_to_number":
        try:
            result = phase_to_number(phase)
        except (TypeError, ValueError) as error:
            st.error(str(error))
            return

        st.subheader("結果")
        st.write({"phase": phase, "phase_number": result})
        return

    data_path = st.text_input("operators.json path", value=str(DATA_PATH))

    try:
        operators = filter_playable_operators(load_operators(data_path))
    except Exception as error:
        st.error(f"operators.json の読み込みに失敗しました: {error}")
        return

    if not operators:
        st.warning("表示できるオペレーターがいません。")
        return

    operator = _select_operator(st, operators)
    level = st.number_input("level", min_value=1, max_value=90, value=1, step=1)
    potential_rank = st.number_input(
        "potential_rank",
        min_value=0,
        max_value=5,
        value=0,
        step=1,
    )

    st.write(
        {
            "operator_id": operator.id,
            "operator_name": operator.name,
            "trait": operator.trait is not None,
            "candidate_count": (
                len(operator.trait.candidates)
                if operator.trait is not None
                else 0
            ),
        }
    )

    try:
        if target == "select_operator_trait_candidate":
            result = select_operator_trait_candidate(
                operator,
                phase=phase,
                level=level,
                potential_rank=potential_rank,
            )
            st.subheader("結果")
            _render_candidate(st, result)
            return

        if target == "select_trait_candidate":
            result = select_trait_candidate(
                operator.trait,
                phase=phase,
                level=level,
                potential_rank=potential_rank,
            )
            st.subheader("結果")
            _render_candidate(st, result)
            return

        if operator.trait is None or not operator.trait.candidates:
            st.warning("判定できる TraitCandidate がありません。")
            return

        candidate_index = st.selectbox(
            "candidate",
            range(len(operator.trait.candidates)),
            format_func=lambda index: (
                f"candidate {index + 1}: "
                f"{operator.trait.candidates[index].unlock_phase} "
                f"Lv.{operator.trait.candidates[index].unlock_level}"
            ),
        )
        candidate = operator.trait.candidates[candidate_index]
        result = is_trait_candidate_unlocked(
            candidate,
            phase=phase,
            level=level,
            potential_rank=potential_rank,
        )
    except (TypeError, ValueError) as error:
        st.error(str(error))
        return

    st.subheader("結果")
    st.write(
        {
            "unlocked": result,
            "candidate": asdict(candidate),
        }
    )


def render_debug_trait_calculator_page():
    render_trait_calculator_debug_page()
