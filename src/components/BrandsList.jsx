export default function BrandsList({ brands, selectedBrand, onSelect }) {
  return (
    <>
      <p className="mb-2">Выберите производителя:</p>

      <div className="d-flex flex-wrap gap-2">
        {brands.map((brand) => (
          <button
            key={brand}
            type="button"
            className={`btn ${selectedBrand === brand ? 'btn-primary' : 'btn-outline-primary'}`}
            aria-pressed={selectedBrand === brand}
            onClick={() => onSelect(brand)}
          >
            {brand}
          </button>
        ))}
      </div>
    </>
  );
}
