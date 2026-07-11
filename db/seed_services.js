// db/seed_services.js — Seed de los 8 servicios iniciales DetailingHouse
// Ejecutar: node db/seed_services.js
require('dotenv').config();
const pool = require('./pool');

const services = [
  {
    id: 'SRV-001',
    name: 'Paquete Elite',
    price: 2200,
    emoji: '🚗',
    category: 'principal',
    badge: 'premium',
    description: 'Paquete completo premium con todos los servicios principales y secundarios.',
    prices_json: {
      compacto: 2644,
      sedan: 3245,
      pickup: 3846,
      luxury: null  // null = "Cotización"
    }
  },
  {
    id: 'SRV-002',
    name: 'Paquete Plus',
    price: 1900,
    emoji: '✨',
    category: 'principal',
    badge: 'popular',
    description: 'Paquete intermedio con servicios esenciales y algunos secundarios.',
    prices_json: {
      compacto: 2283,
      sedan: 2884,
      pickup: 3485,
      luxury: null
    }
  },
  {
    id: 'SRV-003',
    name: 'Paquete Esencial',
    price: 250,
    emoji: '🧼',
    category: 'principal',
    badge: 'basic',
    description: 'Lavado básico con productos premium.',
    prices_json: {
      compacto: 300,
      sedan: 370,
      pickup: 440,
      luxury: null
    }
  },
  {
    id: 'SRV-004',
    name: 'Lavado de motor a vapor',
    price: 500,
    emoji: '⚙️',
    category: 'secundario',
    description: 'Limpieza profunda del motor con vapor a alta presión.',
    prices_json: {
      compacto: 601,
      sedan: 601,
      pickup: 601,
      luxury: null
    }
  },
  {
    id: 'SRV-005',
    name: 'Protección de cristales',
    price: 800,
    emoji: '🛡️',
    category: 'secundario',
    description: 'Aplicación de sellador hidrofóbico en vidículos.',
    prices_json: {
      compacto: 961,
      sedan: 961,
      pickup: 961,
      luxury: null
    }
  },
  {
    id: 'SRV-006',
    name: 'Pulido de faros',
    price: 500,
    emoji: '💡',
    category: 'secundario',
    description: 'Restauración de faros opacos o amarillentos.',
    prices_json: {
      compacto: 601,
      sedan: 601,
      pickup: 601,
      luxury: null
    }
  },
  {
    id: 'SRV-007',
    name: 'Lavado de asientos',
    price: 900,
    emoji: '💺',
    category: 'secundario',
    description: 'Limpieza profunda de tapicería con extracción.',
    prices_json: {
      compacto: 1082,
      sedan: 1082,
      pickup: 1082,
      luxury: null
    }
  },
  {
    id: 'SRV-008',
    name: 'Desinfección de ductos de aire',
    price: 300,
    emoji: '🌬️',
    category: 'secundario',
    description: 'Ozonificación del sistema de aire acondicionado.',
    prices_json: {
      compacto: 361,
      sedan: 361,
      pickup: 361,
      luxury: null
    }
  }
];

async function seed() {
  try {
    // Verificar si ya hay servicios
    const { rows: count } = await pool.query('SELECT COUNT(*) FROM services');
    if (parseInt(count[0].count) > 0) {
      console.log(`⚠️  Ya hay ${count[0].count} servicios. Limpiando para re-seed...`);
      await pool.query('DELETE FROM services');
    }

    let inserted = 0;
    for (const s of services) {
      await pool.query(
        `INSERT INTO services (id, name, price, description, emoji, category, duration, prices_json, badge, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           description = EXCLUDED.description,
           emoji = EXCLUDED.emoji,
           category = EXCLUDED.category,
           duration = EXCLUDED.duration,
           prices_json = EXCLUDED.prices_json,
           badge = EXCLUDED.badge,
           image_url = EXCLUDED.image_url,
           updated_at = NOW()`,
        [s.id, s.name, s.price, s.description, s.emoji, s.category, null, JSON.stringify(s.prices_json), s.badge || null, null]
      );
      inserted++;
      console.log(`  ✓ ${s.id} — ${s.name} ($${s.price})`);
    }
    console.log(`\n✅ Seed completo: ${inserted} servicios cargados en PostgreSQL`);
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();