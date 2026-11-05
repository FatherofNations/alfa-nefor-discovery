import Link from "next/link";

export default function EntryHeader() {
  return (
    <header className="entry-header">
      <Link className="entry-logo" href="/" aria-label="Альфа-Бизнес — на главную">
        <span className="logo-sign"><img src="/assets/figma/logo-sign.svg" alt="" /></span>
      </Link>
      <button className="entry-help" type="button">Помощь</button>
    </header>
  );
}
