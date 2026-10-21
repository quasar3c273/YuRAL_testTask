import { isDemoMode } from '../config.js';

const errorMessages = {
  'Empty key!': 'Не указан ключ API. Заполните VITE_API_KEY в файле .env.',
  'Invalid key client!': 'Неверный ключ API.',
  'Invalid access key': 'Неверный ключ доступа к API.',
  'Empty number goods!': 'Не указан артикул детали.',
  'Request quota exceeded!': 'Превышен лимит запросов к API. Попробуйте позже.',
};

export function getGoods(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('API вернул некорректный ответ.');
  }

  if (data.error) {
    throw new Error(errorMessages[data.error] || String(data.error));
  }

  if (!Array.isArray(data.goods)) {
    throw new Error('API вернул некорректный список товаров.');
  }

  return data.goods.filter((good) => good && good.brand && good.number);
}

export function getBrands(goods) {
  return [...new Set(goods.map((good) => good.brand))];
}

export function getOffers(goods) {
  const offers = [];
  const seen = new Set();

  function addGood(good) {
    if (!good || !good.brand || !good.number) {
      return;
    }

    const key = good.goodsID || `${good.brand}:${good.number}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);

    const warehouses = Array.isArray(good.warehouses) ? good.warehouses : [];
    const base = {
      name: good.name || 'Название не указано',
      brand: good.brand,
      number: good.number,
    };

    if (warehouses.length) {
      warehouses.forEach((warehouse, index) => {
        offers.push({
          ...base,
          id: `${key}:${index}`,
          warehouse: warehouse.code || warehouse.id || 'Не указан',
          price: warehouse.price ?? null,
          stock: warehouse.stock ?? null,
        });
      });
    } else {
      offers.push({
        ...base,
        id: key,
        warehouse: 'Нет предложений',
        price: null,
        stock: good.count ?? 0,
      });
    }

    if (Array.isArray(good.analogues)) {
      good.analogues.forEach(addGood);
    }
  }

  goods.forEach(addGood);

  return offers;
}

export async function readGoodsResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Ошибка API (HTTP ${response.status}). Попробуйте позже.`);
    }

    throw new Error('API вернул некорректный JSON.');
  }
  if (data?.error) {
    return getGoods(data);
  }

  if (!response.ok) {
    throw new Error(`Ошибка API (HTTP ${response.status}). Попробуйте позже.`);
  }

  return getGoods(data);
}

export async function searchParts({ number, brand, signal }) {
  if (isDemoMode) {
    const { searchDemoParts } = await import('./demo.js');

    return getGoods(await searchDemoParts({ number, brand, signal }));
  }

  const key = import.meta.env.VITE_API_KEY?.trim();

  if (!key) {
    throw new Error(errorMessages['Empty key!']);
  }

  const params = new URLSearchParams({ key, number });

  if (brand) {
    params.set('brand', brand);
    params.set('analogues', 'on');
  }

  const controller = new AbortController();
  const abort = () => controller.abort();

  signal?.addEventListener('abort', abort, { once: true });

  if (signal?.aborted) {
    controller.abort();
  }

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 20000);

  try {
    const response = await fetch(`/api?${params}`, { signal: controller.signal });

    return await readGoodsResponse(response);
  } catch (error) {
    if (timedOut) {
      throw new Error('API не ответил за 20 секунд. Попробуйте позже.');
    }

    if (error.name === 'AbortError') {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error('Не удалось связаться с API. Проверьте подключение к сети.');
    }

    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

