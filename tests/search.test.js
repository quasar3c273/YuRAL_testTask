import test from 'node:test';
import assert from 'node:assert/strict';
import { getBrands, getGoods, getOffers, readGoodsResponse } from '../src/api/parts.js';
import reducer, { brandSelected, fetchBrands, fetchOffers, numberChanged } from '../src/store/searchSlice.js';

test('Ошибки API с HTTP 403 сохраняют пояснение, не-JSON ошибки сохраняют HTTP статус', async () => {
  await assert.rejects(
    readGoodsResponse(new Response(JSON.stringify({ error: 'Invalid access key' }), { status: 403 })),
    /Неверный ключ доступа к API/,
  );
  await assert.rejects(readGoodsResponse(new Response(JSON.stringify({ error: 'Invalid key client!' }), { status: 403 })), /Неверный ключ API/);
  await assert.rejects(readGoodsResponse(new Response(JSON.stringify({ error: 'Empty key!' }), { status: 403 })), /Не указан ключ API/);
  await assert.rejects(readGoodsResponse(new Response('Bad Gateway', { status: 502 })), /HTTP 502/);
  await assert.rejects(readGoodsResponse(new Response('not json', { status: 200 })), /некорректный JSON/);
});

test('Пустая структура API и ошибки обрабатываются корректно', () => {
  assert.deepEqual(getGoods({ goods: [{ brand: '', number: '', count: 0 }] }), []);
  assert.deepEqual(getGoods({ goods: [] }), []);
  assert.throws(() => getGoods({ error: 'Invalid key client!' }), /Неверный ключ/);
  assert.throws(() => getGoods({}), /некорректный список/);
  assert.throws(() => getGoods(null), /некорректный ответ/);
});

test('Бренды не дублируются', () => {
  assert.deepEqual(getBrands([{ brand: 'MEYLE' }, { brand: 'FEBI' }, { brand: 'MEYLE' }]), ['MEYLE', 'FEBI']);
});

test('Цена и остаток берутся из склада; включаются аналоги без наличия', () => {
  const goods = [{
    goodsID: 'original', brand: 'MEYLE', number: 'A#1', name: 'Деталь', price: 99999,
    warehouses: [{ code: 'A', price: 100, stock: 2 }, { code: 'B', price: 120, stock: 0 }],
    analogues: [{ goodsID: 'analogue', brand: 'FEBI', number: 'B', count: 0, price: 555, warehouses: [] }],
  }];
  const offers = getOffers(goods);
  assert.equal(offers.length, 3);
  assert.deepEqual(offers.map(({ price, stock }) => ({ price, stock })), [
    { price: 100, stock: 2 }, { price: 120, stock: 0 }, { price: null, stock: 0 },
  ]);
  assert.equal(offers[2].brand, 'FEBI');
});

test('Старые ответы игнорируются после изменения артикула или бренда', () => {
  let state = reducer(undefined, numberChanged('A'));
  state = reducer(state, fetchBrands.pending('old', 'A'));
  state = reducer(state, numberChanged('B'));
  state = reducer(state, fetchBrands.fulfilled(['OLD'], 'old', 'A'));
  assert.deepEqual(state.brands, []);
  state = reducer(state, brandSelected('ONE'));
  state = reducer(state, fetchOffers.pending('offer-old', { number: 'B', brand: 'ONE' }));
  state = reducer(state, brandSelected('TWO'));
  state = reducer(state, fetchOffers.fulfilled([{ id: 'old' }], 'offer-old', {}));
  assert.deepEqual(state.offers, []);
});

test('Повторное нажатие выбранного бренда сохраняет предложения', () => {
  let state = reducer(undefined, brandSelected('MEYLE'));
  state = reducer(state, fetchOffers.pending('current', {}));
  state = reducer(state, fetchOffers.fulfilled([{ id: 'one' }], 'current', {}));
  state = reducer(state, brandSelected('MEYLE'));
  assert.deepEqual(state.offers, [{ id: 'one' }]);
});
