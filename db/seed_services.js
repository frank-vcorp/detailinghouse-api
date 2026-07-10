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
    description: 'Paquete completo premium con todos los servicios principales y secundarios.'
  },
  {
    id: 'SRV-002',
    name: 'Paquete Plus',
    price: 1900,
    emoji: '✨',
    category: 'principal',
    description: 'Paquete intermedio con servicios esenciales y algunos secundarios.'
  },
  {
    id: 'SRV-003',
    name: 'Paquete Esencial',
    price: 250,
    emoji: '🧼',
    category: 'principal',
    description: 'Lavado básico con productos premium.'
  },
  {
    id: 'SRV-004',
    name: 'Lavado de motor a vapor',
    price: 500,
    emoji: '⚙️',
    category: 'secundario',
    description: 'Limpieza profunda del motor con vapor a alta presión.'
  },
  {
    id: 'SRV-005',
    name: 'Protección de cristales',
    price: 800,
    emoji: '🛡️',
    category: 'secundario',
    description: 'Aplicación de sellador hidrofóbico en vidrios.'
  },
  {
    id: 'SRV-006',
    name: 'Pulido de faros',
    price: 500,
    emoji: '💡',
    category: 'secundario',
    description: 'Restauración de faros opacos o amarillentos.'
  },
  {
    id: 'SRV-007',
    name: 'Lavado de asientos',
    price: 900,
    emoji: '💺',
    category: 'secundario',
    description: 'Limpieza profunda de tapicería con extracción.'
  },
  {
    id: 'SRV-008',
    name: 'Desinfección de ductos de aire',
    price: 300,
    emoji: '🌬️',
    category: 'secundario',
    description: 'Ozonificación del sistema de aire acondicionado.'
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
        `INSERT INTO services (id, name, price, description, emoji, category, duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           description = EXCLUDED.description,
           emoji = EXCLUDED.emoji,
           category = EXCLUDED.category,
           duration = EXCLUDED.duration,
           updated_at = NOW()`,
        [s.id, s.name, s.price, s.description, s.emoji, s.category, null]
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