# 하루 한 칸

Vite + React로 만든 할 일 앱입니다. 할 일을 불러오고, 추가·수정·완료 처리·삭제할 수 있습니다.

## 실행

PowerShell 터미널에서 프로젝트 폴더로 이동한 뒤 실행합니다.

```powershell
npm.cmd run dev
```

브라우저에서 Vite가 출력한 주소(기본값 `http://localhost:5173`)를 엽니다. JSX는 Vite가 변환하므로 Live Server로 `index.html`을 직접 열지 마세요.

## 백엔드

백엔드 주소는 프로젝트 루트의 `.env` 파일에 `VITE_API_URL`로 설정합니다.
백엔드에서 브라우저 요청을 위한 CORS를 허용해야 합니다. 환경변수를 바꾼 뒤에는 Vite 개발 서버를 재시작하세요.

## 검사

```powershell
npm.cmd run build
npm.cmd run lint
```
