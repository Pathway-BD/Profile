# 사료첨가제 수출 현황 대시보드 (HS 2309.90-30)

관세청 공공데이터(품목별 국가별 수출입실적)에서 한국의 **사료첨가제(HSK 2309.90-30)** 수출을 받아
국가·지역·세부 품목·월별로 보여주는 정적 웹페이지입니다.

## 구조
| 파일 | 역할 |
|---|---|
| `index.html` | 개요(홈) 화면 — 이번 달 요약·인기 국가·지역 비중·신규/이탈 시장 |
| `dashboard.html` | 상세 대시보드 (주소 `#scope=mine`, `#c=BD`, `#per=m:202608` 등으로 바로 열기) |
| `scenario.html` | 단일 제품으로 보이는 건의 제품 유형 추정 |
| `trends.html` | 추정 첨가제 유형별 월별 물량·단가·주요 국가 |
| `common.js` | 화면들이 함께 쓰는 지역·담당시장·품목명·숫자 형식 |
| `estimate.js` | 단가로 첨가제 유형을 추정하는 공용 로직 (단가대 기준표 포함) |
| `chart.umd.js` | 차트 라이브러리 (Chart.js 4.4.1) |
| `codes.json` | 국가코드 → 한글 국가명 |
| `data/feed_additive.json` | 수출 데이터 (Actions가 자동 생성·갱신) |
| `scripts/fetch_data.py` | 관세청 API 호출 → 데이터 파일 저장 |
| `.github/workflows/update-data.yml` | 매월 16~20일 자동 갱신 + 수동 실행 |

## 인증키
- 공공데이터포털 인증키는 **저장소에 넣지 않고** `Settings → Secrets and variables → Actions` 에
  `DATA_GO_KR_KEY` 이름으로 등록합니다 (일반 인증키 Encoding 값 그대로).
- 필요한 API 활용신청: 관세청_품목별 국가별 수출입실적(GW) — https://www.data.go.kr/data/15100475/openapi.do

## 처음 설정
1. Secret `DATA_GO_KR_KEY` 등록
2. `Actions → Update customs data → Run workflow` 실행 → `data/feed_additive.json` 생성
3. `Settings → Pages → Deploy from a branch → main / (root)`
4. `https://<사용자명>.github.io/<저장소명>/` 접속

## Actions에서 관세청 API 접속이 안 될 때
GitHub 서버(해외)에서 data.go.kr 접속이 막히는 경우, 내 PC에서 직접 갱신 후 올립니다.
```
set DATA_GO_KR_KEY=인증키        (Mac: export DATA_GO_KR_KEY=인증키)
python scripts/fetch_data.py
git add data/feed_additive.json && git commit -m "data update" && git push
```

## 참고
- 회사별 내역은 공개되지 않으며 한국 전체 합계입니다. 평균단가 = 금액 ÷ 중량(USD/kg).
- 같은 제품이라도 다른 HS코드로 신고되면 집계되지 않습니다.
