import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { brandSelected, fetchBrands, fetchOffers, numberChanged } from './store/searchSlice.js';
import { isDemoMode } from './config.js';
import { demoCatalog } from './data/demoCatalog.js';
import BrandsList from './components/BrandsList.jsx';
import Loader from './components/Loader.jsx';
import OffersTable from './components/OffersTable.jsx';

export default function App() {
  const dispatch = useDispatch();
  const {
    number,
    selectedBrand,
    brands,
    offers,
    brandsStatus,
    offersStatus,
    brandsError,
    offersError,
  } = useSelector((state) => state.search);

  const article = number.trim();

  useEffect(() => {
    if (!article) {
      return;
    }

    let request;

    const timer = setTimeout(() => {
      request = dispatch(fetchBrands(article));
    }, 500);

    return () => {
      clearTimeout(timer);
      request?.abort();
    };
  }, [number, article, dispatch]);

  useEffect(() => {
    if (!article || !selectedBrand) {
      return;
    }

    const request = dispatch(fetchOffers({ number: article, brand: selectedBrand }));

    return () => request.abort();
  }, [article, selectedBrand, dispatch]);

  function handleNumberChange(event) {
    dispatch(numberChanged(event.target.value));
  }

  function handleBrandSelect(brand) {
    dispatch(brandSelected(brand));
  }

  return (
    <main className="container py-5">
      <h1 className="h2 mb-4">Поиск автозапчастей</h1>

      {isDemoMode && (
        <div className="alert alert-info">
          <strong>Демонстрационный режим.</strong> Запросы к API не отправляются, ключ не нужен.
          Артикулы реальные; цены, остатки и связи аналогов вымышлены.
          В демопоиске каждый артикул открывает условную группу из трёх брендов с их собственными артикулами.
        </div>
      )}

      <section className="card mb-4" aria-labelledby="brands-heading">
        <div className="card-body p-4">
          <h2 id="brands-heading" className="h5 mb-3">1. Найдите производителя</h2>

          <label className="form-label" htmlFor="article">Артикул детали</label>
          <input
            id="article"
            className="form-control mb-3"
            value={number}
            onChange={handleNumberChange}
            placeholder="Введите номер детали"
            autoComplete="off"
          />

          {isDemoMode && (
            <div className="mb-3">
              <label htmlFor="demo-article" className="form-label">
                Примеры артикулов ({demoCatalog.length})
              </label>

              <select
                id="demo-article"
                className="form-select"
                value=""
                onChange={handleNumberChange}
              >
                <option value="" disabled>Выберите артикул для демонстрации</option>

                {demoCatalog.map((part) => (
                  <option key={`${part.brand}:${part.number}`} value={part.number}>
                    {part.number} · {part.brand} · {part.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!article && (
            <p className="text-secondary mb-0">
              Введите артикул, чтобы получить список производителей.
            </p>
          )}

          {brandsStatus === 'loading' && <Loader>Ищем производителей…</Loader>}

          {brandsError && (
            <div className="alert alert-danger mb-0" role="alert">
              {brandsError}
            </div>
          )}

          {brandsStatus === 'succeeded' && brands.length === 0 && (
            <p className="text-secondary mb-0" role="status">
              Производители не найдены.
            </p>
          )}

          {brands.length > 0 && (
            <BrandsList
              brands={brands}
              selectedBrand={selectedBrand}
              onSelect={handleBrandSelect}
            />
          )}
        </div>
      </section>

      {selectedBrand && (
        <section className="card" aria-labelledby="offers-heading">
          <div className="card-body p-4">
            <h2 id="offers-heading" className="h5 mb-3">2. Аналоги и предложения</h2>
            <p className="text-secondary">{article} · {selectedBrand}</p>

            {offersStatus === 'loading' && <Loader>Загружаем предложения…</Loader>}

            {offersError && (
              <div className="alert alert-danger mb-0" role="alert">
                {offersError}
              </div>
            )}

            {offersStatus === 'succeeded' && <OffersTable offers={offers} />}
          </div>
        </section>
      )}
    </main>
  );
}
