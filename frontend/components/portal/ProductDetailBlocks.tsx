import type { ProductDetailBlock } from "@/data/product-detail-content";

export function ProductDetailBlocks({ blocks }: { blocks: ProductDetailBlock[] }) {
  if (!blocks.length) return null;

  return (
    <div className="aptus-product-detail__content">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "p") {
          return (
            <p key={key} className="aptus-product-detail__content-p">
              {block.text}
            </p>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={key} className="aptus-product-detail__content-h">
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={key} className="aptus-product-detail__content-list">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <div key={key} className="aptus-product-detail__content-table-wrap">
            <table className="aptus-product-detail__content-table">
              <thead>
                <tr>
                  {block.headers.map((header) => (
                    <th key={header} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
