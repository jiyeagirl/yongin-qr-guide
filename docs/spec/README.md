# 현재 상태 명세서 (코드 기준)

**코드가 기준이다.** 이 폴더는 2026-10-19 시점 코드를 읽고 쓴 「지금 이렇게 동작한다」만 담는다.
변경 이력은 `/CHANGELOG.md`, 옛 명세서는 `docs/archive/`, 문서와 코드가 어긋난 곳은 `DISCREPANCIES.md`.
방향(무엇을 만들기로 했는가)은 `docs/direction_v2_rules.md` 가 우선한다. 「미정」은 임의로 정하지 않는다.

## 시민용 모바일 웹
| 문서 | 내용 |
|---|---|
| citizen-entry-qr.md | 진입 분기(App.jsx), QR 지점 표, 상점·축제·쿠폰 흐름, S11 계열, 코치마크, 검수 플래그 |
| citizen-district-tab.md | 상점가 탭: 홈형 시트, S15 가게 전체보기, S13·S13-A, 필터·정렬 |
| citizen-facility-tab.md | 공공시설 탭: 목록·반경·안전 안내 |
| citizen-discover-festival.md | 둘러보기 탭, 축제 목록·상세, 코스, S14 |
| citizen-detail-route-report.md | 해시 라우터 오버레이, 상점·시설 상세, 도보 길찾기, 오류신고 |
| citizen-map-overlay.md | 지도 레이어, 바텀시트 스냅, 패딩, 지도 인스턴스 유지 |
| data-and-policy.md | 더미 데이터, 업종 칩 매핑, 구역·온누리 판정, 공통 UI 정책 |

## 관리자 웹
| 문서 | 내용 |
|---|---|
| admin-overview.md | 화면 목록, 계정, 공통 정책, 검증 규칙 V-01~V-07, 범위 |
| admin-districts-stores.md | 상점가 · 점포 · 엑셀 일괄 등록 |
| admin-festivals-courses.md | 축제 · 프로그램 · 부스 · 코스 · 슬롯 3종 |
| admin-facilities-qr-reports.md | 공공시설 · QR 지점 · 오류신고 · 대시보드 |

## 갱신 규칙
화면을 바꾸면 해당 문서를 같은 커밋에서 고친다. 서술에는 이력을 쓰지 않는다(이력은 CHANGELOG).
