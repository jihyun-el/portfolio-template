import Link from "next/link";
export default function NotFound() {
  return <main id="main-content" className="standalone"><p className="eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><p>주소를 확인하거나 첫 화면으로 돌아가세요.</p><Link href="/">첫 화면으로 →</Link></main>;
}
