// Выполняется в head до того, как браузер восстановит позицию при reload.
export const reloadScrollScript = `
if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
  const saved = history.scrollRestoration;
  history.scrollRestoration = "manual";
  addEventListener("pageshow", () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      history.scrollRestoration = saved;
    });
  }, { once: true });
}
`;
