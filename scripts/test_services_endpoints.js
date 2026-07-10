// scripts/test_services_endpoints.js — Test completo de endpoints /api/services
require('dotenv').config();
const pool = require('../db/pool');
const http = require('http');

const BASE = 'http://localhost:3000';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: 'localhost',
      port: 3000,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        let parsed = chunks;
        try { parsed = JSON.parse(chunks); } catch (e) {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  let pass = 0, fail = 0;
  const ok = (label, cond, detail) => {
    if (cond) { console.log(`  ✅ ${label}`); pass++; }
    else      { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); fail++; }
  };

  try {
    // 1. Login
    const login = await req('POST', '/api/auth/login', { username: 'admin', password: 'DH2025' });
    ok('POST /api/auth/login → token', login.status === 200 && login.body.token);
    if (!login.body.token) { console.error('No se pudo obtener token, abortando'); return; }
    const TOKEN = login.body.token;

    // 2. GET /api/services (público)
    const list = await req('GET', '/api/services');
    ok('GET /api/services (público) → 200', list.status === 200);
    ok('GET /api/services → >=8 servicios', Array.isArray(list.body) && list.body.length >= 8);
    const sr001 = list.body.find((s) => s.id === 'SRV-001');
    ok('SRV-001 (Paquete Elite) presente y activo', sr001 && sr001.active && sr001.price === '2200.00');

    // 3. GET /api/services/:id
    const detail = await req('GET', '/api/services/SRV-001');
    ok('GET /api/services/SRV-001 → 200', detail.status === 200 && detail.body.id === 'SRV-001');
    const notFound = await req('GET', '/api/services/SRV-XXX');
    ok('GET /api/services/SRV-XXX → 404', notFound.status === 404);

    // 4. GET /api/services/last-update
    const lastUpd = await req('GET', '/api/services/last-update');
    ok('GET /api/services/last-update → 200 con timestamp',
      lastUpd.status === 200 && !!lastUpd.body.last_update);

    // 5. POST sin token → 401
    const noAuth = await req('POST', '/api/services', { id: 'SRV-009', name: 'Test' });
    ok('POST sin auth → 401', noAuth.status === 401);

    // 6. POST con datos inválidos → 400
    const bad = await req('POST', '/api/services', { price: -10 }, TOKEN);
    ok('POST con datos inválidos → 400', bad.status === 400);

    // 7. POST crear SRV-009
    const created = await req('POST', '/api/services', {
      id: 'SRV-009', name: 'Servicio de prueba', price: 100, category: 'secundario', emoji: '🧪'
    }, TOKEN);
    ok('POST /api/services crear SRV-009 → 201',
      created.status === 201 && created.body.id === 'SRV-009');

    // 8. POST duplicado → 409
    const dup = await req('POST', '/api/services', { id: 'SRV-009', name: 'Dup' }, TOKEN);
    ok('POST duplicado → 409', dup.status === 409);

    // 9. PATCH actualizar precio
    const upd = await req('PATCH', '/api/services/SRV-009', { price: 150 }, TOKEN);
    ok('PATCH /api/services/SRV-009 → 200, price=150',
      upd.status === 200 && upd.body.service && upd.body.service.price === '150.00');

    // 10. PATCH sin campos → 400
    const patchEmpty = await req('PATCH', '/api/services/SRV-009', {}, TOKEN);
    ok('PATCH sin campos → 400', patchEmpty.status === 400);

    // 11. PATCH inexistente → 404
    const patch404 = await req('PATCH', '/api/services/SRV-XXX', { price: 1 }, TOKEN);
    ok('PATCH SRV-XXX → 404', patch404.status === 404);

    // 12. DELETE SRV-009 (soft delete)
    const del = await req('DELETE', '/api/services/SRV-009', null, TOKEN);
    ok('DELETE /api/services/SRV-009 → 200', del.status === 200 && del.body.ok === true);

    // 13. Verificar que ya no aparece en listado público
    const listAfter = await req('GET', '/api/services');
    const stillThere = listAfter.body.find((s) => s.id === 'SRV-009');
    ok('SRV-009 ya NO aparece en listado público (soft delete)', !stillThere);

    // 14. DELETE inexistente → 404
    const del404 = await req('DELETE', '/api/services/SRV-XXX', null, TOKEN);
    ok('DELETE SRV-XXX → 404', del404.status === 404);

    // 15. last-update debe haber cambiado (por SRV-009 → patch → delete)
    const lastUpd2 = await req('GET', '/api/services/last-update');
    ok('last-update posterior >= al inicial',
      new Date(lastUpd2.body.last_update).getTime() >= new Date(lastUpd.body.last_update).getTime());

    console.log(`\nResultado: ${pass} pasaron, ${fail} fallaron`);
    if (fail > 0) process.exit(1);
  } catch (err) {
    console.error('Error en tests:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();