이 폴더(사료첨가제 수출 대시보드)를 내 GitHub 계정에 새 공개 저장소로 올리고 GitHub Pages로 배포해줘.

조건
- 저장소 이름: feed-additive-dashboard (이미 있으면 알려주고 멈춰)
- 공개(public) 저장소, 기본 브랜치 main
- 폴더 안 파일 구조와 내용은 그대로 올려. 코드 수정하지 마.
- 인증키는 절대 파일·커밋·명령어 기록에 넣지 마. 

진행 순서
1. `gh auth status`로 로그인 확인. 안 되어 있으면 `gh auth login` 안내하고 멈춰.
2. git 초기화 → 첫 커밋 → `gh repo create`로 저장소 만들고 push.
3. Actions Secret `DATA_GO_KR_KEY` 등록이 필요해. 
   내가 직접 등록할 테니 등록할 웹 주소(저장소 Settings → Secrets and variables → Actions)를 알려주고, 
   내가 "등록했어"라고 할 때까지 기다려.
4. `gh workflow run "Update customs data"` 실행 → `gh run watch`로 끝날 때까지 확인.
   - 실패하면 로그에서 원인을 요약해줘. data.go.kr 접속 차단(해외 IP)이면 README의
     "Actions에서 관세청 API 접속이 안 될 때" 방법(내 PC에서 실행 후 push)으로 진행하자고 말해줘.
5. 성공하면 GitHub Pages를 main 브랜치 / (root) 로 켜줘 (`gh api`로 설정).
6. 배포가 끝나면 최종 주소(https://<사용자명>.github.io/feed-additive-dashboard/)를 알려줘.
