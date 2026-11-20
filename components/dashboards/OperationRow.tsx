import type { Operation } from "@/data/demo";

export default function OperationRow({ operation, checked, onCheck }: { operation: Operation; checked: boolean; onCheck: () => void }) {
  return (
    <div className="operation-row">
      <div className="operation-main">
        <div className="operation-content">
          <label className="checkbox">
            <input type="checkbox" checked={checked} onChange={onCheck} aria-label={`Выбрать операцию ${operation.title}`} />
            {checked
              ? <img className="checkbox-mark" src="/assets/figma/ops-table-checkbox-checked.svg" width={20} height={20} alt="" />
              : <span className="checkbox-mark checkbox-mark-empty" aria-hidden="true" />}
          </label>
          <div className="operation-info">
            <div className="operation-counterparty">
              <img className="company-logo" src={`/assets/figma/operation-logos/${operation.logo}`} width={52} height={52} alt="" />
              <div className="operation-copy">
                <p className="operation-title">{operation.title}</p>
                <p className="operation-description">{operation.description}{operation.details && <><br />{operation.details}</>}</p>
              </div>
            </div>
            <div className="operation-status"><span>{operation.status}</span></div>
            <div className={`operation-amount${operation.positive ? " positive" : ""}`}>{`${operation.amount}\u2009`}</div>
          </div>
          <button className="icon-button operation-more" type="button" aria-label="Действия с операцией"><img className="icon" src="/assets/figma/ops-table-da23c.svg" alt="" /></button>
        </div>
        <p className="operation-number">{operation.number}</p>
      </div>
      <span className="operation-border" />
    </div>
  );
}

