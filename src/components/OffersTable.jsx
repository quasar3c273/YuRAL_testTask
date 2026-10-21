const priceFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function OffersTable({ offers }) {
  if (offers.length === 0) {
    return (
      <p className="text-secondary mb-0" role="status">
        Аналоги и предложения не найдены.
      </p>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <caption>Цена и остаток указаны для каждого склада отдельно.</caption>

        <thead>
          <tr>
            <th scope="col">Название / Производитель</th>
            <th scope="col">Артикул</th>
            <th scope="col">Склад</th>
            <th scope="col" className="text-end">Цена</th>
            <th scope="col" className="text-end">Остаток</th>
          </tr>
        </thead>

        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td>
                <div>{offer.name}</div>
                <small className="text-secondary">{offer.brand}</small>
              </td>
              <td>{offer.number}</td>
              <td>{offer.warehouse}</td>
              <td className="text-end text-nowrap">
                {offer.price === null ? '—' : priceFormatter.format(offer.price)}
              </td>
              <td className="text-end">{offer.stock ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
