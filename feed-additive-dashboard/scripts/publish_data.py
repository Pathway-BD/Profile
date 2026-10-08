#!/usr/bin/env python3
"""data/feed_additive.json 을 GitHub API로 저장소에 올리고 Pages 배포를 다시 실행합니다.

git 이 없는 PC(self-hosted runner)에서도 돌도록 Python 기본 라이브러리만 씁니다.
Actions 가 넣어 주는 GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_REF_NAME 을 사용합니다.
"""
import base64, json, os, sys
import urllib.request, urllib.error

PATH = "feed-additive-dashboard/data/feed_additive.json"
LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "feed_additive.json")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = os.environ.get("GITHUB_REPOSITORY", "")
REF = os.environ.get("GITHUB_REF_NAME", "")
API = f"https://api.github.com/repos/{REPO}"


def call(method, url, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
                                          "User-Agent": "feed-additive-dashboard"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            text = r.read()
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        if e.code == 404 and method == "GET":
            return None
        sys.exit(f"GitHub API {method} 실패 {e.code}: {e.read().decode('utf-8', 'replace')[:300]}")


def main():
    if not (TOKEN and REPO and REF):
        sys.exit("GITHUB_TOKEN / GITHUB_REPOSITORY / GITHUB_REF_NAME 이 필요합니다 (Actions 안에서 실행).")
    with open(LOCAL, "rb") as f:
        data = f.read()
    cur = call("GET", f"{API}/contents/{PATH}?ref={REF}")
    if cur and cur.get("content") and base64.b64decode(cur["content"]) == data:
        print("변경 없음")
        return
    body = {"message": "data: 관세청 사료첨가제 수출 데이터 갱신", "branch": REF,
            "content": base64.b64encode(data).decode()}
    if cur:
        body["sha"] = cur["sha"]
    call("PUT", f"{API}/contents/{PATH}", body)
    print(f"업로드 완료: {PATH} ({len(data):,} bytes)")
    # GITHUB_TOKEN 으로 만든 커밋은 다른 워크플로를 깨우지 않으므로 Pages 배포를 직접 실행
    call("POST", f"{API}/actions/workflows/deploy-pages.yml/dispatches", {"ref": REF})
    print("Pages 재배포 요청 완료")


if __name__ == "__main__":
    main()
