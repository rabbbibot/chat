# 치지직 채팅 오버레이 (Chzzk Chat Overlay)

로그인 없이 **치지직 채팅/방송 URL**만 입력하면 OBS 브라우저 소스로 바로 쓸 수 있는
커스텀 채팅 오버레이 링크를 만들어주는 정적 웹 도구입니다.

- 로그인 불필요 — `https://chzzk.naver.com/chat/{채널ID}`, `https://chzzk.naver.com/live/{채널ID}`,
  `https://m.chzzk.naver.com/{채널ID}`, 또는 32자리 채널 ID를 그대로 입력해도 인식합니다.
- 10가지 채팅 말풍선 테마(파스텔/네온/동양풍/XP/마법소녀/해킹/동물/포켓몬/마인크래프트/심플)
- 실시간 미리보기 화면에서 배경판/채팅창 사이즈/말풍선/아이콘/닉네임/텍스트 테두리 등을 세밀하게 조절
- 스타일 조합을 5개 슬롯(프리셋)에 저장해두고 언제든 다시 불러오기
- 생성된 오버레이 링크 하나만 OBS 브라우저 소스에 넣으면 끝

## 사용 방법

1. `index.html`을 웹 서버(정적 호스팅, GitHub Pages, Vercel, Netlify 등)에 올립니다.
   - `file://`로 직접 열면 치지직 API 프록시가 동작하지 않으므로 반드시 `http(s)://`로 서비스해야 합니다.
2. 브라우저에서 `index.html`을 열고 상단 **"채팅 연결"** 패널에 치지직 채팅/방송 URL을 입력한 뒤 **연결**을 누릅니다.
3. 테마와 스타일을 원하는 대로 조절합니다 — 왼쪽 미리보기에 바로 반영됩니다.
4. 하단 **URL** 패널에서 **URL 복사**를 눌러 생성된 링크를 OBS **브라우저 소스**의 URL로 등록합니다. (권장: 너비 640 / 높이 1000)

설정값은 링크의 해시(`#s=...`)에 인코딩되어 있어서 별도 로그인이나 서버 저장 없이도
그 링크 하나만 있으면 항상 같은 스타일로 재현됩니다.

## 폴더 구조

```
index.html          설정 화면 (채팅 URL 입력 + 스타일 편집 + 프리셋 + OBS 링크 생성)
overlay.html         OBS에 넣는 실제 채팅 오버레이 페이지
js/
  channel-settings.js         치지직 URL/채널ID 파싱, 로컬 저장
  channel-url-panel.js        index.html의 "채팅 연결" 입력 패널
  chzzk-config.js             치지직 API 호출 + CORS 프록시 처리
  chzzk-live-status.js        방송 상태 조회, 채팅 채널 ID 확인
  bangsong-channel-storage.js 채널별 로컬 저장소 유틸
  bangsong-dialog.js          확인/알림 모달
  overlay.js                  채팅 웹소켓 연결 및 렌더링 로직
css/
  chat-bubble.css       말풍선 테마 스타일
  channel-settings.css  채팅 연결 패널 스타일
  bangsong-dialog.css   확인/알림 모달 스타일
assets/*.js             일부 테마(마법소녀/동물) 전용 색상 변수, 색상 프리셋 목록
fonts/                  테마에서 쓰는 웹폰트
```

## CORS 프록시에 대해

치지직 API는 브라우저에서 바로 호출하면 CORS 및 해외 IP 차단(9004) 문제가 있어
`js/chzzk-config.js`, `js/chzzk-live-status.js`에 기본 프록시로 Cloudflare Worker
(`https://muddy-dew-207b.sarahhha96.workers.dev/?url=`)를 사용합니다.

장기간 안정적으로 쓰려면 본인 소유의 Cloudflare Worker(또는 동일한 역할을 하는 프록시)로
교체하는 것을 권장합니다. 두 파일의 `DEFAULT_PROXIES` 배열 값만 바꾸면 됩니다.

## 폰트 라이선스 안내

`fonts/` 폴더에는 여러 무료 배포 한글 폰트가 포함되어 있습니다. 공개 저장소로
배포하기 전에 각 폰트의 라이선스(상업적 이용, 재배포 조건 등)를 다시 한 번 확인하는 것을
권장합니다.
