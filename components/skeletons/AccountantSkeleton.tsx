import BodyClass from "@/components/BodyClass";
import AppChrome from "@/components/chrome/AppChrome";
import AssistantBar from "@/components/chrome/AssistantBar";
import Skeleton from "./Skeleton";
import SkeletonText from "./SkeletonText";

/* Скелетон главной бухгалтера. Хром (сайдбар 248 + шапка 56) и плашка
   SpotlightBar — настоящие, они статичны; скелетон только у контента.
   Геометрия — из макета 136:18883 (get_metadata 136:18900): быстрые действия
   1161×48 на y=88, первый ряд 612 + 294 + 294 × 384, табло 48 на y=592,
   ряд карточек 6×198×135 на y=664, дальше лента операций. */

const QA_WIDTHS = [196, 205, 197, 211, 193, 72];
const TAB_WIDTHS = [144, 79, 182, 159];

export default function AccountantSkeleton() {
  return (
    <div className="sk-page" aria-busy="true" aria-label="Загрузка главной">
      <BodyClass name="cur" />
      <AppChrome personLabel="Бухгалтер" />

      <main className="cur-main">
        <div className="sk-acc" aria-hidden="true">
          <div className="sk-qa">
            {QA_WIDTHS.map((width) => (
              <Skeleton key={width} style={{ width, height: 48 }} borderRadius={10} />
            ))}
          </div>

          <div className="sk-row1">
            <div className="sk-balance"><Skeleton style={{ width: 612, height: 384, flex: "none" }} borderRadius={16} /></div>
            <div className="sk-inwork"><Skeleton style={{ width: 294, height: 384, flex: "none" }} borderRadius={16} /></div>
            <div className="sk-banners"><Skeleton style={{ width: 294, height: 384, flex: "none" }} borderRadius={16} /></div>
          </div>

          <div className="sk-tablo">
            <div className="sk-tablo-tabs">
              {TAB_WIDTHS.map((width) => (
                <SkeletonText key={width} fontSize={22} lineHeight={26} widths={[width]} />
              ))}
            </div>
            <div className="sk-tablo-ctrl">
              <Skeleton style={{ width: 84, height: 44 }} borderRadius={12} />
              <Skeleton style={{ width: 20, height: 20 }} borderRadius={6} />
            </div>
          </div>

          <div className="sk-cards">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} style={{ width: 198, height: 135, flex: "none" }} borderRadius={16} />
            ))}
          </div>

          <div className="sk-feed">
            <SkeletonText fontSize={30} lineHeight={36} widths={[235]} />
            <div className="sk-filters">
              <Skeleton style={{ width: 340, height: 56 }} borderRadius={16} />
              <Skeleton style={{ height: 56, flex: 1 }} borderRadius={16} />
            </div>
            <div className="sk-tags">
              {[86, 74, 92, 80].map((width) => (
                <Skeleton key={width} style={{ width, height: 40 }} borderRadius={10} />
              ))}
            </div>
            <Skeleton style={{ height: 856, marginTop: 24 }} borderRadius={16} />
          </div>
        </div>
      </main>

      <AssistantBar label="Alpha Intellect" />
    </div>
  );
}
