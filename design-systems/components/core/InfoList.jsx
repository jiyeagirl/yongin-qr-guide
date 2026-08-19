import React from "react";
import { VisuallyHidden } from "./VisuallyHidden.jsx";

/* 라벨–값 정보 표. 상세 화면에서 "설치 위치 / 운영시간 / 최대 수용 인원" 같은 항목을
   늘어놓는 자리다. S05 시설 상세가 처음 쓰고 S06 점포 상세와 S09 축제 상세가 같은 것을 쓴다.

   ── 표(table)가 아니라 행 묶음인 이유 ──────────────────────────────────
   라벨 폭을 고정하면 "부가정보" 같은 네 글자와 "운영시간" 이 맞춰지는 대신,
   2차 글자 확대에서 값이 좁은 열에 갇혀 다섯 줄로 접힌다. 라벨을 값 위에 얹고
   각 행이 내용만큼 늘어나게 둔다 (U-CM-14 고정 높이 금지).

   ── 빈 값을 지우지 않고 "-" 로 남긴다 (2026-08-19) ─────────────────────
   예전에는 값이 없는 항목을 통째로 걸러냈다. 공공데이터를 그대로 쓰는 화면에서는
   그 편이 틀렸다 — **항목의 존재 자체가 정보**이기 때문이다.

   화장실 상세에 "비상벨 설치 여부" 줄이 없으면 읽는 사람은 두 가지를 구분할 수 없다:
   원천에 그 값이 없는 것인가, 우리가 빠뜨린 것인가. 그런데 이 서비스가 다루는 시설은
   비상벨·기저귀교환대처럼 **없다는 사실이 갈 곳을 바꾸는** 항목을 갖고 있다.
   "-" 는 "확인되지 않았다"를 말하고, 줄이 없는 것은 아무 말도 하지 않는다.

   같은 종류의 시설이라면 어느 곳을 열어도 항목 줄이 같다는 점도 중요하다. 항목이
   시설마다 나타났다 사라지면 두 곳을 견줄 때 무엇을 견주는지가 흔들린다.

   그래서 기본은 "-" 이고, 지우고 싶은 항목만 `omitEmpty: true` 를 준다 —
   자료마다 있고 없고가 갈리는 것이 아니라 **애초에 해당 없는** 항목에 쓴다.
   (입력 항목 정의서 3-1: 필수/선택 구분. 선택 항목은 미입력이 정상 상태다.) */

export const EMPTY_MARK = "-";

/* ── 있고 없고를 묻는 항목의 표기 (2026-08-19) ────────────────────────────────
 *
 * "비상벨 설치 여부 / 기저귀 교환대 / 입구 CCTV / 온누리상품권 가맹 여부" 처럼 답이 둘뿐인
 * 항목은 **○ · ×** 로 적는다. 정보표에서 이런 줄은 하나만 읽는 것이 아니라 여러 줄을 한꺼번에
 * 훑는 자리라, "있음/없음" 같은 낱말보다 부호가 눈에 먼저 들어온다.
 *
 * 알파벳 O·X 가 아니라 **○(U+25CB) · ×(U+00D7)** 다. O 는 숫자 0 과, X 는 곱셈·닫기 부호와
 * 섞인다. 한글 서식에서 가부를 적는 짝도 이 둘이다.
 *
 * ── 부호만으로 말하지 않는다 ─────────────────────────────────────────────
 * 스크린리더는 ○ 를 "동그라미", × 를 "곱하기"로 읽거나 아예 건너뛴다. 그래서 부호는
 * aria-hidden 으로 감추고 **낱말을 따로 들려준다.** 항목마다 알맞은 낱말이 다르므로
 * (설비는 "있음/없음", 가맹은 "가맹/미가맹") 호출부가 정한다.
 *
 * ── null 은 여기서 걸러 InfoList 로 넘긴다 ──────────────────────────────
 * **"없음"과 "확인되지 않음"은 다른 말이다.** 비상벨이 없는 화장실과 비상벨 정보가 없는
 * 화장실은 갈지 말지가 갈릴 수 있다. false 는 × 로 적고, null 일 때만 null 을 돌려주어
 * InfoList 의 "-" 로 흘려보낸다. */
export function yesNoMark(value, yes = "있음", no = "없음") {
  if (value == null) return null;
  return (
    <>
      <span aria-hidden="true">{value ? "○" : "×"}</span>
      <VisuallyHidden>{value ? yes : no}</VisuallyHidden>
    </>
  );
}

export function InfoList({ items = [], style, ...rest }) {
  const rows = items
    .filter(it => it)
    .filter(it => !(it.omitEmpty && isEmpty(it.value)));
  if (!rows.length) return null;

  return (
    <dl style={{ background: "var(--surface-card)", border: "var(--stroke-hairline) solid var(--border-default)",
      borderRadius: "var(--radius-card)", padding: "var(--space-2) var(--space-4)", ...style }} {...rest}>
      {rows.map((it, i) => {
        const empty = isEmpty(it.value);
        return (
          <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 2,
            minHeight: "var(--tap-comfortable)", justifyContent: "center", padding: "var(--space-3) 0",
            borderBottom: i < rows.length - 1 ? "var(--stroke-hairline) solid var(--border-default)" : "none" }}>
            {/* 라벨은 bold(600). semibold 는 2026-08-14 조정으로 medium 과 같은 500 이 되어
                본문(400)과 한 단계밖에 차이가 나지 않는데, 13px 회색에서 그 차이는 보이지 않는다.
                라벨과 값이 같은 굵기로 읽히면 어디까지가 항목명인지 훑어서 알 수 없다. */}
            <dt style={{ fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)", color: "var(--text-muted)",
              lineHeight: "var(--lh-caption)" }}>{it.label}</dt>
            {/* 빈 값은 흐린 색으로 둔다 — 옆 항목의 실제 값과 같은 무게로 읽히면
                "-" 가 하나의 답처럼 보인다. 화면에는 부호 하나뿐이라 색만으로 뜻을
                전하는 셈이 되므로(U-CM-13), 읽어줄 때는 문장으로 들려준다. */}
            <dd style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-body)",
              color: empty ? "var(--text-muted)" : "var(--text-body)" }}>
              {empty
                ? <><span aria-hidden="true">{EMPTY_MARK}</span>
                    <VisuallyHidden>정보 없음</VisuallyHidden></>
                : it.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function isEmpty(v) {
  return v == null || v === "" || (Array.isArray(v) && !v.length);
}
