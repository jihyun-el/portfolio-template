# 콘텐츠 수정 안내

대부분의 내용은 `content/portfolio.json` 하나에서 수정한다. 에이전트에게 답을 정리해 이 파일을 바꿔 달라고 하면 된다. 없는 경력이나 성과는 추가하지 않는다.

## JSON 기본

- 글은 쌍따옴표 `" "`로 감싼다. 항목 사이는 쉼표, 마지막 항목 뒤에는 쉼표를 붙이지 않는다.
- 목록은 `[ ]`, 항목 묶음은 `{ }`다. 항목이 없으면 `[]`로 둔다.
- 글 안의 줄바꿈은 `\n`으로 적는다. 본문은 일반 글이며 HTML이나 Markdown으로 처리하지 않는다.
- `npm run check-content`로 잘못된 필드·주소·이미지 경로를 확인할 수 있다. 오류에 표시된 필드 이름을 에이전트에게 그대로 알려 주면 된다.

## 사이트와 소개

| 필드 | 용도 |
|---|---|
| `site.title` | 브라우저 탭 제목의 포트폴리오 부분 |
| `site.description` | 검색 결과 등에 쓰는 사이트 설명 |
| `site.example` | 샘플이면 `true`, 실제 내용으로 교체하면 `false` |
| `profile.name` | 공개할 이름 또는 별명 |
| `profile.role` | 희망 직무·관심 분야. 실제와 맞게 작성 |
| `profile.intro` | 소개 화면의 짧은 자기소개 |
| `profile.fields` | 이름 아래 관심 분야 목록 |
| `profile.links` | 공개할 연락처와 링크 |
| `profile.experiences` | 확인된 경험 목록. 없으면 `[]` |
| `profile.education` | 공개할 교육 목록. 없으면 `[]` |

링크 항목의 예:

```json
{ "label": "GitHub", "url": "https://github.com/YOUR-USERNAME" }
```

```json
{ "label": "Email", "url": "mailto:hello@example.com" }
```

예시 계정과 이메일을 그대로 넣지 않는다. 공개할 주소가 없으면 목록을 비워 둔다. 링크는 `https://` 또는 `mailto:`만 허용한다. 자격 증명과 임시 접근 토큰을 URL에 넣지 않는다.

경험·교육 한 항목의 형식:

```json
{ "title": "실제 경험 또는 교육 이름", "period": "실제 참여 기간", "description": "직접 한 일이나 교육 내용" }
```

## 프로젝트

`projects`에 항목을 추가하거나 삭제한다. 하나의 제품의 앱·서버·분석 등을 별개 프로젝트로 부풀리지 않는다. 해당 프로젝트의 `sections`에 나누어 적는다.

| 필드 | 용도와 규칙 |
|---|---|
| `id` | 상세 주소에 쓰는 고유 이름. 영문 소문자로 시작하고 소문자·숫자·하이픈만 사용. 다른 프로젝트와 중복 금지 |
| `name` | 왼쪽 목록과 상세 페이지의 프로젝트 이름 |
| `category` | 팀·개인·수업 등 실제 작업 성격 |
| `period` | 실제 진행 기간. 정확한 기간을 모르면 정직하게 표시하거나 확인 후 기재 |
| `role` | 본인이 직접 맡은 역할 |
| `title` | 큰 제목. 해결한 문제나 만든 기능을 간결하게 표현. 줄바꿈은 `\n` |
| `accent` | 제목에서 강조할 실제 단어. 강조가 없으면 `""` |
| `summary` | 누구의 어떤 문제를 어떻게 풀었는지 한두 문장 |
| `stack` | 직접 사용한 기술 이름의 목록 |
| `links` | 공개 저장소·시연·문서 링크. 없으면 `[]` |
| `image` | 이미지가 없으면 `""`. 있으면 `/images/my-project.png` 형식 |
| `imageAlt` | 이미지 설명. 이미지가 있으면 필수 |
| `art` | `orbit`, `layers`, `flow`, `none` 중 하나 |
| `artLabels` | 장식 주변의 짧은 라벨 3개. 근거 없는 성능 수치를 넣지 않음 |
| `sections` | 만든 과정. `{ "title": "제목", "body": "내용" }`의 목록 |

이미지를 쓰려면 파일을 `public/images/` 안에 넣고 `/images/파일명.png`로 참조한다. 파일 이름은 영문·숫자·하이픈·밑줄을 사용한다. 하위 폴더도 허용한다. png, jpg, jpeg, webp, gif, svg를 지원한다. 이미지가 있으면 추상 그림 대신 표시한다. 외부 파일은 공개 권한과 출처를 확인한다.

## 기술과 글

`skills`에는 숙련도 퍼센트 대신 구체적인 쓰임을 적는다. 예시 형식:

```json
{ "name": "기술 이름", "usage": "이 기술을 실제로 어느 기능에 어떻게 사용했는지" }
```

`writing`은 공개된 글의 링크 목록이다. 외부 HTTPS 글 주소를 사용한다. 형식:

```json
{ "title": "글 제목", "summary": "어떤 문제와 해결 과정을 다룬 글인지", "url": "https://example.com/my-post" }
```

등록한 기술이나 글이 없으면 `[]`로 둔다. 사이트는 빈 목록도 처리한다.

## 경로를 붙여 로컬 검증하기

GitHub Pages는 보통 `/저장소이름/` 아래에 열린다. 워크플로가 이 경로를 자동으로 잡는다. 로컬에서도 같은 경로를 확인하려면 다음처럼 한다.

PowerShell:

```powershell
$env:PAGES_BASE_PATH = '/my-portfolio'
npm run build
npm run check-types
npm run preview
```

macOS / Linux:

```sh
PAGES_BASE_PATH=/my-portfolio npm run build
npm run check-types
PAGES_BASE_PATH=/my-portfolio npm run preview
```

`http://127.0.0.1:4173/my-portfolio/`에서 확인한다. PowerShell에서 루트 주소 빌드로 돌아가려면 `Remove-Item Env:PAGES_BASE_PATH`를 실행한다. 새 환경 변수 값으로 경로를 바꾸었다면 다시 빌드한다.

내용 변경 뒤 기본 검증은 `npm test`, `npm run build`, `npm run check-types`다. 프레임워크 동작을 바꾸는 에이전트는 설치된 `node_modules/next/dist/docs/`의 관련 문서를 먼저 읽는다.
