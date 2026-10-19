import React from "react";
import { Icon } from "../../design-systems/index.js";
import { COUPON, COUPON_CHANGE, couponState, openCoupon, issueCoupon } from "../boot/CouponFlow.jsx";

/* 축제 상세의 쿠폰 칸 (2026-10-19, 사용자 요청 — 지도 앱의 가게 쿠폰 칸처럼 화면에 잘 보이게).
 * 종전에는 축제 QR 로 들어오면 셸 위에 쿠폰 **팝업**이 덮였고 제목 오른쪽에 [쿠폰] 단추가 있었다. 둘 다 없애고
 * 상세 본문에 회색 바탕의 「쿠폰」 칸을 둔다 — 흰 카드 하나: 초록 윗줄(언제까지) · 쿠폰 이름 + 혜택 · 오른쪽 받기 아이콘.
 *
 *   받기 전    [쿠폰 받기 ⤓]   누르면 발급만 된다 — 칸이 「받음」으로 바뀐다
 *   받은 뒤    [사용하기]       누르면 바텀시트(쿠폰 설명 + 「쿠폰 사용하기」) → 직원 확인 화면 → 확인 팝업 → 완료 화면
 *   쓴 뒤      [사용 완료]     회색. 누르면 완료 화면(현재 시각 · 사용 일시)
 *
 * 상태는 `CouponFlow` 의 localStorage 가 진실이고, 바뀔 때마다 울리는 COUPON_CHANGE 로 다시 읽는다. 쿠폰이 걸린
 * 축제(`COUPON.festivalId`)에서만 그린다 — 호출하는 쪽(FestivalDetail)이 가른다. */
export function CouponCard() {
  const [st, setSt] = React.useState(couponState);
  React.useEffect(() => {
    const h = () => setSt(couponState());
    window.addEventListener(COUPON_CHANGE, h);
    return () => window.removeEventListener(COUPON_CHANGE, h);
  }, []);
  const used = st === "used";
  const label = used ? "사용 완료" : st === "issued" ? "사용하기" : "쿠폰 받기";
  /* 받기 전 → 받음(칸의 ⤓) → 받은 칸을 누르면 사용 바텀시트 → 사용 완료 */
  const onTap = st === "none" ? issueCoupon : openCoupon;

  return (
    <section aria-label="쿠폰" style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-card)",
      padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <h3 style={{ font: "var(--type-title-3)", color: "var(--text-heading)" }}>쿠폰</h3>
      <button type="button" onClick={onTap} aria-label={`${COUPON.name} ${COUPON.benefit} — ${label}`}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "var(--space-3)", textAlign: "left",
          padding: "var(--space-3)", background: "var(--surface-card)", cursor: "pointer",
          border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
        <span style={{ flex: "0 0 auto", width: 44, height: 44, display: "inline-flex", alignItems: "center",
          justifyContent: "center", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)",
          color: used ? "var(--text-muted)" : "var(--brand-primary)" }}>
          <Icon name="ticket" size={24} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ font: "var(--type-caption)", fontWeight: "var(--fw-semibold)",
            color: used ? "var(--text-muted)" : "var(--yong-green-700)" }}>{COUPON.eyebrow}</span>
          <span style={{ font: "var(--type-label)", fontWeight: "var(--fw-bold)",
            color: used ? "var(--text-muted)" : "var(--text-heading)", wordBreak: "keep-all" }}>
            {COUPON.name} · {COUPON.benefit}
          </span>
          <span style={{ font: "var(--type-caption)", color: "var(--text-muted)", wordBreak: "keep-all" }}>{COUPON.summary}</span>
        </span>
        <span style={{ flex: "0 0 auto", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2,
          font: "var(--type-caption)", color: used ? "var(--text-muted)" : "var(--text-body)" }}>
          <Icon name={used ? "circle-check" : st === "issued" ? "chevron-right" : "download"} size={22} />
          <span style={{ whiteSpace: "nowrap" }}>{label}</span>
        </span>
      </button>
    </section>
  );
}

export default CouponCard;
