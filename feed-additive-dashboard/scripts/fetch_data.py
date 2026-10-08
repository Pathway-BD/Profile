#!/usr/bin/env python3
"""관세청 품목별 국가별 수출입실적(nitemtrade)에서 사료첨가제(HSK 2309.90-30) 수출 데이터를 받아
data/feed_additive.json 으로 저장합니다. (Python 기본 라이브러리만 사용)

인증키는 환경변수 DATA_GO_KR_KEY 로 받습니다(공공데이터포털 '일반 인증키(Encoding)' 값 그대로).
GitHub Actions 에서는 저장소 Secret 으로 넣어 두면 됩니다. 코드/저장소에 키를 적지 마세요.
"""
import json, os, sys, time
import urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

KEY = os.environ.get("DATA_GO_KR_KEY", "").strip()
BASE = os.environ.get("CUSTOMS_BASE", "https://apis.data.go.kr/1220000")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "feed_additive.json")
QUERY = "230990"            # 6자리로 조회하면 10자리 세부코드 행이 옴
KEEP_PREFIX = "23099030"    # 관세율표상 '사료첨가제'
MONTHS_BACK = 36            # 화면에서 최근 24개월 + 전년 비교용 12개월


def add_month(y, m, k):
    m += k
    while m < 1: m += 12; y -= 1
    while m > 12: m -= 12; y += 1
    return y, m


def fetch(start, end):
    url = f"{BASE}/nitemtrade/getNitemtradeList?serviceKey={KEY}&" + urllib.parse.urlencode(
        {"strtYymm": start, "endYymm": end, "hsSgn": QUERY})
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=180) as r:
                text = r.read().decode("utf-8", "replace")
            root = ET.fromstring(text)
            code = (root.findtext(".//resultCode") or root.findtext(".//returnReasonCode") or "").strip()
            if code not in ("00", "0"):
                msg = (root.findtext(".//resultMsg") or root.findtext(".//returnAuthMsg") or text[:300]).strip()
                raise RuntimeError(f"API 오류 {code}: {msg}")
            return root
        except Exception as e:  # 일시 오류는 재시도
            last = e
            time.sleep(5 * (attempt + 1))
    raise last


def main():
    if not KEY:
        sys.exit("환경변수 DATA_GO_KR_KEY 가 없습니다.")
    kst = datetime.now(timezone(timedelta(hours=9)))
    end = add_month(kst.year, kst.month, -1)                 # 지난달까지 요청 (미집계 월은 그냥 비어서 옴)
    start = add_month(*end, -(MONTHS_BACK - 1))
    rows, cur = [], start
    while cur <= end:
        w_end = min(add_month(*cur, 11), end)
        s, e = f"{cur[0]}{cur[1]:02d}", f"{w_end[0]}{w_end[1]:02d}"
        print(f"조회 {s} ~ {e}")
        root = fetch(s, e)
        for it in root.iter("item"):
            hs = (it.findtext("hsCd") or "").strip()
            c = (it.findtext("statCd") or "").strip()
            p = (it.findtext("year") or "").strip()
            if not hs.startswith(KEEP_PREFIX) or not c or c == "-" or "." not in p:
                continue
            ed = int(float((it.findtext("expDlr") or "0").replace(",", "") or 0))
            ew = int(float((it.findtext("expWgt") or "0").replace(",", "") or 0))
            if ed > 0:
                rows.append([p, c, hs, ed, ew])
        cur = add_month(*w_end, 1)
    if not rows:
        sys.exit("받은 데이터가 없습니다. 기존 파일을 유지합니다.")
    rows.sort()
    latest = max(r[0] for r in rows)
    data = {"updated": kst.strftime("%Y-%m-%d %H:%M KST"), "latest": latest,
            "source": "관세청 품목별 국가별 수출입실적 (공공데이터포털 15100475)",
            "hs": "2309.90-30 사료첨가제", "fields": ["month", "country", "hs10", "usd", "kg"], "rows": rows}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"저장 완료: {len(rows):,}행, 최신 {latest} → {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
