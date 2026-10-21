import test from 'node:test';
import assert from 'node:assert/strict';
import { demoCatalog } from '../src/data/demoCatalog.js';
import { searchDemoParts } from '../src/api/demo.js';
import { getBrands, getGoods, getOffers } from '../src/api/parts.js';

test('Демокаталог содержит 52 уникальных артикула трёх брендов', () => {
  assert.equal(demoCatalog.length, 52);
  assert.equal(new Set(demoCatalog.map((part) => part.number)).size, 52);
  assert.deepEqual([...new Set(demoCatalog.map((part) => part.brand))], ['MANN-FILTER', 'BOSCH', 'MAHLE']);
  for (const part of demoCatalog) {
    assert.ok(part.brand && part.name);
  }
});

test('Для каждого артикула доступны три бренда, второй этап учитывает выбранный бренд', async () => {
  for (const part of demoCatalog) {
    const goods = getGoods(await searchDemoParts({ number: part.number }, 0));
    assert.deepEqual(getBrands(goods), ['MANN-FILTER', 'BOSCH', 'MAHLE']);
    for (const brand of getBrands(goods)) {
      const result = getGoods(await searchDemoParts({ number: part.number, brand }, 0));
      assert.equal(result.length, 1);
      assert.equal(result[0].brand, brand);
      assert.ok(result[0].analogues.some((analogue) => analogue.brand !== brand));
    }
  }
});

test('Все демоартикулы проходят оба этапа поиска с аналогами и складами', async () => {
  for (const part of demoCatalog) {
    const goods = getGoods(await searchDemoParts({ number: part.number }, 0));
    assert.ok(getBrands(goods).includes(part.brand));
    assert.equal(goods[0].analogues, undefined);
    const detailedGoods = getGoods(await searchDemoParts({ number: part.number, brand: part.brand }, 0));
    assert.equal(detailedGoods[0].analogues.length, 3);
    const offers = getOffers(detailedGoods);
    assert.ok(offers.length >= 4);
    assert.ok(offers.some((offer) => offer.price > 0));
  }
});

test('Неизвестные артикул и бренд дают пустой результат', async () => {
  assert.deepEqual(await searchDemoParts({ number: 'UNKNOWN-PART' }, 0), { goods: [] });
  assert.deepEqual(await searchDemoParts({ number: demoCatalog[0].number, brand: 'UNKNOWN' }, 0), { goods: [] });
});

test('Демо поддерживает отмену текущего и заранее отменённого запроса', async () => {
  const controller = new AbortController();
  const request = searchDemoParts({ number: demoCatalog[0].number, signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
  await assert.rejects(searchDemoParts({ number: demoCatalog[0].number, signal: controller.signal }), { name: 'AbortError' });
});

test('Регистр и пробелы не мешают поиску; товары без наличия сохраняются', async () => {
  const first = demoCatalog[0];
  const goods = getGoods(await searchDemoParts({ number: ` ${first.number.toLowerCase()} `, brand: first.brand }, 0));
  assert.equal(goods[0].number, first.number);
  assert.equal(goods[0].count, 0);
  assert.deepEqual(goods[0].warehouses, []);
  assert.equal(getOffers(goods)[0].price, null);
});
