import React from "react";
import { Icon } from "../../design-systems/index.js";
import { COUPON, COUPON_CHANGE, couponState, openCoupon, issueCoupon } from "../boot/CouponFlow.jsx";

/* 축제 상세의 쿠폰 칸 (2026-10-19, 사용자 요청 — 지도 앱의 가게 쿠폰 칸처럼 화면에 잘 보이게).
 * 종전에는 축제 QR 로 들어오면 셸 위에 쿠폰 **팝업**이 덮였고 제목 오른쪽에 [쿠폰] 단추가 있었다. 둘 다 없애고
 * 상세 본문에 회색 바탕의 「쿠폰」 칸을 둔다 — 흰 카드 하나: 초록 윗줄(언제까지) · 쿠폰 이름 + 혜택 · 오른쪽 받기 아이콘.
 *
 * 글자는 두 줄뿐이고 각각 한 줄이다(초록 윗줄 「축제 방문객을 위한 특별 혜택」 + 굵은 「1,000원 할인권」), 오른쪽은 화살표 하나(2026-10-19, 사용자 요청).
 *   받기 전    누르면 발급되고 곧장 바텀시트(쿠폰 설명 + 「쿠폰 사용하기」) → 직원 확인 화면 → 확인 팝업 → 완료 화면
 *   받은 뒤    같은 바텀시트
 *   쓴 뒤      회색 + 윗줄이 「사용 완료」. 누르면 완료 화면(현재 시각 · 사용 일시)
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
  const label = used ? "사용 완료" : st === "issued" ? "받은 쿠폰" : "쿠폰 받기";
  /* 받기 전에 누르면 발급하고 곧장 사용 바텀시트를 연다 — 우측은 화살표 하나뿐이라 단계를 글자로 나누지 않는다 */
  const onTap = () => { if (st === "none") issueCoupon(); openCoupon(); };

  return (
    <section aria-label="쿠폰" style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-card)",
      padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <h3 style={{ font: "var(--type-title-3)", color: "var(--text-heading)" }}>쿠폰</h3>
      <button type="button" onClick={onTap} aria-label={`${COUPON.name} ${COUPON.benefit} — ${label}`}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "var(--space-2)", textAlign: "left",
          padding: "var(--space-3)", background: "var(--surface-card)", cursor: "pointer",
          border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
        <span style={{ flex: "0 0 auto", width: 40, height: 40, display: "inline-flex", alignItems: "center",
          justifyContent: "center", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)",
          color: used ? "var(--text-muted)" : "var(--brand-primary)" }}>
          <Icon name="ticket" size={22} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ font: "var(--type-label)", whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", color: used ? "var(--text-muted)" : "var(--yong-green-700)" }}>
            {used ? "사용 완료" : COUPON.lead}
          </span>
          <span style={{ font: "var(--type-title-3)", whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", color: used ? "var(--text-muted)" : "var(--text-heading)" }}>{COUPON.voucher}</span>
        </span>
        <Icon name="chevron-right" size={22} color="var(--text-muted)" />
      </button>
    </section>
  );
}

export default CouponCard;
