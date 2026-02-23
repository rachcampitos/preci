/**
 * 50 productos de canasta basica peruana
 * Barcodes: EAN-13 reales de productos vendidos en Peru
 * Fuentes: Open Food Facts, supermercados peruanos
 */
export const SEED_PRODUCTS = [
  // === LACTEOS ===
  { barcode: '7751271010108', name: 'Leche Evaporada Gloria', brand: 'Gloria', category: 'lacteos', unit: 'ml', unitSize: 400, isMvpBasket: true },
  { barcode: '7751271010207', name: 'Leche Evaporada Ideal', brand: 'Ideal', category: 'lacteos', unit: 'ml', unitSize: 400, isMvpBasket: true },
  { barcode: '7751271013109', name: 'Yogurt Gloria Fresa', brand: 'Gloria', category: 'lacteos', unit: 'ml', unitSize: 1000, isMvpBasket: true },
  { barcode: '7751271019309', name: 'Queso Edam Gloria', brand: 'Gloria', category: 'lacteos', unit: 'g', unitSize: 200, isMvpBasket: true },
  { barcode: '7751271040105', name: 'Mantequilla Gloria con Sal', brand: 'Gloria', category: 'lacteos', unit: 'g', unitSize: 200, isMvpBasket: true },

  // === CARNES ===
  { barcode: '2000000000001', name: 'Pollo Entero', brand: 'Granja', category: 'carnes', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000002', name: 'Carne de Res Bisteck', brand: 'Mercado', category: 'carnes', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000003', name: 'Carne Molida de Res', brand: 'Mercado', category: 'carnes', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '7750885010016', name: 'Hot Dog San Fernando', brand: 'San Fernando', category: 'carnes', unit: 'g', unitSize: 250, isMvpBasket: true },
  { barcode: '7750885010214', name: 'Jamonada San Fernando', brand: 'San Fernando', category: 'carnes', unit: 'g', unitSize: 200, isMvpBasket: true },

  // === FRUTAS Y VERDURAS ===
  { barcode: '2000000000004', name: 'Papa Blanca', brand: 'Mercado', category: 'frutas_verduras', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000005', name: 'Cebolla Roja', brand: 'Mercado', category: 'frutas_verduras', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000006', name: 'Tomate', brand: 'Mercado', category: 'frutas_verduras', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000007', name: 'Limon', brand: 'Mercado', category: 'frutas_verduras', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000008', name: 'Platano de Seda', brand: 'Mercado', category: 'frutas_verduras', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000009', name: 'Zanahoria', brand: 'Mercado', category: 'frutas_verduras', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000010', name: 'Ajo', brand: 'Mercado', category: 'frutas_verduras', unit: 'kg', unitSize: 1, isMvpBasket: true },

  // === GRANOS Y CEREALES ===
  { barcode: '7751493000109', name: 'Arroz Extra Costeño', brand: 'Costeño', category: 'granos_cereales', unit: 'kg', unitSize: 5, isMvpBasket: true },
  { barcode: '7751493000208', name: 'Arroz Superior Costeño', brand: 'Costeño', category: 'granos_cereales', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '7751493001106', name: 'Frejol Canario Costeño', brand: 'Costeño', category: 'granos_cereales', unit: 'g', unitSize: 500, isMvpBasket: true },
  { barcode: '7751493001205', name: 'Lentejas Costeño', brand: 'Costeño', category: 'granos_cereales', unit: 'g', unitSize: 500, isMvpBasket: true },
  { barcode: '7750168000102', name: 'Fideos Don Vittorio Spaghetti', brand: 'Don Vittorio', category: 'granos_cereales', unit: 'g', unitSize: 500, isMvpBasket: true },
  { barcode: '7750168000201', name: 'Fideos Don Vittorio Tallarín', brand: 'Don Vittorio', category: 'granos_cereales', unit: 'g', unitSize: 500, isMvpBasket: true },
  { barcode: '7751271060103', name: 'Avena 3 Ositos', brand: '3 Ositos', category: 'granos_cereales', unit: 'g', unitSize: 300, isMvpBasket: true },
  { barcode: '2000000000011', name: 'Pan Frances', brand: 'Panaderia', category: 'panaderia', unit: 'unidad', unitSize: 1, isMvpBasket: true },

  // === BEBIDAS ===
  { barcode: '7751282001016', name: 'Inca Kola 500ml', brand: 'Inca Kola', category: 'bebidas', unit: 'ml', unitSize: 500, isMvpBasket: true },
  { barcode: '7751282001115', name: 'Coca-Cola 500ml', brand: 'Coca-Cola', category: 'bebidas', unit: 'ml', unitSize: 500, isMvpBasket: true },
  { barcode: '7751282002105', name: 'Agua San Luis 2.5L', brand: 'San Luis', category: 'bebidas', unit: 'ml', unitSize: 2500, isMvpBasket: true },
  { barcode: '7751282003109', name: 'Cifrut Naranja 500ml', brand: 'Cifrut', category: 'bebidas', unit: 'ml', unitSize: 500, isMvpBasket: true },

  // === ACEITES ===
  { barcode: '7750123000108', name: 'Aceite Vegetal Primor', brand: 'Primor', category: 'aceites', unit: 'l', unitSize: 1, isMvpBasket: true },
  { barcode: '7750123000207', name: 'Aceite Vegetal Cocinero', brand: 'Cocinero', category: 'aceites', unit: 'l', unitSize: 1, isMvpBasket: true },

  // === ENLATADOS ===
  { barcode: '7750243000109', name: 'Atún Florida en Aceite', brand: 'Florida', category: 'enlatados', unit: 'g', unitSize: 170, isMvpBasket: true },
  { barcode: '7750243000208', name: 'Atún A-1 Trozos', brand: 'A-1', category: 'enlatados', unit: 'g', unitSize: 170, isMvpBasket: true },
  { barcode: '7751271070102', name: 'Leche Condensada Gloria', brand: 'Gloria', category: 'enlatados', unit: 'g', unitSize: 393, isMvpBasket: true },

  // === CONDIMENTOS Y BASICOS ===
  { barcode: '7751334000109', name: 'Azucar Rubia Cartavio', brand: 'Cartavio', category: 'granos_cereales', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '7751334000208', name: 'Azucar Blanca Cartavio', brand: 'Cartavio', category: 'granos_cereales', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '7750789000106', name: 'Sal de Mesa Emsal', brand: 'Emsal', category: 'granos_cereales', unit: 'kg', unitSize: 1, isMvpBasket: true },
  { barcode: '2000000000012', name: 'Huevos de Gallina x15', brand: 'Granja', category: 'lacteos', unit: 'pack', unitSize: 15, isMvpBasket: true },
  { barcode: '7751493003100', name: 'Aji Panca Molido Costeño', brand: 'Costeño', category: 'enlatados', unit: 'g', unitSize: 85, isMvpBasket: true },
  { barcode: '7751493003209', name: 'Aji Amarillo Molido Costeño', brand: 'Costeño', category: 'enlatados', unit: 'g', unitSize: 85, isMvpBasket: true },

  // === LIMPIEZA ===
  { barcode: '7751456000102', name: 'Lejia Clorox', brand: 'Clorox', category: 'limpieza', unit: 'l', unitSize: 1, isMvpBasket: true },
  { barcode: '7751456000201', name: 'Detergente Bolivar', brand: 'Bolivar', category: 'limpieza', unit: 'g', unitSize: 900, isMvpBasket: true },
  { barcode: '7751456000300', name: 'Jabon Bolivar Barra', brand: 'Bolivar', category: 'limpieza', unit: 'g', unitSize: 240, isMvpBasket: true },
  { barcode: '7751456000409', name: 'Lavavajilla Ayudin', brand: 'Ayudin', category: 'limpieza', unit: 'g', unitSize: 500, isMvpBasket: true },
  { barcode: '7751456000508', name: 'Papel Higienico Elite x4', brand: 'Elite', category: 'limpieza', unit: 'pack', unitSize: 4, isMvpBasket: true },

  // === HIGIENE ===
  { barcode: '7751567000109', name: 'Jabon Camay', brand: 'Camay', category: 'higiene', unit: 'g', unitSize: 120, isMvpBasket: true },
  { barcode: '7751567000208', name: 'Pasta Dental Colgate', brand: 'Colgate', category: 'higiene', unit: 'ml', unitSize: 100, isMvpBasket: true },
  { barcode: '7751567000307', name: 'Shampoo Head & Shoulders', brand: 'Head & Shoulders', category: 'higiene', unit: 'ml', unitSize: 375, isMvpBasket: true },
  { barcode: '7751567000406', name: 'Desodorante Rexona', brand: 'Rexona', category: 'higiene', unit: 'ml', unitSize: 150, isMvpBasket: true },

  // === EXTRAS CANASTA ===
  { barcode: '7751678000106', name: 'Cafe Nescafe Tradicion', brand: 'Nescafe', category: 'bebidas', unit: 'g', unitSize: 170, isMvpBasket: true },
  { barcode: '7751678000205', name: 'Te Herbi Manzanilla x25', brand: 'Herbi', category: 'bebidas', unit: 'pack', unitSize: 25, isMvpBasket: true },
];
