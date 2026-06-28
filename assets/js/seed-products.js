// Script para poblar Firestore con productos iniciales
import { db } from './firebase-config.js';
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const products = {
  // DOGGOS
  clasico: {
    category: "doggos",
    name: "Clásico",
    price: 8000,
    description: "Salchicha, pan, papitas",
    emoji: "🌭",
    image: "assets/img/doggos/clasico.jpeg",
    available: true,
    order: 1
  },
  americano: {
    category: "doggos",
    name: "Americano",
    price: 9500,
    description: "Con chili con carne",
    emoji: "🇺🇸",
    image: "assets/img/doggos/americano.jpeg",
    available: true,
    order: 2
  },
  mexicano: {
    category: "doggos",
    name: "Mexicano",
    price: 10000,
    description: "Guacamole, jalapeños, cebolla",
    emoji: "🌶️",
    image: "assets/img/doggos/mexicano.jpeg",
    available: true,
    order: 3
  },
  bacon: {
    category: "doggos",
    name: "Bacon",
    price: 10500,
    description: "Con tiras de bacon",
    emoji: "🥓",
    image: "assets/img/doggos/bacon.jpeg",
    available: true,
    order: 4
  },
  veggie: {
    category: "doggos",
    name: "Veggie",
    price: 9000,
    description: "Salchicha vegetal, aguacate",
    emoji: "🌱",
    image: "assets/img/doggos/veggie.jpeg",
    available: true,
    order: 5
  },
  hawaiano: {
    category: "doggos",
    name: "Hawaiano",
    price: 9500,
    description: "Piña, jamón, queso",
    emoji: "🍍",
    image: "assets/img/doggos/hawaiano.jpeg",
    available: true,
    order: 6
  },

  // EXTRAS
  queso_extra: {
    category: "extras",
    name: "Queso extra",
    price: 1500,
    emoji: "🧀",
    available: true,
    order: 1
  },
  bacon_extra: {
    category: "extras",
    name: "Bacon",
    price: 2000,
    emoji: "🥓",
    available: true,
    order: 2
  },
  jalapenos: {
    category: "extras",
    name: "Jalapeños",
    price: 1000,
    emoji: "🌶️",
    available: true,
    order: 3
  },
  guacamole: {
    category: "extras",
    name: "Guacamole",
    price: 2500,
    emoji: "🥑",
    available: true,
    order: 4
  },
  champinones: {
    category: "extras",
    name: "Champiñones",
    price: 1500,
    emoji: "🍄",
    available: true,
    order: 5
  },
  cebolla_caramelizada: {
    category: "extras",
    name: "Cebolla caramelizada",
    price: 1000,
    emoji: "🧅",
    available: true,
    order: 6
  },
  pimenton_asado: {
    category: "extras",
    name: "Pimentón asado",
    price: 1000,
    emoji: "🫑",
    available: true,
    order: 7
  },
  queso_rallado: {
    category: "extras",
    name: "Queso rallado extra",
    price: 1000,
    emoji: "🧀",
    available: true,
    order: 8
  },

  // BEBIDAS
  refresco: {
    category: "bebidas",
    name: "Refresco",
    price: 2500,
    emoji: "🥤",
    available: true,
    order: 1
  },
  agua: {
    category: "bebidas",
    name: "Agua",
    price: 1500,
    emoji: "💧",
    available: true,
    order: 2
  },
  cerveza: {
    category: "bebidas",
    name: "Cerveza",
    price: 4000,
    emoji: "🍺",
    available: true,
    order: 3
  },
  malteada: {
    category: "bebidas",
    name: "Malteada",
    price: 5000,
    emoji: "🥛",
    available: true,
    order: 4
  },
  jugo_natural: {
    category: "bebidas",
    name: "Jugo natural",
    price: 3000,
    emoji: "🧃",
    available: true,
    order: 5
  },
  limonada: {
    category: "bebidas",
    name: "Limonada",
    price: 2500,
    emoji: "🍋",
    available: true,
    order: 6
  }
};

const config = {
  delivery_fee: {
    fee: 1500,
    enabled: true
  }
};

async function seedDatabase() {
  console.log('🌱 Iniciando carga de productos...');
  
  try {
    // Cargar productos
    for (const [id, data] of Object.entries(products)) {
      await setDoc(doc(db, "products", id), data);
      console.log(`✅ Producto creado: ${data.name}`);
    }

    // Cargar configuración
    for (const [id, data] of Object.entries(config)) {
      await setDoc(doc(db, "config", id), data);
      console.log(`✅ Config creada: ${id}`);
    }

    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('👉 Ve a Firebase Console > Firestore Database para verificar');
  } catch (error) {
    console.error('❌ Error poblando base de datos:', error);
  }
}

// Ejecutar solo una vez
window.seedDatabase = seedDatabase;
console.log('💡 Para poblar la base de datos, ejecuta en consola: seedDatabase()');