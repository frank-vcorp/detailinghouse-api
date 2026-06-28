// db/seed_catalog.js — Catálogo completo A1A con imágenes reales
// Ejecutar: node db/seed_catalog.js
require('dotenv').config();
const pool = require('./pool');

const catalog = [
  // === INTERIORES ===
  {
    sku: 'A1A-001', name: 'VINIL PROTECT', category: 'interiores', categoryLabel: 'INTERIORES',
    price: 150, stock: 10, presentation: '600ml',
    description: 'Brillo y Protección para Plásticos Interiores con filtro UV y tecnología antiestática. Recupera el aspecto original y dura más tiempo limpio. Aroma fresco incluido.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=766'
  },
  {
    sku: 'A1A-002', name: 'ECOWASH', category: 'interiores', categoryLabel: 'INTERIORES',
    price: 120, stock: 10, presentation: '1L',
    description: 'Limpiador de Tapicerías en Seco. Para salas de tela, piel, vestiduras de auto, colchones y alfombras. No requiere agua.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=634'
  },
  {
    sku: 'A1A-003', name: 'H2L', category: 'interiores', categoryLabel: 'INTERIORES',
    price: 130, stock: 10, presentation: '600ml',
    description: 'Hidratador y Acondicionador de Piel. Deja tus asientos suaves e hidratados, evitando cuarteaduras. Sin ser graso, sin manchar prendas, con aroma agradable.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=767'
  },
  // === RINES Y LLANTAS ===
  {
    sku: 'A1A-004', name: 'RESTORED RIM', category: 'rines_llantas', categoryLabel: 'RINES Y LLANTAS',
    price: 130, stock: 10, presentation: '600ml',
    description: 'Limpiador intensivo para rines. Elimina polvo de balata, sarro y contaminantes. Libre de ácidos. Diluible hasta 1:10. Devuelve el brillo y color a rines de aluminio.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=772'
  },
  {
    sku: 'A1A-005', name: 'SHINE WEATHER PROOF', category: 'rines_llantas', categoryLabel: 'RINES Y LLANTAS',
    price: 150, stock: 10, presentation: '600ml',
    description: 'Abrillantador resistente a condiciones climáticas extremas para rines y llantas. Protección duradera contra agua y polvo.',
    image_url: ''
  },
  {
    sku: 'A1A-006', name: 'SHINE BASE AGUA', category: 'rines_llantas', categoryLabel: 'RINES Y LLANTAS',
    price: 110, stock: 10, presentation: '600ml',
    description: 'Abrillantador base agua para rines y llantas. Fórmula no grasa, brillo natural y duradero.',
    image_url: ''
  },
  // === SHAMPOOS ===
  {
    sku: 'A1A-007', name: 'DARK SIDE', category: 'shampoos', categoryLabel: 'SHAMPOOS',
    price: 130, stock: 10, presentation: '1L',
    description: 'Shampoo de Preparación Alcalino. Limpieza profunda pre-corrección. Elimina residuos de ceras y selladores para preparar la pintura.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=752'
  },
  {
    sku: 'A1A-008', name: 'FOAM ZERO', category: 'shampoos', categoryLabel: 'SHAMPOOS',
    price: 110, stock: 10, presentation: '1L',
    description: 'Shampoo pH Neutro de alto poder limpiador. No agrede ceras ni selladores. Ideal para mantenimiento regular.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=750'
  },
  {
    sku: 'A1A-009', name: 'ACTIVE FOAM CERA', category: 'shampoos', categoryLabel: 'SHAMPOOS',
    price: 110, stock: 10, presentation: '1L',
    description: 'Nieve de Espuma con Cera y Teflón. Limpia y protege en un solo paso. Genera abundante espuma activa para contacto seguro con la pintura.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=754'
  },
  {
    sku: 'A1A-010', name: 'FOAM 12', category: 'shampoos', categoryLabel: 'SHAMPOOS',
    price: 130, stock: 10, presentation: '1L',
    description: 'Shampoo Alcalino de limpieza profunda. Alta dilución, excelente rendimiento. Para vehículos con suciedad intensa.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=751'
  },
  {
    sku: 'A1A-011', name: 'NUDE PAINT', category: 'shampoos', categoryLabel: 'SHAMPOOS',
    price: 110, stock: 10, presentation: '600ml',
    description: 'Descontaminante de Pintura. Elimina partículas de hierro, polvo de balata y contaminantes industriales. Reacción colorimétrica visible.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=771'
  },
  {
    sku: 'A1A-012', name: 'ACTIVE FOAM MOTOR', category: 'shampoos', categoryLabel: 'SHAMPOOS',
    price: 150, stock: 10, presentation: '1L',
    description: 'Espuma Activa Para Motor, Dieléctrico. Limpieza segura del compartimento del motor sin dañar cables ni componentes eléctricos.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=949'
  },
  // === CERÁMICA ===
  {
    sku: 'A1A-013', name: 'SHIELD SiO2', category: 'ceramica', categoryLabel: 'CERÁMICA',
    price: 200, stock: 10, presentation: '1L',
    description: 'Shampoo con SiO2 pH Neutro. Limpia y deposita protección cerámica en cada lavado. Realza el brillo y repele el agua.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=753'
  },
  {
    sku: 'A1A-014', name: 'BOOSTER W2', category: 'ceramica', categoryLabel: 'CERÁMICA',
    price: 190, stock: 10, presentation: '600ml',
    description: 'W2 Booster Ceramic Spray. Sellador híbrido base SiO2 para mantenimiento de protección cerámica. Fácil aplicación, secado rápido.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=765'
  },
  {
    sku: 'A1A-015', name: 'CERÁMICO A2', category: 'ceramica', categoryLabel: 'CERÁMICA',
    price: 1100, stock: 5, presentation: '30ml',
    description: 'Recubrimiento cerámico profesional de larga duración. Protección hasta 2 años. Dureza 9H. Para aplicación profesional en pintura, vidrios y plásticos.',
    image_url: ''
  },
  {
    sku: 'A1A-016', name: 'SHINE PROTECTANT', category: 'ceramica', categoryLabel: 'CERÁMICA',
    price: 250, stock: 10, presentation: '1L',
    description: 'Sellador Híbrido Base SiO2. Protección y brillo de larga duración. Resistente a lavados y condiciones climáticas. Para pintura y plásticos.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=764'
  },
  {
    sku: 'A1A-017', name: 'S2 CERAMIC', category: 'ceramica', categoryLabel: 'CERÁMICA',
    price: 280, stock: 10, presentation: '600ml',
    description: 'Protección cerámica en spray de alta concentración. Aplicación rápida y sencilla. Brillo intenso y efecto hidrofóbico profesional.',
    image_url: ''
  },
  // === CERAS ===
  {
    sku: 'A1A-018', name: 'LAST TOUCH', category: 'ceras', categoryLabel: 'CERAS',
    price: 150, stock: 10, presentation: '600ml',
    description: 'Cera Rápida de Carnauba Atomizable. Brillo profundo y efecto hidrofóbico inmediato. Para toque final perfecto después del lavado.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=950'
  },
  {
    sku: 'A1A-019', name: 'BOOSTER W2', category: 'ceras', categoryLabel: 'CERAS',
    price: 190, stock: 10, presentation: '600ml',
    description: 'Quick Detailer con tecnología booster. Realza el brillo entre lavados. Elimina polvo, huellas y manchas ligeras sin rayar.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=765'
  },
  {
    sku: 'A1A-020', name: 'REUSE', category: 'ceras', categoryLabel: 'CERAS',
    price: 350, stock: 10, presentation: '250g',
    description: 'Cera de Polietileno hecha de envases reciclados. 100% sustentable. Protección y brillo duraderos con conciencia ambiental. Presentación 230g.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=778'
  },
  // === MOLDURAS ===
  {
    sku: 'A1A-021', name: 'SHINE PROTECTANT', category: 'molduras', categoryLabel: 'MOLDURAS',
    price: 150, stock: 10, presentation: '600ml',
    description: 'Abrillantador de Tolvas, Motor y Molduras. Resistente a altas temperaturas, seco al tacto, resistente al agua. Diluible 1:3. Brillo satinado hasta 1 mes.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=768'
  },
  {
    sku: 'A1A-022', name: 'BLACK AGAIN', category: 'molduras', categoryLabel: 'MOLDURAS',
    price: 190, stock: 10, presentation: '600ml',
    description: 'Restaurador de Molduras. Devuelve el negro intenso a plásticos decolorados. Larga duración, resistente al lavado y rayos UV.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=774'
  },
  // === ESPECIALES ===
  {
    sku: 'A1A-023', name: 'NICE AIR', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 110, stock: 10, presentation: 'Spray',
    description: 'Eliminador de olores en spray. Neutraliza malos olores del interior del vehículo. Fragancia fresca duradera.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=773'
  },
  {
    sku: 'A1A-024', name: 'PINGÜINATOR', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 190, stock: 10, presentation: '250ml',
    description: 'Like Fresh Eliminador de Olores en formato concentrado. Para interiores con olores intensos a tabaco, mascotas o humedad.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=773'
  },
  {
    sku: 'A1A-025', name: 'NICE AIR LATA', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 130, stock: 10, presentation: '100g',
    description: 'Eliminador de olores en lata. Formato compacto para uso continuo en el habitáculo. Aroma agradable y duradero.',
    image_url: ''
  },
  {
    sku: 'A1A-026', name: 'SAR', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 150, stock: 10, presentation: '350g',
    description: 'Stop Acid Rain. Eliminador de lluvia ácida y gotas de agua calcáreas en pintura y vidrios. Restaura el brillo sin rayar.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=633'
  },
  {
    sku: 'A1A-027', name: 'CLEAN GLASS', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 140, stock: 10, presentation: '600ml',
    description: 'Limpiador de Vidrios y Cristales. Elimina manchas, suciedad y residuos de vidrios sin dejar rayas ni velos. Vista clara garantizada.',
    image_url: ''
  },
  {
    sku: 'A1A-028', name: 'PADS CLEANER', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 150, stock: 10, presentation: '600ml',
    description: 'Cleaner Pads. Limpia tus pads de pulido sin dañar las espumas. Extiende la vida útil de tus accesorios de pulido.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=775'
  },
  {
    sku: 'A1A-029', name: 'MOON LIGHT', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 190, stock: 10, presentation: '600ml',
    description: 'Quick Detailer Para Wrap, Pintura Mate y PPF. Limpia y protege superficies mate sin generar brillos no deseados. Formulado especialmente para films.',
    image_url: 'https://metalcargarage.com.mx/productos/detalle?id=613'
  },
  {
    sku: 'A1A-030', name: 'METAL POLISH', category: 'especiales', categoryLabel: 'ESPECIALES',
    price: 250, stock: 10, presentation: '—',
    description: 'Polish para metales y cromados. Elimina oxidación, manchas y deja un brillo espejo en superficies metálicas del vehículo.',
    image_url: ''
  }
];

async function seed() {
  try {
    // Verificar si ya hay datos
    const { rows: count } = await pool.query('SELECT COUNT(*) FROM inventory');
    if (parseInt(count[0].count) > 0) {
      console.log(`⚠️  Ya hay ${count[0].count} productos. Limpiando para re-seed...`);
      await pool.query('DELETE FROM inventory');
    }

    let inserted = 0;
    for (const p of catalog) {
      await pool.query(
        `INSERT INTO inventory (sku, name, category, category_label, price, stock, presentation, description, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (sku) DO UPDATE SET
           name=EXCLUDED.name, price=EXCLUDED.price, stock=EXCLUDED.stock,
           description=EXCLUDED.description, image_url=EXCLUDED.image_url, updated_at=NOW()`,
        [p.sku, p.name, p.category, p.categoryLabel, p.price, p.stock, p.presentation, p.description, p.image_url]
      );
      inserted++;
      console.log(`  ✓ ${p.sku} — ${p.name} ($${p.price})`);
    }
    console.log(`\n✅ Seed completo: ${inserted} productos cargados en PostgreSQL`);
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
