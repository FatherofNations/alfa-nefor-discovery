"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import EntryHeader from "./EntryHeader";

const ALT = [
  { label: "Быстрый вход", icon: "/assets/first-entry/ic-keyboard-passcode.svg" },
  { label: "Телефон", icon: "/assets/first-entry/ic-phone-number-scan.svg" },
  { label: "QR-код", icon: "/assets/first-entry/ic-qr-code.svg" },
  { label: "Токен", icon: "/assets/first-entry/ic-usb-flash-drive.svg" },
];

export default function LoginScreen() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    if (leaving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/welcome");
      return;
    }
    setLeaving(true);
    window.setTimeout(() => router.push("/welcome"), 240);
  };

  return (
    <div className={`entry-page entry-login${leaving ? " is-leaving" : ""}`}>
      <EntryHeader />
      <form
        className="entry-login-main"
        onSubmit={(event) => {
          event.preventDefault();
          enter();
        }}
      >
        <div className="entry-login-top" />
        <div className="entry-login-area">
          <h1 className="entry-title">Альфа-Бизнес</h1>
          <p className="entry-subtitle">Вход по Alfa ID</p>
          <input
            className="entry-input entry-input-login"
            placeholder="Логин"
            aria-label="Логин"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            autoComplete="username"
          />
          <div className="entry-input-wrap">
            <input
              className="entry-input"
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              aria-label="Пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              className="entry-eye"
              type="button"
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <img src="/assets/first-entry/ic-eye-off.svg" alt="" />
            </button>
          </div>
          <button className="entry-submit" type="submit">Войти</button>
          <button className="entry-forgot" type="button">Забыли логин или пароль?</button>
        </div>
        <div className="entry-login-flex" />
        <div className="entry-alt">
          {ALT.map((item) => (
            <button className="entry-alt-btn" type="button" key={item.label} onClick={enter}>
              <span className="entry-alt-icon"><img src={item.icon} alt="" /></span>
              <span className="entry-alt-label">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="entry-login-bottom" />
      </form>
    </div>
  );
}
