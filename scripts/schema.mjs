const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export function isPublicUrl(value, email = true) {
  if (typeof value !== "string" || /[\s\u0000-\u001f]/.test(value)) return false;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return !!url.hostname && !url.username && !url.password;
    return email && url.protocol === "mailto:" && /^[^@/?#]+@[^@/?#]+\.[^@/?#]+$/.test(url.pathname) && !url.search && !url.hash;
  } catch { return false; }
}
export function isLocalImage(value) {
  return typeof value === "string" && /^\/images\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value) && !value.includes("//");
}
export function validatePortfolio(data) {
  const errors = [];
  const fail = (key, message) => errors.push(`${key}: ${message}`);
  const obj = (value, key, fields) => {
    if (!object(value)) { fail(key, "객체 형식이어야 합니다."); return false; }
    for (const field of fields) if (!(field in value)) fail(`${key}.${field}`, "필수 항목입니다.");
    for (const field of Object.keys(value)) if (!fields.includes(field)) fail(`${key}.${field}`, "지원하지 않는 항목입니다. 오타 또는 문서를 확인하세요.");
    return true;
  };
  const str = (value, key, empty = false) => { if (typeof value !== "string" || (!empty && !value.trim())) fail(key, empty ? "문자열이어야 합니다." : "비어 있지 않은 문자열이어야 합니다."); };
  const list = (value, key, check) => { if (!Array.isArray(value)) { fail(key, "배열 [ ] 형식이어야 합니다."); return; } value.forEach((item, i) => check(item, `${key}[${i}]`)); };
  const links = (value, key) => list(value, key, (link, at) => {
    if (!obj(link, at, ["label", "url"])) return;
    str(link.label, `${at}.label`);
    if (!isPublicUrl(link.url)) fail(`${at}.url`, "https:// 주소 또는 mailto:이메일을 입력하세요.");
  });
  const records = (value, key) => list(value, key, (entry, at) => {
    if (!obj(entry, at, ["title", "period", "description"])) return;
    str(entry.title, `${at}.title`); str(entry.period, `${at}.period`); str(entry.description, `${at}.description`, true);
  });
  if (!obj(data, "portfolio", ["site", "profile", "projects", "skills", "writing"])) return errors;
  if (obj(data.site, "site", ["title", "description", "example"])) {
    str(data.site.title, "site.title"); str(data.site.description, "site.description");
    if (typeof data.site.example !== "boolean") fail("site.example", "true 또는 false여야 합니다.");
  }
  if (obj(data.profile, "profile", ["name", "role", "intro", "fields", "links", "experiences", "education"])) {
    for (const key of ["name", "role", "intro"]) str(data.profile[key], `profile.${key}`);
    list(data.profile.fields, "profile.fields", (item, at) => str(item, at));
    links(data.profile.links, "profile.links");
    records(data.profile.experiences, "profile.experiences"); records(data.profile.education, "profile.education");
  }
  const ids = new Set();
  list(data.projects, "projects", (p, at) => {
    if (!obj(p, at, ["id", "name", "category", "period", "role", "title", "accent", "summary", "stack", "links", "image", "imageAlt", "art", "artLabels", "sections"])) return;
    for (const key of ["id", "name", "category", "period", "role", "title", "summary"]) str(p[key], `${at}.${key}`);
    for (const key of ["accent", "image", "imageAlt"]) str(p[key], `${at}.${key}`, true);
    if (typeof p.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(p.id)) fail(`${at}.id`, "영문 소문자로 시작하고 영문 소문자·숫자·하이픈만 사용하세요.");
    if (ids.has(p.id)) fail(`${at}.id`, "다른 프로젝트와 id가 겹칩니다.");
    ids.add(p.id);
    if (p.accent && typeof p.title === "string" && !p.title.includes(p.accent)) fail(`${at}.accent`, "title에 실제로 들어 있는 단어를 쓰거나 비워 두세요.");
    if (!["orbit", "layers", "flow", "none"].includes(p.art)) fail(`${at}.art`, "orbit, layers, flow, none 중 선택하세요.");
    list(p.artLabels, `${at}.artLabels`, (item, key) => str(item, key));
    if (Array.isArray(p.artLabels) && p.artLabels.length !== 3) fail(`${at}.artLabels`, "라벨을 정확히 3개 입력하세요.");
    if (p.image && !isLocalImage(p.image)) fail(`${at}.image`, "/images/example.png처럼 public/images 안의 파일 경로를 쓰세요.");
    if (p.image && (typeof p.imageAlt !== "string" || !p.imageAlt.trim())) fail(`${at}.imageAlt`, "이미지 내용을 설명해 주세요.");
    list(p.stack, `${at}.stack`, (item, key) => str(item, key)); links(p.links, `${at}.links`);
    list(p.sections, `${at}.sections`, (section, key) => {
      if (!obj(section, key, ["title", "body"])) return;
      str(section.title, `${key}.title`); str(section.body, `${key}.body`);
    });
  });
  list(data.skills, "skills", (skill, at) => {
    if (!obj(skill, at, ["name", "usage"])) return;
    str(skill.name, `${at}.name`); str(skill.usage, `${at}.usage`);
  });
  list(data.writing, "writing", (post, at) => {
    if (!obj(post, at, ["title", "summary", "url"])) return;
    str(post.title, `${at}.title`); str(post.summary, `${at}.summary`);
    if (!isPublicUrl(post.url, false)) fail(`${at}.url`, "https://로 시작하는 글 주소를 입력하세요.");
  });
  return errors;
}
