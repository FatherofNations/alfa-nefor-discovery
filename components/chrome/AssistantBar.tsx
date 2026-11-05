/* Нижняя плашка ассистента — один-в-один как на дашборде предпринимателя
   (spotlight: логотип-кружок + градиентная подпись, пилюля-инпут со скрепкой
   и «развернуть», кнопка «Связь с банком»), плюс разделительные слои:
   полоса 6px над плашкой и скруглённые вырезы по углам, чтобы контент,
   уезжающий под плашку, не просвечивал острым углом.
   На бухгалтере подпись — Alpha Intellect (по просьбе пользователя). */

type AssistantBarProps = {
  label: string;
};

const FIG = "/assets/figma/";

export default function AssistantBar({ label }: AssistantBarProps) {
  return (
    <>
      <div className="footer-fade" />
      <div className="viewport-strip" aria-hidden="true" />
      <div className="spotlight-corner spotlight-corner-left" aria-hidden="true" />
      <div className="spotlight-corner spotlight-corner-right" aria-hidden="true" />
      <section className="spotlight" aria-label={label}>
        <div className="spotlight-logo">
          <span className="neural-logo">
            <img className="neural-shadow" src={`${FIG}spotlight-d6d2f.svg`} alt="" />
            <img src={`${FIG}spotlight-dbc5c.svg`} alt="" />
          </span>
          <strong>{label}</strong>
        </div>
        <div className="spotlight-body">
          <div className="assistant-input">
            <span className="paperclip"><img src={`${FIG}paperclip-icon.svg`} alt="" /></span>
            <input placeholder="Как открыть депозит" aria-label={`Вопрос «${label}»`} />
            <button type="button" aria-label={`Развернуть «${label}»`}>
              <img className="icon" src={`${FIG}spotlight-69a3f.svg`} alt="" />
            </button>
          </div>
          <button className="support-button" type="button">
            <img src={`${FIG}support-icon.svg`} alt="" />
            <span>Связь с банком</span>
            <span className="indicator indicator-small">1</span>
          </button>
        </div>
      </section>
    </>
  );
}
