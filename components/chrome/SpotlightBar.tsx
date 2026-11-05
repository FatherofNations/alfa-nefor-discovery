/* Нижняя плашка SpotlightBar — перенесена 1:1 из макета «Карты»
   (Figma 129417:51743, [D] SpotlightBar 1600×60). Общий хром прототипа: рисует
   его layout группы app/(proto), поэтому видна на всех страницах прототипа
   (на самостоятельной /components её нет). Геометрия и градиент — из design
   context, см. .spot в chrome.css. Кнопка «Связь с банком» — ButtonDesktop
   view=accent size=48 shape=rounded (accent/secondary #212124, радиус 10). */

const A = "/assets/chrome/";

export default function SpotlightBar() {
  return (
    <div className="spot">
      <div className="spot-left">
        <div className="spot-logo">
          <span className="spot-ico">
            <img className="spot-ico-shadow" src={`${A}spot-shadow.svg`} alt="" />
            <img
              className="spot-ico-shape"
              src={`${A}spot-shape.svg`}
              width="28"
              height="28"
              alt=""
            />
            <img
              className="spot-ico-neural"
              src={`${A}spot-neural.svg`}
              width="16"
              height="16"
              alt=""
            />
          </span>
          <span className="spot-label">Нейропомощник</span>
        </div>
      </div>

      <div className="spot-right">
        <div className="spot-input">
          <span className="spot-ph">Как открыть депозит</span>
          <span className="spot-expand">
            <img
              src={`${A}spot-arrows-out.svg`}
              width="20"
              height="20"
              alt="Развернуть"
            />
          </span>
        </div>
        <button className="spot-cta" type="button">
          <span className="spot-cta-i">
            <img src={`${A}spot-bubble.svg`} width="24" height="24" alt="" />
          </span>
          <span className="spot-cta-t">Связь с банком</span>
        </button>
      </div>
    </div>
  );
}
