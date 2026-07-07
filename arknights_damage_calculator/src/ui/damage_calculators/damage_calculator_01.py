try:
    from src.services.damage_calculator import (
        EnemyStats,
        calculate_attack_timeline,
        calculate_damage_by_type,
    )
    from src.services.operator_loader import filter_playable_operators, load_operators
    from src.ui.operator_selector import (
        get_operator_damage_type,
        render_operator_selector,
        render_operator_summary,
    )
except ModuleNotFoundError:
    from services.damage_calculator import (
        EnemyStats,
        calculate_attack_timeline,
        calculate_damage_by_type,
    )
    from services.operator_loader import filter_playable_operators, load_operators
    from ui.operator_selector import (
        get_operator_damage_type,
        render_operator_selector,
        render_operator_summary,
    )


def render_damage_calculator_01(data_path):
    import pandas as pd
    import streamlit as st

    st.title("Damage Calculator 01")
    st.caption("ver1.0 用の通常攻撃ダメージ計算機")

    try:
        operators = filter_playable_operators(load_operators(data_path))
    except Exception as error:
        st.error(f"operators.json の読み込みに失敗しました: {error}")
        return

    selected_operator = render_operator_selector(
        operators,
        label="オペレーターを選択",
        key="damage_calculator_01_operator",
    )

    if selected_operator is None:
        return

    st.subheader("オペレーター情報")
    render_operator_summary(selected_operator)

    st.subheader("ダメージ条件")
    damage_type = get_operator_damage_type(selected_operator)
    st.write({"ダメージ種別": damage_type})

    if damage_type not in {"physical", "arts"}:
        st.error(f"未対応のダメージ種別です: {damage_type}")
        return

    enemy_def = st.number_input(
        "敵防御力",
        min_value=0,
        value=300,
        step=1,
        key="damage_calculator_01_enemy_def",
    )
    enemy_res = st.number_input(
        "敵術耐性",
        min_value=0,
        max_value=100,
        value=20,
        step=1,
        key="damage_calculator_01_enemy_res",
    )

    enemy = EnemyStats(defense=enemy_def, resistance=enemy_res)
    damage = calculate_damage_by_type(selected_operator.stats.atk, damage_type, enemy)

    st.subheader("通常攻撃ダメージ")
    duration_seconds = st.number_input(
        "表示時間（秒）",
        min_value=1.0,
        value=30.0,
        step=1.0,
        key="damage_calculator_01_duration_seconds",
    )
    attack_interval_seconds = st.number_input(
        "攻撃間隔（秒）",
        min_value=0.1,
        value=1.0,
        step=0.1,
        key="damage_calculator_01_attack_interval_seconds",
    )
    st.caption("この画面では、最初のダメージは攻撃間隔が1回経過した時点で発生するものとして扱います。")

    timeline = calculate_attack_timeline(
        damage,
        duration_seconds,
        attack_interval_seconds,
    )

    if not timeline:
        st.info("指定時間内に攻撃が発生しません。")
    else:
        timeline_df = pd.DataFrame(timeline)
        damage_column, attack_count_column, total_damage_column = st.columns(3)

        with damage_column:
            st.metric("1回あたりのダメージ", damage)
        with attack_count_column:
            st.metric("攻撃回数", len(timeline_df))
        with total_damage_column:
            st.metric("合計ダメージ", int(timeline_df["cumulative_damage"].iloc[-1]))

        st.caption("攻撃間隔ごとのダメージ")
        st.bar_chart(timeline_df, x="time", y="damage")

        st.caption("累積ダメージ")
        st.line_chart(timeline_df, x="time", y="cumulative_damage")

    st.subheader("使用する式")
    if damage_type == "physical":
        st.code(
            "物理ダメージ = max(攻撃力 - 敵防御力, 攻撃力 * 0.05)",
            language="text",
        )
    else:
        st.code(
            "術ダメージ = 攻撃力 * max(100 - 敵術耐性, 5) / 100",
            language="text",
        )
