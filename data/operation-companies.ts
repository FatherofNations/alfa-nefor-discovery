const logoDirectory = "/assets/figma/operation-logos/";

export const operationCompanies = {
  terravait: { title: "ООО «Терравейт Логистика»", logo: logoDirectory + "company.png" },
  norvel: { title: "ООО «Норвел Офискомплект»", logo: logoDirectory + "office.png" },
  linvera: { title: "ООО «Линвера Телеком»", logo: logoDirectory + "telecom.png" },
  granvex: { title: "ООО «Гранвекс Снабжение»", logo: logoDirectory + "vector.png" },
  astern: { title: "ООО «Астерн Контракт»", logo: logoDirectory + "astern-contract.png" },
  forwell: { title: "ООО «Форвелл Доставка»", logo: logoDirectory + "forwell-delivery.png" },
  rivern: { title: "ООО «Риверн Бизнес-Центр»", logo: logoDirectory + "rivern-property.png" },
  modulterm: { title: "ООО «Модультерм Технологии»", logo: logoDirectory + "modulterm.png" },
};

export type OperationCompany = keyof typeof operationCompanies;
