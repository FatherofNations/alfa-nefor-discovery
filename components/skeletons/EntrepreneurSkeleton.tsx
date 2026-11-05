import Skeleton from "./Skeleton";
import SkeletonText from "./SkeletonText";

/* Скелетон главной предпринимателя. Геометрия — из styles/app.css:
   .sidebar 308 фикс, .topbar 616×40 справа, .dashboard-content 972/отступ 120,
   табы 585×52 со сдвигом 196, hero 967×168 (36 сверху), «Мои дела» 62 сверху,
   лента операций 56 сверху. Блоки повторяют форму контента, а не абстрактные
   полоски: балансы, меню, шапка, табы, заголовок, чипсы, карточки, таблица. */

const MENU_WIDTHS = [118, 146, 132, 96, 108, 122];
const SECONDARY_MENU_WIDTHS = [98, 86];
const CHIP_WIDTHS = [207, 174, 201, 207, 73];

export default function EntrepreneurSkeleton() {
  return (
    <div className="sk-page" aria-busy="true" aria-label="Загрузка главной">
      <main className="dashboard-page">
        <aside className="sidebar" aria-hidden="true">
          <div className="sidebar-logo">
            <Skeleton style={{ width: 40, height: 40 }} borderRadius={12} />
            <Skeleton style={{ width: 123, height: 16 }} borderRadius={4} />
          </div>

          <div className="sk-side-body">
            <div className="sk-amounts">
              {[0, 1].map((row) => (
                <div className="sk-balance" key={row}>
                  <Skeleton style={{ width: 40, height: 40 }} borderRadius={12} />
                  <span className="sk-balance-copy">
                    {/* метрики как у живого блока (16/20 + 14/18), иначе при
                        подмене скелетона контентом строки «прыгают» по высоте */}
                    <SkeletonText fontSize={16} lineHeight={20} widths={[row ? 108 : 128]} />
                    <SkeletonText fontSize={14} lineHeight={18} widths={[row ? 72 : 86]} />
                  </span>
                  <Skeleton style={{ width: 32, height: 32 }} borderRadius={10} />
                </div>
              ))}
            </div>

            <div className="sk-menu-wrap">
              <span className="sk-divider" />

              <div className="sk-menu">
                {MENU_WIDTHS.map((width, index) => (
                  <div className="sk-menu-row" key={width}>
                    <Skeleton style={{ width: 20, height: 20 }} borderRadius={6} />
                    <Skeleton style={{ width, height: 12 }} borderRadius="pill" />
                    {index === 1 && <Skeleton style={{ width: 64, height: 28, marginLeft: "auto" }} borderRadius="pill" />}
                  </div>
                ))}
                <span className="sk-divider" />
                {SECONDARY_MENU_WIDTHS.map((width) => (
                  <div className="sk-menu-row" key={width}>
                    <Skeleton style={{ width: 20, height: 20 }} borderRadius={6} />
                    <Skeleton style={{ width, height: 12 }} borderRadius="pill" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <header className="topbar" aria-hidden="true">
          <span className="sk-topbar-buttons">
            <Skeleton style={{ width: 40, height: 40 }} borderRadius={12} />
            <Skeleton style={{ width: 40, height: 40 }} borderRadius={12} />
          </span>
          <span className="vertical-divider" />
          <div className="sk-company">
            <Skeleton style={{ width: 40, height: 40 }} borderRadius={12} />
            <span className="sk-company-copy">
              <SkeletonText fontSize={14} lineHeight={20} widths={[161]} />
              <SkeletonText fontSize={12} lineHeight={16} widths={[92]} />
            </span>
          </div>
          <span className="vertical-divider" />
          <Skeleton style={{ width: 168, height: 40 }} borderRadius="pill" />
          <span className="vertical-divider" />
          <Skeleton style={{ width: 40, height: 40 }} borderRadius={12} />
        </header>

        <div className="dashboard-content" aria-hidden="true">
          <div className="sk-tabs">
            <Skeleton style={{ width: 585, height: 52 }} borderRadius="pill" />
          </div>

          <div className="sk-hero">
            <div className="sk-hero-copy">
              <SkeletonText fontSize={36} lineHeight={48} widths={[333]} align="center" />
              <div className="sk-hero-sub">
                <SkeletonText fontSize={16} lineHeight={24} widths={[370]} />
                <SkeletonText fontSize={16} lineHeight={24} widths={[166]} />
              </div>
            </div>
            <div className="sk-hero-chips">
              {CHIP_WIDTHS.map((width, index) => (
                <Skeleton key={index} style={{ width, height: 52 }} borderRadius={16} />
              ))}
            </div>
          </div>

          <div className="sk-tasks">
            <SkeletonText fontSize={20} lineHeight={26} widths={[95]} />
            <div className="sk-cards">
              {[154, 154, 154, 154, 154, 154].map((width, index) => (
                <Skeleton
                  key={index}
                  style={{ width, height: 212, flex: "none" }}
                  borderRadius={12}
                />
              ))}
            </div>
          </div>

          <div className="sk-ops">
            <div className="sk-ops-title">
              <span className="sk-ops-title-main">
                <SkeletonText fontSize={20} lineHeight={26} widths={[177]} />
              </span>
              <Skeleton style={{ width: 288, height: 22 }} borderRadius="pill" />
            </div>

            <div className="sk-filters">
              <Skeleton style={{ width: 253, height: 40 }} borderRadius={12} />
              <Skeleton style={{ width: 461, height: 40 }} borderRadius={12} />
              <Skeleton style={{ width: 40, height: 40 }} borderRadius={12} />
              <Skeleton style={{ width: 114, height: 40, marginLeft: "auto" }} borderRadius={12} />
            </div>

            <div className="sk-analytics">
              {[0, 1, 2, 3].map((card) => (
                <Skeleton key={card} style={{ height: 76, flex: 1 }} borderRadius={16} />
              ))}
            </div>

            <div className="sk-table">
              {[0, 1, 2, 3, 4, 5, 6].map((row) => (
                <Skeleton key={row} style={{ height: 56 }} borderRadius={8} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="sk-spot" aria-hidden="true">
        <div className="sk-spot-left">
          <Skeleton style={{ width: 28, height: 28 }} borderRadius={10} />
          <Skeleton style={{ width: 147, height: 14 }} borderRadius="pill" />
        </div>
        <div className="sk-spot-input">
          <Skeleton style={{ width: "100%", height: 48 }} borderRadius={12} />
        </div>
        <Skeleton style={{ width: 197, height: 48, flex: "none", marginLeft: 24 }} borderRadius={12} />
      </div>
    </div>
  );
}
