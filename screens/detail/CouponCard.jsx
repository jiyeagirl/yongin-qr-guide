import React from "react";
import { Icon, SectionHeader } from "../../design-systems/index.js";
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
const STUB = 64;    /* 왼쪽 조각(아이콘) 폭 — 절취선이 서는 자리(px) */
const NOTCH = 12;   /* 절취선 위아래 홈의 지름(px) */

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
    /* 회색 바깥 상자 — 안의 글자는 본문 왼쪽 선보다 **조금만 안쪽**에 선다 (2026-10-19, 사용자 요청). 열을 딱 맞추면(상자를 12px
       내밀었을 때) 너무 왼쪽으로 붙어 보였고, 상자를 본문 폭에 맞추면(안쪽 여백 16px) 너무 들어가 보였다. 그 사이로 상자를 4px 만
       내밀고 안쪽 여백을 12px 로 두어 글자는 본문 선에서 8px 안쪽에 선다 */
    <section aria-label="쿠폰" style={{ margin: "0 calc(-1 * var(--space-1))", padding: "var(--space-3)",
      background: "var(--surface-sunken)", borderRadius: "var(--radius-card)" }}>
      <SectionHeader title="쿠폰" />
      {/* 티켓 모양 (2026-10-19, 사용자 요청 — 눈에 띄게): 왼쪽 조각(아이콘)과 오른쪽 글자 사이에 점선 절취선, 그 위아래에
          반원으로 파인 홈. 홈은 바깥 회색 상자(`--surface-sunken`)와 같은 색의 반원이라 카드가 거기서 잘려 나간 것처럼 보인다. 오른쪽 끝의
          화살표는 초록 동그라미 안에 둔다(눌러볼 칸임을 알린다 — 글자는 두지 않는다). */}
      <button type="button" onClick={onTap} aria-label={`${COUPON.name} ${COUPON.benefit} — ${label}`}
        style={{ position: "relative", width: "100%", display: "flex", alignItems: "stretch", textAlign: "left", padding: 0,
          background: "var(--surface-card)", cursor: "pointer",
          border: "var(--stroke-hairline) solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
        <span style={{ flex: "0 0 auto", width: STUB, display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: used ? "var(--text-muted)" : "var(--brand-primary)" }}>
          <Icon name="ticket" size={26} />
        </span>
        {/* 절취선과 홈 */}
        <span aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, left: STUB, width: 0,
          borderLeft: "1.5px dashed var(--border-strong)" }} />
        <span aria-hidden="true" style={{ position: "absolute", top: -1, left: STUB - NOTCH / 2, width: NOTCH, height: NOTCH / 2,
          borderRadius: `0 0 ${NOTCH / 2}px ${NOTCH / 2}px`, background: "var(--surface-sunken)",
          border: "var(--stroke-hairline) solid var(--border-default)", borderTop: "none", boxSizing: "border-box" }} />
        <span aria-hidden="true" style={{ position: "absolute", bottom: -1, left: STUB - NOTCH / 2, width: NOTCH, height: NOTCH / 2,
          borderRadius: `${NOTCH / 2}px ${NOTCH / 2}px 0 0`, background: "var(--surface-sunken)",
          border: "var(--stroke-hairline) solid var(--border-default)", borderBottom: "none", boxSizing: "border-box" }} />
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2,
          padding: "var(--space-3) var(--space-2) var(--space-3) var(--space-4)", justifyContent: "center" }}>
          <span style={{ font: "var(--type-label)", whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", color: used ? "var(--text-muted)" : "var(--yong-green-700)" }}>
            {used ? "사용 완료" : COUPON.lead}
          </span>
          <span style={{ font: "var(--type-title-3)", whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", color: used ? "var(--text-muted)" : "var(--text-heading)" }}>{COUPON.voucher}</span>
        </span>
        <span aria-hidden="true" style={{ flex: "0 0 auto", alignSelf: "center", marginRight: "var(--space-3)", width: 28, height: 28,
          borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: used ? "var(--border-strong)" : "var(--brand-primary)", color: "var(--text-on-brand)" }}>
          <Icon name="chevron-right" size={18} />
        </span>
      </button>
    </section>
  );
}

export default CouponCard;
