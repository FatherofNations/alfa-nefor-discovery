/* Figma 238:23259. Геометрия и контент сохранены в .figma/tasks-v2. */
const asset = (name: string) => `/assets/figma/tasks-v2-${name}`;

function ProgressCircle({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? "tasks-progress tasks-progress-large" : "tasks-progress"}>
      <img className="tasks-progress-stroke" src={asset(large ? "imgStroke1.svg" : "imgStroke.svg")} alt="" />
      <img className="tasks-progress-fill" src={asset(large ? "imgProgress1.svg" : "imgProgress.svg")} alt="" />
      {large && <strong>50%</strong>}
    </span>
  );
}

function Reward({ value = 500 }: { value?: number }) {
  return <span className="tasks-reward">+{value}<img src={asset("imgIcon.svg")} alt="баллов" /></span>;
}

export default function TasksWidget({ afterPanel }: { afterPanel: boolean }) {
  return (
    <section className={`tasks tasks-v2${afterPanel ? " tasks-after-panel" : ""}`} aria-labelledby="tasks-title">
      <header className="tasks-v2-header">
        <h2 id="tasks-title">Мои дела</h2>
        <div className="tasks-v2-controls">
          <button className="tasks-all" type="button"><ProgressCircle /><span>Все задания</span></button>
          <div className="tasks-arrows">
            <button type="button" aria-label="Предыдущие задания" disabled><img src={asset("imgFixer.svg")} alt="" /></button>
            <img className="tasks-arrows-divider" src={asset("imgLine168.svg")} alt="" />
            <button type="button" aria-label="Следующие задания"><img src={asset("imgFixer1.svg")} alt="" /></button>
          </div>
        </div>
      </header>
      <div className="tasks-v2-grid">
        <article className="tasks-important">
          <div className="tasks-important-top">
            <span className="tasks-important-badge">Важное</span>
            <p>Риск блокировки<br />по ФЗ-115</p>
            <img className="tasks-documents" src={asset("documents.png")} alt="" />
            <span className="tasks-important-divider" />
          </div>
          <span className="tasks-panel-shadow"><span><img src={asset("imgPanelShadow.svg")} alt="" /></span></span>
          <div className="tasks-important-rows">
            {[
              { title: "Оплатить", sum: "12 207,00 ₽ ", count: 3 },
              { title: "Доработать", sum: "1 207,00 ₽ ", count: 0 },
              { title: "Подписать", sum: "0,00 ₽ ", count: 3 },
              { title: "Ещё", sum: "", count: 6 },
            ].map((row, index) => (
              <div className="tasks-important-row" key={row.title}>
                <span>{row.title}{index === 3 && <img className="tasks-more-chevron" src={asset("imgFixer.svg")} alt="" />}</span>
                <span className="tasks-important-sum">{row.sum}</span>
                <span className={`tasks-count${index === 0 ? " tasks-count-important" : ""}`}>{row.count}</span>
              </div>
            ))}
          </div>
        </article>
        <div className="tasks-v2-column">
          <article className="tasks-v2-card">
            <div className="tasks-v2-copy"><p>Узнать о бизнес-карте</p><Reward /></div>
            <span className="tasks-v2-art tasks-v2-business"><img src={asset("imgOnboardingCardImage.png")} alt="" /></span>
          </article>
          <article className="tasks-v2-card">
            <div className="tasks-v2-copy"><p>Выбрать категории кэшбэка</p><Reward /></div>
            <span className="tasks-v2-art tasks-v2-cashback"><img src={asset("imgOnboardingCardImage1.png")} alt="" /></span>
          </article>
          <article className="tasks-v2-card tasks-v2-card-profile">
            <div className="tasks-v2-copy"><p>Добавить пользователя</p><span>Дайте коллеге доступ</span></div>
            <span className="tasks-v2-glyph"><img src={asset("imgFixer2.svg")} alt="" /></span>
          </article>
        </div>
        <div className="tasks-v2-column">
          <article className="tasks-v2-card tasks-v2-prize">
            <div className="tasks-v2-copy"><p>Супер-приз за 5 заданий</p><Reward value={2500} /></div>
            <ProgressCircle large />
            <span className="tasks-prize-art"><img src={asset("imgContent.png")} alt="" /></span>
          </article>
          <article className="tasks-v2-card">
            <div className="tasks-v2-copy"><p>Защитить от блокировок</p><Reward /></div>
            <span className="tasks-v2-art tasks-v2-protection"><img src={asset("imgOnboardingCardImage2.png")} alt="" /></span>
          </article>
          <article className="tasks-v2-card tasks-v2-card-profile">
            <div className="tasks-v2-copy"><p>Заполнить СНИЛС</p><span>Дополните профиль</span></div>
            <span className="tasks-v2-glyph"><img src={asset("imgFixer3.svg")} alt="" /></span>
          </article>
        </div>
      </div>
    </section>
  );
}
