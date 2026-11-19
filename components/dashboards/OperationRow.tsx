import type { Operation } from "@/data/demo";

const asset = (name: string) => `/assets/figma/${name === "ops-table-ec6f5.png" ? name : name.replace(".png", ".webp")}`;

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <img className={`icon ${className}`} src={asset(name)} alt="" aria-hidden="true" />;
}

function CompanyLogo({ kind }: { kind: Operation["logo"] }) {
  if (kind === "bank") {
    return <span className="company-logo"><img src={asset("ops-table-255e8.png")} alt="" /></span>;
  }
  return (
    <span className="company-logo">
      <img className="company-logo-bg" src={asset("ops-table-75144.png")} alt="" />
      {kind === "company"
        ? <img className="company-logo-image" src={asset("ops-table-4c685.png")} alt="" />
        : <img className="company-logo-person" src={asset("ops-table-ec6f5.png")} alt="" />}
    </span>
  );
}

export default function OperationRow({ operation, checked, onCheck }: { operation: Operation; checked: boolean; onCheck: () => void }) {
  return (
    <div className="operation-row">
      <div className="operation-main">
        <div className="operation-content">
          <label className="checkbox">
            <input type="checkbox" checked={checked} onChange={onCheck} aria-label={`Выбрать операцию ${operation.title}`} />
            {checked
              ? <img className="checkbox-mark" src={asset("ops-table-checkbox-checked.svg")} width={20} height={20} alt="" />
              : <span className="checkbox-mark checkbox-mark-empty" aria-hidden="true" />}
          </label>
          <div className="operation-info">
            <div className="operation-counterparty">
              <CompanyLogo kind={operation.logo} />
              <div className="operation-copy">
                <p className="operation-title">{operation.title}</p>
                <p className="operation-description">{operation.description}{operation.details && <><br />{operation.details}</>}</p>
              </div>
            </div>
            <div className="operation-status"><span>{operation.status}</span></div>
            <div className={`operation-amount${operation.positive ? " positive" : ""}`}>{`${operation.amount}\u2009`}</div>
          </div>
          <button className="icon-button operation-more" type="button" aria-label="Действия с операцией"><Icon name="ops-table-da23c.svg" /></button>
        </div>
        <p className="operation-number">{operation.number}</p>
      </div>
      <span className="operation-border" />
    </div>
  );
}

