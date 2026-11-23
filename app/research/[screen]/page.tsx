import { notFound } from "next/navigation";
import Glavnaya from "@/components/dashboards/Glavnaya";
import { isResearchScreen, researchScreens } from "@/data/research";

type Props = { params: Promise<{ screen: string }> };

export async function generateMetadata({ params }: Props) {
  const { screen } = await params;
  return { title: isResearchScreen(screen) ? researchScreens[screen] : "Альфа-Бизнес" };
}

export default async function Page({ params }: Props) {
  const { screen } = await params;
  if (!isResearchScreen(screen)) notFound();
  return <Glavnaya research={screen} />;
}
