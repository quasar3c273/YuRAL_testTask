import { demoCatalog } from '../data/demoCatalog.js';

const normalize = (number) => number.replace(/[\s-]/g, '').toUpperCase();

function makeGood(part, index) {
  const warehouses = index % 9 === 0 ? [] : [
    {
      id: 'demo-msk',
      code: 'Демо Москва',
      price: 450 + index * 137,
      stock: 2 + index % 17,
    },
    {
      id: 'demo-ekb',
      code: 'Демо Екатеринбург',
      price: 490 + index * 137,
      stock: index % 5,
    },
  ];

  return {
    goodsID: `demo-${index}`,
    number: part.number,
    brand: part.brand,
    name: part.name,
    count: warehouses.reduce((sum, warehouse) => sum + warehouse.stock, 0),
    warehouses,
  };
}

function waitForDemo(signal, delay) {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(new DOMException('Запрос отменён', 'AbortError'));
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, delay);

    signal?.addEventListener('abort', abort, { once: true });

    if (signal?.aborted) {
      abort();
    }
  });
}

export async function searchDemoParts({ number, brand, signal }, delay = 350) {
  await waitForDemo(signal, delay);

  const matchedIndex = demoCatalog.findIndex((part) => normalize(part.number) === normalize(number));

  if (matchedIndex === -1) {
    return { goods: [] };
  }

  const brands = [...new Set(demoCatalog.map((part) => part.brand))];

  const group = brands.map((groupBrand) => {
    if (demoCatalog[matchedIndex].brand === groupBrand) {
      return matchedIndex;
    }

    return demoCatalog.findIndex((part) => part.brand === groupBrand);
  });

  const matches = group.flatMap((index) => {
    const part = demoCatalog[index];

    if (brand && part.brand !== brand) {
      return [];
    }

    const good = makeGood(part, index);

    if (brand) {
      const otherIndexes = [...group, ...demoCatalog.map((_, candidateIndex) => candidateIndex)];

      good.analogues = [...new Set(otherIndexes)]
        .filter((candidateIndex) => candidateIndex !== index)
        .slice(0, 3)
        .map((candidateIndex) => makeGood(demoCatalog[candidateIndex], candidateIndex));
    }

    return [good];
  });

  return { goods: matches };
}
