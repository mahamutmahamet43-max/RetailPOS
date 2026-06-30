import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'mahamutmahamet43@gmail.com';

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset(arr, min, max) {
  const count = randomBetween(min, max);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ==========================================
// REALISTIC SOMALI DATA
// ==========================================

const CATEGORIES = [
  { name: 'Rice & Grains', color: '#F59E0B', icon: '🌾' },
  { name: 'Cooking Oils', color: '#F97316', icon: '🫒' },
  { name: 'Sugar & Flour', color: '#EAB308', icon: '🍚' },
  { name: 'Pasta & Noodles', color: '#D4A574', icon: '🍝' },
  { name: 'Canned Foods', color: '#6B7280', icon: '🥫' },
  { name: 'Dairy & Eggs', color: '#FCD34D', icon: '🥛' },
  { name: 'Bread & Bakery', color: '#D97706', icon: '🍞' },
  { name: 'Meat & Poultry', color: '#DC2626', icon: '🥩' },
  { name: 'Fish & Seafood', color: '#0EA5E9', icon: '🐟' },
  { name: 'Fresh Produce', color: '#22C55E', icon: '🥬' },
  { name: 'Beverages (Soft Drinks)', color: '#3B82F6', icon: '🥤' },
  { name: 'Water & Juice', color: '#06B6D4', icon: '🧃' },
  { name: 'Tea & Coffee', color: '#8B4513', icon: '☕' },
  { name: 'Spices & Herbs', color: '#A16207', icon: '🌶️' },
  { name: 'Condiments & Sauces', color: '#EF4444', icon: '🫙' },
  { name: 'Snacks & Sweets', color: '#EC4899', icon: '🍫' },
  { name: 'Frozen Foods', color: '#6366F1', icon: '❄️' },
  { name: 'Household Cleaning', color: '#14B8A6', icon: '🧹' },
  { name: 'Personal Care', color: '#A855F7', icon: '🧴' },
  { name: 'Baby Products', color: '#FBCFE8', icon: '👶' },
  { name: 'Stationery', color: '#1D4ED8', icon: '📖' },
  { name: 'Electronics', color: '#0F172A', icon: '🔋' },
  { name: 'Bottled Water', color: '#0284C7', icon: '💧' },
  { name: 'Milk & Yogurt', color: '#E0F2FE', icon: '🥛' },
];

const SOMALI_FIRST_NAMES = [
  'Ahmed', 'Mohamed', 'Hassan', 'Ali', 'Omar', 'Abdullahi', 'Said', 'Ibrahim',
  'Mahamud', 'Yusuf', 'Ismail', 'Abdi', 'Farah', 'Abubakar', 'Nur', 'Jama',
  'Hussein', 'Abdirahman', 'Abdisalan', 'Khalid', 'Amina', 'Fatima', 'Asha',
  'Hawa', 'Khadija', 'Safia', 'Maryam', 'Zahra', 'Halima', 'Fartun', 'Sahra',
  'Naima', 'Ayan', 'Nasteha', 'Ikran', 'Sumaya', 'Hodan', 'Deqa', 'Rahma',
  'Layla', 'Anab', 'Sagal', 'Ilhan', 'Bilan', 'Nasra', 'Ubax', 'Cawo',
  'Guled', 'Samatar', 'Abdinur', 'Mukhtar', 'Yasin', 'Bashir', 'Shafici',
  'Abdullah', 'Rashid', 'Khadar', 'Nuh', 'Jamal', 'Aweys', 'Mahdi', 'Muse',
];

const SOMALI_LAST_NAMES = [
  'Hersi', 'Warsame', 'Osman', 'Mohamud', 'Isse', 'Farah', 'Gelle', 'Duale',
  'Elmi', 'Nur', 'Omar', 'Aden', 'Yusuf', 'Hussein', 'Shire', 'Ibrahim',
  'Mohamed', 'Hassan', 'Ali', 'Ahmed', 'Abdi', 'Said', 'Jama', 'Barre',
  'Dahir', 'Keynan', 'Mire', 'Abokor', 'Ugbaad', 'Dirir', 'Suleiman',
  'Gedi', 'Biyo', 'Indhacade', 'Good', 'Cabdulle', 'Nuur', 'Axmed',
];

const SOMALI_STREETS = [
  'Maka Al Mukarama Road', 'Jidka Airport', 'Wadada Xamar',
  'Jidka Kilometre 4', 'Afgooye Road', 'Industrial Road',
  'Corso Somalia', 'Jidka Lido', 'Wadada Howlwadaag',
  'Wadada Sanca', 'Jidka KM5', 'Wadada Soobe',
  'Shangani Street', 'Hamarweyne', 'Bakaaraha Road',
  'Ceelasha Road', 'Wadada Caddaa', 'Jidka HRC',
];

const SOMALI_DISTRICTS = [
  'Hodan', 'Hawle Wadag', 'Kaxda', 'Hamar Jajab', 'Waberi',
  'Warta Nabadda', 'Yaaqshiid', 'Bondhere', 'Karaan', 'Shangani',
  'Hamarweyne', 'Cabdulqaadir', 'Dayniile', 'Heliwaa', 'Huriwa',
];

const SUPPLIER_NAMES = [
  'Al-Najah Trading Co', 'Barwaqo General Trading', 'Somalia Import Export LLC',
  'Horn of Africa Distributors', 'Red Sea Logistics', 'Gulf Foods Somalia',
  'Sahil Trading Company', 'Golis Wholesalers', 'Puntland Supplies Ltd',
  'Juba River Enterprises', 'Warsame Brothers Trading', 'Hodan Wholesale Goods',
  'Banaadir Trading Corp', 'Afgooye Agro Products', 'Bosaso Maritime Trading',
  'Kismayo General Supplies', 'Berbera Logistics Ltd', 'Sanaag Trading House',
  'Hargeisa Wholesale Market', 'Nugaal Valley Products', 'Shaqalaha Trading',
  'Baraka Enterprises', 'Tawakal General Merchants', 'Asluubta Trading',
];

const PHONE_PREFIXES = ['61', '63', '65', '68', '90', '90', '90'];

function generateSomaliPhone() {
  const prefix = randomChoice(PHONE_PREFIXES);
  const rest = String(randomBetween(100000, 999999));
  return prefix + rest;
}

// ==========================================
// PRODUCT DEFINITIONS (280 products)
// ==========================================

function generateProducts() {
  const products = [];

  // Rice & Grains (12)
  const riceProducts = [
    { name: 'Basmati Rice (1kg)', barcode: '6241000001001', costPrice: 1.80, sellingPrice: 2.50, minStock: 10 },
    { name: 'Basmati Rice (5kg)', barcode: '6241000001018', costPrice: 8.50, sellingPrice: 11.00, minStock: 5 },
    { name: 'Basmati Rice (10kg)', barcode: '6241000001025', costPrice: 16.00, sellingPrice: 21.00, minStock: 3 },
    { name: 'Jasmine Rice (5kg)', barcode: '6241000001032', costPrice: 7.00, sellingPrice: 9.50, minStock: 5 },
    { name: 'Brown Rice (1kg)', barcode: '6241000001049', costPrice: 2.00, sellingPrice: 2.80, minStock: 8 },
    { name: 'White Rice (1kg)', barcode: '6241000001056', costPrice: 1.50, sellingPrice: 2.20, minStock: 15 },
    { name: 'White Rice (5kg)', barcode: '6241000001063', costPrice: 7.00, sellingPrice: 10.00, minStock: 8 },
    { name: 'White Rice (25kg)', barcode: '6241000001070', costPrice: 30.00, sellingPrice: 42.00, minStock: 2 },
    { name: 'Sorghum Grain (1kg)', barcode: '6241000001087', costPrice: 1.20, sellingPrice: 1.80, minStock: 10 },
    { name: 'Corn Flour (1kg)', barcode: '6241000001094', costPrice: 1.00, sellingPrice: 1.50, minStock: 12 },
    { name: 'Corn Flour (5kg)', barcode: '6241000001100', costPrice: 4.50, sellingPrice: 6.50, minStock: 5 },
    { name: 'Oats (500g)', barcode: '6241000001117', costPrice: 2.00, sellingPrice: 2.80, minStock: 8 },
  ];
  for (const p of riceProducts) products.push({ ...p, categoryIndex: 0, unit: 'pcs' });

  // Cooking Oils (8)
  const oilProducts = [
    { name: 'Cooking Oil (1L)', barcode: '6241000002008', costPrice: 2.50, sellingPrice: 3.50, minStock: 12 },
    { name: 'Cooking Oil (3L)', barcode: '6241000002015', costPrice: 7.00, sellingPrice: 9.50, minStock: 8 },
    { name: 'Cooking Oil (5L)', barcode: '6241000002022', costPrice: 11.00, sellingPrice: 15.00, minStock: 5 },
    { name: 'Olive Oil (500ml)', barcode: '6241000002039', costPrice: 4.00, sellingPrice: 5.50, minStock: 6 },
    { name: 'Olive Oil (1L)', barcode: '6241000002046', costPrice: 7.50, sellingPrice: 10.00, minStock: 4 },
    { name: 'Vegetable Oil (1L)', barcode: '6241000002053', costPrice: 2.00, sellingPrice: 2.80, minStock: 15 },
    { name: 'Ghee (500g)', barcode: '6241000002060', costPrice: 3.00, sellingPrice: 4.20, minStock: 8 },
    { name: 'Ghee (1kg)', barcode: '6241000002077', costPrice: 5.50, sellingPrice: 7.50, minStock: 5 },
  ];
  for (const p of oilProducts) products.push({ ...p, categoryIndex: 1, unit: 'pcs' });

  // Sugar & Flour (8)
  const sugarProducts = [
    { name: 'White Sugar (1kg)', barcode: '6241000003005', costPrice: 1.20, sellingPrice: 1.80, minStock: 20 },
    { name: 'White Sugar (5kg)', barcode: '6241000003012', costPrice: 5.50, sellingPrice: 8.00, minStock: 8 },
    { name: 'White Sugar (50kg)', barcode: '6241000003029', costPrice: 50.00, sellingPrice: 70.00, minStock: 1 },
    { name: 'Brown Sugar (1kg)', barcode: '6241000003036', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Wheat Flour (1kg)', barcode: '6241000003043', costPrice: 1.00, sellingPrice: 1.50, minStock: 20 },
    { name: 'Wheat Flour (5kg)', barcode: '6241000003050', costPrice: 4.50, sellingPrice: 6.50, minStock: 8 },
    { name: 'Wheat Flour (25kg)', barcode: '6241000003067', costPrice: 20.00, sellingPrice: 28.00, minStock: 2 },
    { name: 'Maize Flour (2kg)', barcode: '6241000003074', costPrice: 2.00, sellingPrice: 3.00, minStock: 10 },
  ];
  for (const p of sugarProducts) products.push({ ...p, categoryIndex: 2, unit: 'pcs' });

  // Pasta & Noodles (8)
  const pastaProducts = [
    { name: 'Spaghetti (500g)', barcode: '6241000004002', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Spaghetti (1kg)', barcode: '6241000004019', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Macroni (500g)', barcode: '6241000004026', costPrice: 0.70, sellingPrice: 1.10, minStock: 12 },
    { name: 'Penne Pasta (500g)', barcode: '6241000004033', costPrice: 0.90, sellingPrice: 1.30, minStock: 8 },
    { name: 'Indomie Noodles (Pkt)', barcode: '6241000004040', costPrice: 0.30, sellingPrice: 0.50, minStock: 50 },
    { name: 'Indomie Noodles (Box 40pkts)', barcode: '6241000004057', costPrice: 10.00, sellingPrice: 15.00, minStock: 5 },
    { name: 'Instant Noodles (Pkt)', barcode: '6241000004064', costPrice: 0.25, sellingPrice: 0.40, minStock: 50 },
    { name: 'Lasagna Sheets (500g)', barcode: '6241000004071', costPrice: 1.50, sellingPrice: 2.20, minStock: 5 },
  ];
  for (const p of pastaProducts) products.push({ ...p, categoryIndex: 3, unit: 'pcs' });

  // Canned Foods (12)
  const cannedProducts = [
    { name: 'Canned Tuna (150g)', barcode: '6241000005009', costPrice: 1.20, sellingPrice: 1.70, minStock: 15 },
    { name: 'Canned Tuna (400g)', barcode: '6241000005016', costPrice: 2.50, sellingPrice: 3.50, minStock: 10 },
    { name: 'Canned Sardines (125g)', barcode: '6241000005023', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Canned Tomatoes (400g)', barcode: '6241000005030', costPrice: 0.70, sellingPrice: 1.00, minStock: 20 },
    { name: 'Tomato Paste (140g)', barcode: '6241000005047', costPrice: 0.50, sellingPrice: 0.80, minStock: 20 },
    { name: 'Canned Corn (340g)', barcode: '6241000005054', costPrice: 1.00, sellingPrice: 1.50, minStock: 10 },
    { name: 'Canned Peas (300g)', barcode: '6241000005061', costPrice: 0.80, sellingPrice: 1.20, minStock: 10 },
    { name: 'Canned Beans (400g)', barcode: '6241000005078', costPrice: 0.70, sellingPrice: 1.10, minStock: 15 },
    { name: 'Canned Mixed Vegetables (400g)', barcode: '6241000005085', costPrice: 0.90, sellingPrice: 1.30, minStock: 8 },
    { name: 'Canned Fruit Cocktail (400g)', barcode: '6241000005092', costPrice: 1.50, sellingPrice: 2.20, minStock: 8 },
    { name: 'Canned Meat (340g)', barcode: '6241000005108', costPrice: 2.00, sellingPrice: 3.00, minStock: 6 },
    { name: 'Canned Milk (400g)', barcode: '6241000005115', costPrice: 1.50, sellingPrice: 2.20, minStock: 20 },
  ];
  for (const p of cannedProducts) products.push({ ...p, categoryIndex: 4, unit: 'pcs' });

  // Dairy & Eggs (10)
  const dairyProducts = [
    { name: 'Fresh Milk (1L)', barcode: '6241000006006', costPrice: 1.50, sellingPrice: 2.00, minStock: 15 },
    { name: 'Fresh Milk (500ml)', barcode: '6241000006013', costPrice: 0.80, sellingPrice: 1.20, minStock: 20 },
    { name: 'Powdered Milk (400g)', barcode: '6241000006020', costPrice: 3.50, sellingPrice: 5.00, minStock: 10 },
    { name: 'Powdered Milk (2.5kg)', barcode: '6241000006037', costPrice: 18.00, sellingPrice: 25.00, minStock: 3 },
    { name: 'Yogurt (500ml)', barcode: '6241000006044', costPrice: 1.00, sellingPrice: 1.50, minStock: 12 },
    { name: 'Yogurt Drink (200ml)', barcode: '6241000006051', costPrice: 0.40, sellingPrice: 0.60, minStock: 20 },
    { name: 'Eggs (Tray 30)', barcode: '6241000006068', costPrice: 3.50, sellingPrice: 4.50, minStock: 8 },
    { name: 'Eggs (Half Tray 15)', barcode: '6241000006075', costPrice: 1.80, sellingPrice: 2.50, minStock: 10 },
    { name: 'Butter (200g)', barcode: '6241000006082', costPrice: 1.50, sellingPrice: 2.20, minStock: 8 },
    { name: 'Cheese Slices (200g)', barcode: '6241000006099', costPrice: 2.50, sellingPrice: 3.50, minStock: 6 },
  ];
  for (const p of dairyProducts) products.push({ ...p, categoryIndex: 5, unit: 'pcs' });

  // Bread & Bakery (6)
  const breadProducts = [
    { name: 'White Bread (Large)', barcode: '6241000007003', costPrice: 0.50, sellingPrice: 0.80, minStock: 15 },
    { name: 'White Bread (Small)', barcode: '6241000007010', costPrice: 0.30, sellingPrice: 0.50, minStock: 20 },
    { name: 'Somali Bread (Rooti)', barcode: '6241000007027', costPrice: 0.40, sellingPrice: 0.60, minStock: 20 },
    { name: 'Pita Bread (Pack)', barcode: '6241000007034', costPrice: 0.60, sellingPrice: 1.00, minStock: 10 },
    { name: 'Croissant (Pack)', barcode: '6241000007041', costPrice: 1.00, sellingPrice: 1.50, minStock: 8 },
    { name: 'Cake Slice', barcode: '6241000007058', costPrice: 0.80, sellingPrice: 1.20, minStock: 5 },
  ];
  for (const p of breadProducts) products.push({ ...p, categoryIndex: 6, unit: 'pcs' });

  // Meat & Poultry (8)
  const meatProducts = [
    { name: 'Goat Meat (1kg)', barcode: '6241000008000', costPrice: 5.00, sellingPrice: 7.00, minStock: 5 },
    { name: 'Beef (1kg)', barcode: '6241000008017', costPrice: 4.50, sellingPrice: 6.50, minStock: 5 },
    { name: 'Chicken Whole (1kg)', barcode: '6241000008024', costPrice: 3.50, sellingPrice: 5.00, minStock: 6 },
    { name: 'Chicken Breast (1kg)', barcode: '6241000008031', costPrice: 4.00, sellingPrice: 5.50, minStock: 5 },
    { name: 'Camel Meat (1kg)', barcode: '6241000008048', costPrice: 5.50, sellingPrice: 7.50, minStock: 4 },
    { name: 'Liver (500g)', barcode: '6241000008055', costPrice: 2.00, sellingPrice: 3.00, minStock: 5 },
    { name: 'Mutton (1kg)', barcode: '6241000008062', costPrice: 5.50, sellingPrice: 7.50, minStock: 4 },
    { name: 'Sausages (400g)', barcode: '6241000008079', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
  ];
  for (const p of meatProducts) products.push({ ...p, categoryIndex: 7, unit: 'kg' });

  // Fish & Seafood (6)
  const fishProducts = [
    { name: 'Fresh Fish (1kg)', barcode: '6241000009007', costPrice: 3.00, sellingPrice: 4.50, minStock: 5 },
    { name: 'Tuna Steak (500g)', barcode: '6241000009014', costPrice: 2.50, sellingPrice: 3.50, minStock: 5 },
    { name: 'Dried Fish (500g)', barcode: '6241000009021', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
    { name: 'Shrimp (500g)', barcode: '6241000009038', costPrice: 4.00, sellingPrice: 5.50, minStock: 4 },
    { name: 'Lobster (500g)', barcode: '6241000009045', costPrice: 8.00, sellingPrice: 12.00, minStock: 2 },
    { name: 'Crab (500g)', barcode: '6241000009052', costPrice: 3.50, sellingPrice: 5.00, minStock: 3 },
  ];
  for (const p of fishProducts) products.push({ ...p, categoryIndex: 8, unit: 'kg' });

  // Fresh Produce (18)
  const produceProducts = [
    { name: 'Bananas (1 bunch)', barcode: '6241000010003', costPrice: 0.50, sellingPrice: 0.80, minStock: 15 },
    { name: 'Tomatoes (1kg)', barcode: '6241000010010', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Onions (1kg)', barcode: '6241000010027', costPrice: 0.60, sellingPrice: 1.00, minStock: 20 },
    { name: 'Potatoes (1kg)', barcode: '6241000010034', costPrice: 0.50, sellingPrice: 0.80, minStock: 20 },
    { name: 'Garlic (250g)', barcode: '6241000010041', costPrice: 0.80, sellingPrice: 1.20, minStock: 10 },
    { name: 'Ginger (250g)', barcode: '6241000010058', costPrice: 0.50, sellingPrice: 0.80, minStock: 10 },
    { name: 'Lettuce', barcode: '6241000010065', costPrice: 0.40, sellingPrice: 0.60, minStock: 10 },
    { name: 'Cucumber', barcode: '6241000010072', costPrice: 0.30, sellingPrice: 0.50, minStock: 12 },
    { name: 'Carrots (1kg)', barcode: '6241000010089', costPrice: 0.60, sellingPrice: 0.90, minStock: 10 },
    { name: 'Green Peppers (500g)', barcode: '6241000010096', costPrice: 0.80, sellingPrice: 1.20, minStock: 8 },
    { name: 'Lemons (1kg)', barcode: '6241000010102', costPrice: 0.80, sellingPrice: 1.20, minStock: 10 },
    { name: 'Avocado', barcode: '6241000010119', costPrice: 0.50, sellingPrice: 0.80, minStock: 8 },
    { name: 'Mangoes (1kg)', barcode: '6241000010126', costPrice: 1.00, sellingPrice: 1.50, minStock: 8 },
    { name: 'Watermelon', barcode: '6241000010133', costPrice: 1.50, sellingPrice: 2.50, minStock: 5 },
    { name: 'Oranges (1kg)', barcode: '6241000010140', costPrice: 0.80, sellingPrice: 1.20, minStock: 10 },
    { name: 'Dates (500g)', barcode: '6241000010157', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
    { name: 'Green Bananas (1kg)', barcode: '6241000010164', costPrice: 0.40, sellingPrice: 0.60, minStock: 10 },
    { name: 'Pumpkin (1kg)', barcode: '6241000010171', costPrice: 0.50, sellingPrice: 0.80, minStock: 6 },
  ];
  for (const p of produceProducts) products.push({ ...p, categoryIndex: 9, unit: 'kg' });

  // Beverages / Soft Drinks (14)
  const drinkProducts = [
    { name: 'Coca Cola (330ml)', barcode: '6241000011000', costPrice: 0.40, sellingPrice: 0.60, minStock: 30 },
    { name: 'Coca Cola (1.5L)', barcode: '6241000011017', costPrice: 0.80, sellingPrice: 1.20, minStock: 20 },
    { name: 'Coca Cola (2L)', barcode: '6241000011024', costPrice: 1.00, sellingPrice: 1.50, minStock: 15 },
    { name: 'Fanta Orange (330ml)', barcode: '6241000011031', costPrice: 0.40, sellingPrice: 0.60, minStock: 20 },
    { name: 'Fanta Orange (1.5L)', barcode: '6241000011048', costPrice: 0.80, sellingPrice: 1.20, minStock: 12 },
    { name: 'Sprite (330ml)', barcode: '6241000011055', costPrice: 0.40, sellingPrice: 0.60, minStock: 20 },
    { name: 'Sprite (1.5L)', barcode: '6241000011062', costPrice: 0.80, sellingPrice: 1.20, minStock: 12 },
    { name: 'Pepsi (330ml)', barcode: '6241000011079', costPrice: 0.40, sellingPrice: 0.60, minStock: 20 },
    { name: '7Up (330ml)', barcode: '6241000011086', costPrice: 0.40, sellingPrice: 0.60, minStock: 15 },
    { name: 'Mirinda (330ml)', barcode: '6241000011093', costPrice: 0.40, sellingPrice: 0.60, minStock: 15 },
    { name: 'Mountain Dew (330ml)', barcode: '6241000011109', costPrice: 0.40, sellingPrice: 0.60, minStock: 12 },
    { name: 'Energy Drink (250ml)', barcode: '6241000011116', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Energy Drink (473ml)', barcode: '6241000011123', costPrice: 1.50, sellingPrice: 2.00, minStock: 10 },
    { name: 'Soda Can Mix (Pack 6)', barcode: '6241000011130', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
  ];
  for (const p of drinkProducts) products.push({ ...p, categoryIndex: 10, unit: 'pcs' });

  // Water & Juice (10)
  const waterJuiceProducts = [
    { name: 'Bottled Water (500ml)', barcode: '6241000012007', costPrice: 0.20, sellingPrice: 0.30, minStock: 50 },
    { name: 'Bottled Water (1.5L)', barcode: '6241000012014', costPrice: 0.30, sellingPrice: 0.50, minStock: 30 },
    { name: 'Bottled Water (5L)', barcode: '6241000012021', costPrice: 0.60, sellingPrice: 1.00, minStock: 15 },
    { name: 'Mixed Fruit Juice (1L)', barcode: '6241000012038', costPrice: 1.00, sellingPrice: 1.50, minStock: 12 },
    { name: 'Orange Juice (1L)', barcode: '6241000012045', costPrice: 1.20, sellingPrice: 1.80, minStock: 12 },
    { name: 'Mango Juice (1L)', barcode: '6241000012052', costPrice: 1.20, sellingPrice: 1.80, minStock: 10 },
    { name: 'Apple Juice (1L)', barcode: '6241000012069', costPrice: 1.30, sellingPrice: 1.80, minStock: 10 },
    { name: 'Tropical Juice (1L)', barcode: '6241000012076', costPrice: 1.20, sellingPrice: 1.70, minStock: 8 },
    { name: 'Tamarind Juice (500ml)', barcode: '6241000012083', costPrice: 0.80, sellingPrice: 1.20, minStock: 10 },
    { name: 'Grape Juice (1L)', barcode: '6241000012090', costPrice: 1.50, sellingPrice: 2.00, minStock: 8 },
  ];
  for (const p of waterJuiceProducts) products.push({ ...p, categoryIndex: 11, unit: 'pcs' });

  // Water (dedicated bottled water) (4)
  const waterOnly = [
    { name: 'Bottled Water (6-Pack)', barcode: '6241000013004', costPrice: 1.00, sellingPrice: 1.50, minStock: 10 },
    { name: 'Bottled Water (12-Pack)', barcode: '6241000013011', costPrice: 1.80, sellingPrice: 2.50, minStock: 5 },
    { name: 'Mineral Water (750ml)', barcode: '6241000013028', costPrice: 0.50, sellingPrice: 0.80, minStock: 20 },
    { name: 'Sparkling Water (330ml)', barcode: '6241000013035', costPrice: 0.60, sellingPrice: 0.90, minStock: 12 },
  ];
  for (const p of waterOnly) products.push({ ...p, categoryIndex: 22, unit: 'pcs' });

  // Tea & Coffee (10)
  const teaProducts = [
    { name: 'Somali Tea (100g)', barcode: '6241000014001', costPrice: 1.00, sellingPrice: 1.50, minStock: 15 },
    { name: 'Black Tea (100g)', barcode: '6241000014018', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Black Tea (250g)', barcode: '6241000014025', costPrice: 1.80, sellingPrice: 2.50, minStock: 10 },
    { name: 'Green Tea (100g)', barcode: '6241000014032', costPrice: 1.20, sellingPrice: 1.70, minStock: 10 },
    { name: 'Instant Coffee (100g)', barcode: '6241000014049', costPrice: 2.50, sellingPrice: 3.50, minStock: 8 },
    { name: 'Instant Coffee (200g)', barcode: '6241000014056', costPrice: 4.50, sellingPrice: 6.00, minStock: 5 },
    { name: 'Ground Coffee (250g)', barcode: '6241000014063', costPrice: 3.00, sellingPrice: 4.50, minStock: 8 },
    { name: 'Coffee Beans (500g)', barcode: '6241000014070', costPrice: 5.00, sellingPrice: 7.00, minStock: 4 },
    { name: 'Cardamom (50g)', barcode: '6241000014087', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Tea Bags (Pack 100)', barcode: '6241000014094', costPrice: 2.00, sellingPrice: 2.80, minStock: 10 },
  ];
  for (const p of teaProducts) products.push({ ...p, categoryIndex: 12, unit: 'pcs' });

  // Spices & Herbs (12)
  const spiceProducts = [
    { name: 'Cumin (100g)', barcode: '6241000015001', costPrice: 0.80, sellingPrice: 1.20, minStock: 10 },
    { name: 'Coriander Powder (100g)', barcode: '6241000015018', costPrice: 0.60, sellingPrice: 1.00, minStock: 10 },
    { name: 'Turmeric Powder (100g)', barcode: '6241000015025', costPrice: 0.70, sellingPrice: 1.10, minStock: 10 },
    { name: 'Paprika (100g)', barcode: '6241000015032', costPrice: 0.80, sellingPrice: 1.20, minStock: 8 },
    { name: 'Black Pepper (100g)', barcode: '6241000015049', costPrice: 1.00, sellingPrice: 1.50, minStock: 10 },
    { name: 'Salt (1kg)', barcode: '6241000015056', costPrice: 0.30, sellingPrice: 0.50, minStock: 25 },
    { name: 'Salt (500g)', barcode: '6241000015063', costPrice: 0.20, sellingPrice: 0.30, minStock: 20 },
    { name: 'Mixed Spice (100g)', barcode: '6241000015070', costPrice: 1.00, sellingPrice: 1.50, minStock: 8 },
    { name: 'Cinnamon Sticks (50g)', barcode: '6241000015087', costPrice: 0.80, sellingPrice: 1.20, minStock: 8 },
    { name: 'Bay Leaves (20g)', barcode: '6241000015094', costPrice: 0.50, sellingPrice: 0.80, minStock: 10 },
    { name: 'Curry Powder (100g)', barcode: '6241000015100', costPrice: 0.60, sellingPrice: 1.00, minStock: 10 },
    { name: 'Nutmeg (50g)', barcode: '6241000015117', costPrice: 1.00, sellingPrice: 1.50, minStock: 6 },
  ];
  for (const p of spiceProducts) products.push({ ...p, categoryIndex: 13, unit: 'pcs' });

  // Condiments & Sauces (10)
  const sauceProducts = [
    { name: 'Tomato Ketchup (300ml)', barcode: '6241000016000', costPrice: 0.80, sellingPrice: 1.20, minStock: 12 },
    { name: 'Tomato Ketchup (1L)', barcode: '6241000016017', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
    { name: 'Mayonnaise (300ml)', barcode: '6241000016024', costPrice: 1.20, sellingPrice: 1.80, minStock: 10 },
    { name: 'Mayonnaise (500ml)', barcode: '6241000016031', costPrice: 2.00, sellingPrice: 2.80, minStock: 8 },
    { name: 'Mustard Sauce (200ml)', barcode: '6241000016048', costPrice: 0.80, sellingPrice: 1.20, minStock: 8 },
    { name: 'Chili Sauce (200ml)', barcode: '6241000016055', costPrice: 0.60, sellingPrice: 1.00, minStock: 10 },
    { name: 'Soy Sauce (200ml)', barcode: '6241000016062', costPrice: 0.80, sellingPrice: 1.20, minStock: 8 },
    { name: 'Cooking Vinegar (500ml)', barcode: '6241000016079', costPrice: 0.50, sellingPrice: 0.80, minStock: 10 },
    { name: 'Salad Dressing (250ml)', barcode: '6241000016086', costPrice: 1.20, sellingPrice: 1.80, minStock: 6 },
    { name: 'Hot Sauce (150ml)', barcode: '6241000016093', costPrice: 0.80, sellingPrice: 1.20, minStock: 10 },
  ];
  for (const p of sauceProducts) products.push({ ...p, categoryIndex: 14, unit: 'pcs' });

  // Snacks & Sweets (14)
  const snackProducts = [
    { name: 'Potato Chips (Small)', barcode: '6241000017009', costPrice: 0.30, sellingPrice: 0.50, minStock: 30 },
    { name: 'Potato Chips (Large)', barcode: '6241000017016', costPrice: 0.60, sellingPrice: 1.00, minStock: 20 },
    { name: 'Tortilla Chips (200g)', barcode: '6241000017023', costPrice: 0.80, sellingPrice: 1.20, minStock: 12 },
    { name: 'Chocolate Bar (50g)', barcode: '6241000017030', costPrice: 0.60, sellingPrice: 1.00, minStock: 25 },
    { name: 'Chocolate Bar (100g)', barcode: '6241000017047', costPrice: 1.20, sellingPrice: 1.80, minStock: 15 },
    { name: 'Chewing Gum (Pack)', barcode: '6241000017054', costPrice: 0.30, sellingPrice: 0.50, minStock: 30 },
    { name: 'Candy (Bag 200g)', barcode: '6241000017061', costPrice: 0.50, sellingPrice: 0.80, minStock: 20 },
    { name: 'Biscuits (200g)', barcode: '6241000017078', costPrice: 0.60, sellingPrice: 1.00, minStock: 20 },
    { name: 'Biscuits (400g)', barcode: '6241000017085', costPrice: 1.20, sellingPrice: 1.80, minStock: 12 },
    { name: 'Cookies (200g)', barcode: '6241000017092', costPrice: 1.00, sellingPrice: 1.50, minStock: 12 },
    { name: 'Wafers (150g)', barcode: '6241000017108', costPrice: 0.60, sellingPrice: 1.00, minStock: 15 },
    { name: 'Peanuts (200g)', barcode: '6241000017115', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Sunflower Seeds (100g)', barcode: '6241000017122', costPrice: 0.40, sellingPrice: 0.60, minStock: 15 },
    { name: 'Popcorn (100g)', barcode: '6241000017139', costPrice: 0.50, sellingPrice: 0.80, minStock: 12 },
  ];
  for (const p of snackProducts) products.push({ ...p, categoryIndex: 15, unit: 'pcs' });

  // Frozen Foods (10)
  const frozenProducts = [
    { name: 'Frozen Chicken Wings (1kg)', barcode: '6241000018006', costPrice: 3.00, sellingPrice: 4.50, minStock: 6 },
    { name: 'Frozen Fish Fillet (500g)', barcode: '6241000018013', costPrice: 2.50, sellingPrice: 3.50, minStock: 5 },
    { name: 'Frozen Vegetables (500g)', barcode: '6241000018020', costPrice: 1.20, sellingPrice: 1.80, minStock: 8 },
    { name: 'Frozen French Fries (1kg)', barcode: '6241000018037', costPrice: 1.80, sellingPrice: 2.50, minStock: 6 },
    { name: 'Frozen Pizza', barcode: '6241000018044', costPrice: 2.50, sellingPrice: 3.50, minStock: 5 },
    { name: 'Ice Cream (1L)', barcode: '6241000018051', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
    { name: 'Ice Cream (500ml)', barcode: '6241000018068', costPrice: 1.20, sellingPrice: 1.80, minStock: 10 },
    { name: 'Frozen Samosas (Pack 10)', barcode: '6241000018075', costPrice: 1.50, sellingPrice: 2.50, minStock: 6 },
    { name: 'Frozen Spring Rolls (Pack 10)', barcode: '6241000018082', costPrice: 1.50, sellingPrice: 2.50, minStock: 6 },
    { name: 'Frozen Meatballs (500g)', barcode: '6241000018099', costPrice: 2.00, sellingPrice: 3.00, minStock: 5 },
  ];
  for (const p of frozenProducts) products.push({ ...p, categoryIndex: 16, unit: 'pcs' });

  // Household Cleaning (12)
  const cleaningProducts = [
    { name: 'Dish Soap (500ml)', barcode: '6241000019003', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Dish Soap (1L)', barcode: '6241000019010', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Laundry Detergent (500g)', barcode: '6241000019027', costPrice: 1.50, sellingPrice: 2.00, minStock: 12 },
    { name: 'Laundry Detergent (1kg)', barcode: '6241000019034', costPrice: 2.50, sellingPrice: 3.50, minStock: 10 },
    { name: 'Fabric Softener (1L)', barcode: '6241000019041', costPrice: 1.80, sellingPrice: 2.50, minStock: 8 },
    { name: 'Bleach (1L)', barcode: '6241000019058', costPrice: 0.80, sellingPrice: 1.20, minStock: 12 },
    { name: 'All-Purpose Cleaner (500ml)', barcode: '6241000019065', costPrice: 1.00, sellingPrice: 1.50, minStock: 10 },
    { name: 'Floor Cleaner (1L)', barcode: '6241000019072', costPrice: 1.20, sellingPrice: 1.80, minStock: 10 },
    { name: 'Glass Cleaner (500ml)', barcode: '6241000019089', costPrice: 1.00, sellingPrice: 1.50, minStock: 8 },
    { name: 'Sponge (Pack 3)', barcode: '6241000019096', costPrice: 0.50, sellingPrice: 0.80, minStock: 15 },
    { name: 'Trash Bags (Pack 20)', barcode: '6241000019102', costPrice: 1.00, sellingPrice: 1.50, minStock: 12 },
    { name: 'Insect Spray', barcode: '6241000019119', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
  ];
  for (const p of cleaningProducts) products.push({ ...p, categoryIndex: 17, unit: 'pcs' });

  // Personal Care (16)
  const careProducts = [
    { name: 'Soap Bar (Pack 3)', barcode: '6241000020009', costPrice: 0.60, sellingPrice: 1.00, minStock: 20 },
    { name: 'Body Wash (250ml)', barcode: '6241000020016', costPrice: 1.50, sellingPrice: 2.20, minStock: 12 },
    { name: 'Shampoo (200ml)', barcode: '6241000020023', costPrice: 1.50, sellingPrice: 2.00, minStock: 12 },
    { name: 'Shampoo (400ml)', barcode: '6241000020030', costPrice: 2.50, sellingPrice: 3.50, minStock: 8 },
    { name: 'Toothpaste (100g)', barcode: '6241000020047', costPrice: 1.00, sellingPrice: 1.50, minStock: 15 },
    { name: 'Toothbrush', barcode: '6241000020054', costPrice: 0.50, sellingPrice: 0.80, minStock: 20 },
    { name: 'Deodorant (50ml)', barcode: '6241000020061', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Body Lotion (200ml)', barcode: '6241000020078', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Body Lotion (500ml)', barcode: '6241000020085', costPrice: 3.00, sellingPrice: 4.00, minStock: 6 },
    { name: 'Sanitary Pads (Pack 10)', barcode: '6241000020092', costPrice: 1.20, sellingPrice: 1.80, minStock: 15 },
    { name: 'Diapers (Pack 12)', barcode: '6241000020108', costPrice: 3.50, sellingPrice: 5.00, minStock: 8 },
    { name: 'Wet Wipes (Pack 80)', barcode: '6241000020115', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Hair Oil (200ml)', barcode: '6241000020122', costPrice: 1.50, sellingPrice: 2.00, minStock: 8 },
    { name: 'Men\'s Razor (Pack 5)', barcode: '6241000020139', costPrice: 1.00, sellingPrice: 1.50, minStock: 10 },
    { name: 'Hand Sanitizer (100ml)', barcode: '6241000020146', costPrice: 1.00, sellingPrice: 1.50, minStock: 12 },
    { name: 'Tissue Paper (Pack 6)', barcode: '6241000020153', costPrice: 1.50, sellingPrice: 2.20, minStock: 15 },
  ];
  for (const p of careProducts) products.push({ ...p, categoryIndex: 18, unit: 'pcs' });

  // Baby Products (8)
  const babyProducts = [
    { name: 'Baby Formula (400g)', barcode: '6241000021006', costPrice: 5.00, sellingPrice: 7.00, minStock: 5 },
    { name: 'Baby Formula (900g)', barcode: '6241000021013', costPrice: 10.00, sellingPrice: 14.00, minStock: 3 },
    { name: 'Baby Cereal (200g)', barcode: '6241000021020', costPrice: 2.00, sellingPrice: 3.00, minStock: 6 },
    { name: 'Baby Oil (200ml)', barcode: '6241000021037', costPrice: 1.50, sellingPrice: 2.20, minStock: 8 },
    { name: 'Baby Shampoo (200ml)', barcode: '6241000021044', costPrice: 1.50, sellingPrice: 2.20, minStock: 8 },
    { name: 'Baby Lotion (200ml)', barcode: '6241000021051', costPrice: 1.50, sellingPrice: 2.20, minStock: 8 },
    { name: 'Baby Wipes (Pack 80)', barcode: '6241000021068', costPrice: 1.50, sellingPrice: 2.20, minStock: 10 },
    { name: 'Baby Powder (200g)', barcode: '6241000021075', costPrice: 1.20, sellingPrice: 1.80, minStock: 8 },
  ];
  for (const p of babyProducts) products.push({ ...p, categoryIndex: 19, unit: 'pcs' });

  // Stationery (8)
  const stationeryProducts = [
    { name: 'Notebook (200pg)', barcode: '6241000022003', costPrice: 0.80, sellingPrice: 1.20, minStock: 15 },
    { name: 'Pen (Pack 10)', barcode: '6241000022010', costPrice: 0.50, sellingPrice: 0.80, minStock: 20 },
    { name: 'Pencil (Pack 12)', barcode: '6241000022027', costPrice: 0.60, sellingPrice: 1.00, minStock: 15 },
    { name: 'Eraser', barcode: '6241000022034', costPrice: 0.20, sellingPrice: 0.30, minStock: 20 },
    { name: 'Ruler (30cm)', barcode: '6241000022041', costPrice: 0.30, sellingPrice: 0.50, minStock: 12 },
    { name: 'Glue Stick', barcode: '6241000022058', costPrice: 0.30, sellingPrice: 0.50, minStock: 12 },
    { name: 'Colored Markers (Pack 6)', barcode: '6241000022065', costPrice: 1.00, sellingPrice: 1.50, minStock: 8 },
    { name: 'Scotch Tape', barcode: '6241000022072', costPrice: 0.40, sellingPrice: 0.60, minStock: 12 },
  ];
  for (const p of stationeryProducts) products.push({ ...p, categoryIndex: 20, unit: 'pcs' });

  // Electronics (8)
  const electronicsProducts = [
    { name: 'AA Batteries (Pack 4)', barcode: '6241000023000', costPrice: 1.00, sellingPrice: 1.50, minStock: 15 },
    { name: 'AAA Batteries (Pack 4)', barcode: '6241000023017', costPrice: 1.00, sellingPrice: 1.50, minStock: 12 },
    { name: 'Light Bulb (LED)', barcode: '6241000023024', costPrice: 1.50, sellingPrice: 2.50, minStock: 10 },
    { name: 'Extension Cord (3m)', barcode: '6241000023031', costPrice: 2.50, sellingPrice: 3.50, minStock: 6 },
    { name: 'Phone Charger (USB)', barcode: '6241000023048', costPrice: 2.00, sellingPrice: 3.00, minStock: 8 },
    { name: 'Flashlight', barcode: '6241000023055', costPrice: 2.00, sellingPrice: 3.00, minStock: 6 },
    { name: 'Power Bank (10000mAh)', barcode: '6241000023062', costPrice: 8.00, sellingPrice: 12.00, minStock: 3 },
    { name: 'Earphones', barcode: '6241000023079', costPrice: 1.50, sellingPrice: 2.50, minStock: 8 },
  ];
  for (const p of electronicsProducts) products.push({ ...p, categoryIndex: 21, unit: 'pcs' });

  // Milk & Yogurt (extra dairy) (4)
  const extraDairy = [
    { name: 'Fresh Camel Milk (1L)', barcode: '6241000024007', costPrice: 1.50, sellingPrice: 2.20, minStock: 8 },
    { name: 'Flavored Yogurt (150ml)', barcode: '6241000024014', costPrice: 0.40, sellingPrice: 0.60, minStock: 20 },
    { name: 'Cream (200ml)', barcode: '6241000024021', costPrice: 1.00, sellingPrice: 1.50, minStock: 8 },
    { name: 'Margarine (200g)', barcode: '6241000024038', costPrice: 0.60, sellingPrice: 1.00, minStock: 10 },
  ];
  for (const p of extraDairy) products.push({ ...p, categoryIndex: 23, unit: 'pcs' });

  // Extra products to reach 250+ (15 more)
  const extraProducts = [
    // Rice & Grains
    { name: 'Pearl Millet (1kg)', barcode: '6241000025004', costPrice: 1.20, sellingPrice: 1.80, minStock: 8, categoryIndex: 0, unit: 'kg' },
    { name: 'White Millet (1kg)', barcode: '6241000025011', costPrice: 1.00, sellingPrice: 1.50, minStock: 8, categoryIndex: 0, unit: 'kg' },
    { name: 'Couscous (500g)', barcode: '6241000025028', costPrice: 1.50, sellingPrice: 2.20, minStock: 8, categoryIndex: 0, unit: 'pcs' },
    // Beverages
    { name: 'Ginger Ale (330ml)', barcode: '6241000025035', costPrice: 0.50, sellingPrice: 0.80, minStock: 15, categoryIndex: 10, unit: 'pcs' },
    { name: 'Tonic Water (330ml)', barcode: '6241000025042', costPrice: 0.50, sellingPrice: 0.80, minStock: 12, categoryIndex: 10, unit: 'pcs' },
    { name: 'Soda Water (330ml)', barcode: '6241000025059', costPrice: 0.40, sellingPrice: 0.60, minStock: 15, categoryIndex: 10, unit: 'pcs' },
    // Snacks
    { name: 'Mixed Nuts (200g)', barcode: '6241000025066', costPrice: 2.00, sellingPrice: 3.00, minStock: 8, categoryIndex: 15, unit: 'pcs' },
    { name: 'Trail Mix (200g)', barcode: '6241000025073', costPrice: 2.50, sellingPrice: 3.50, minStock: 6, categoryIndex: 15, unit: 'pcs' },
    { name: 'Rice Cakes (Pack)', barcode: '6241000025080', costPrice: 0.80, sellingPrice: 1.20, minStock: 10, categoryIndex: 15, unit: 'pcs' },
    // Personal Care
    { name: 'Sunscreen (100ml)', barcode: '6241000025097', costPrice: 3.00, sellingPrice: 4.50, minStock: 5, categoryIndex: 18, unit: 'pcs' },
    { name: 'Lip Balm', barcode: '6241000025103', costPrice: 0.50, sellingPrice: 0.80, minStock: 15, categoryIndex: 18, unit: 'pcs' },
    { name: 'Nail Polish', barcode: '6241000025110', costPrice: 1.00, sellingPrice: 1.50, minStock: 8, categoryIndex: 18, unit: 'pcs' },
    // Household
    { name: 'Laundry Basket', barcode: '6241000025127', costPrice: 3.00, sellingPrice: 4.50, minStock: 5, categoryIndex: 17, unit: 'pcs' },
    { name: 'Dust Pan & Brush', barcode: '6241000025134', costPrice: 1.50, sellingPrice: 2.20, minStock: 8, categoryIndex: 17, unit: 'pcs' },
    { name: 'Mop', barcode: '6241000025141', costPrice: 2.00, sellingPrice: 3.00, minStock: 6, categoryIndex: 17, unit: 'pcs' },
    // Fresh Produce
    { name: 'Coconut', barcode: '6241000025158', costPrice: 0.80, sellingPrice: 1.20, minStock: 8, categoryIndex: 9, unit: 'pcs' },
    { name: 'Pineapple', barcode: '6241000025165', costPrice: 1.50, sellingPrice: 2.50, minStock: 5, categoryIndex: 9, unit: 'pcs' },
    { name: 'Papaya', barcode: '6241000025172', costPrice: 1.00, sellingPrice: 1.50, minStock: 6, categoryIndex: 9, unit: 'pcs' },
  ];
  for (const p of extraProducts) products.push({ ...p });

  return products;
}

const ALL_PRODUCTS = generateProducts();

// ==========================================
// HELPER: Date generation
// ==========================================

function randomDate(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday/Saturday in Somalia
}

// ==========================================
// MAIN POPULATION LOGIC
// ==========================================

async function main() {
  console.log('=== Barwaaqo Supermarket Population Script ===\n');

  // 1. Find the target user
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    console.error(`ERROR: User with email "${TARGET_EMAIL}" not found in database.`);
    console.error('Please ensure you have registered with this email first.');
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email}, ID: ${user.id})`);

  // 2. Find or create store
  let store = await prisma.store.findFirst({
    where: { ownerId: user.id },
  });

  if (!store) {
    console.log('No store found for user. Creating store...');
    store = await prisma.store.create({
      data: {
        name: 'Barwaaqo Supermarket',
        slug: `barwaaqo-supermarket-${user.id.slice(0, 8)}`,
        ownerId: user.id,
      },
    });
    console.log(`Created store: ${store.name} (${store.id})`);
  } else {
    console.log(`Found existing store: ${store.name} (${store.id})`);

    // Check if store already has data
    const existingCount = await prisma.category.count({ where: { storeId: store.id } });
    if (existingCount > 0) {
      console.log(`\nWARNING: Store already has ${existingCount} categories and likely other data.`);
      console.log('Creating backup and clearing store data...\n');

      // Create backup of existing data
      const existingBackup = {
        store: await prisma.store.findUnique({ where: { id: store.id } }),
        user: await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
        categories: await prisma.category.findMany({ where: { storeId: store.id } }),
        products: await prisma.product.findMany({ where: { storeId: store.id }, include: { units: true } }),
        customers: await prisma.customer.findMany({ where: { storeId: store.id } }),
        suppliers: await prisma.supplier.findMany({ where: { storeId: store.id } }),
        purchases: await prisma.purchase.findMany({ where: { storeId: store.id } }),
        purchaseItems: await prisma.purchaseItem.findMany({ where: { purchase: { storeId: store.id } } }),
        inventory: await prisma.inventoryTransaction.findMany({ where: { storeId: store.id } }),
        sales: await prisma.sale.findMany({ where: { storeId: store.id }, include: { items: true } }),
        storeSettings: await prisma.storeSetting.findMany({ where: { storeId: store.id } }),
      };
      const backupJson = JSON.stringify(existingBackup);
      const backupFilename = `retailpos-backup-existing-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await prisma.backup.create({
        data: {
          storeId: store.id,
          filename: backupFilename,
          data: backupJson,
          size: `${(backupJson.length / 1024).toFixed(2)} KB`,
          status: 'completed',
        },
      });
      console.log(`Existing data backed up as: ${backupFilename}`);
    }
  }

  const storeId = store.id;

  // 3. Delete existing store data in dependency order
  console.log('\nClearing existing store data...');
  await prisma.saleItem.deleteMany({ where: { sale: { storeId } } });
  await prisma.sale.deleteMany({ where: { storeId } });
  await prisma.inventoryTransaction.deleteMany({ where: { storeId } });
  await prisma.purchaseItem.deleteMany({ where: { purchase: { storeId } } });
  await prisma.purchase.deleteMany({ where: { storeId } });
  await prisma.customer.deleteMany({ where: { storeId } });
  await prisma.productUnit.deleteMany({ where: { product: { storeId } } });
  await prisma.product.deleteMany({ where: { storeId } });
  await prisma.category.deleteMany({ where: { storeId } });
  await prisma.supplier.deleteMany({ where: { storeId } });
  await prisma.storeSetting.deleteMany({ where: { storeId } });
  await prisma.backup.deleteMany({ where: { storeId } });
  console.log('Store data cleared.\n');

  // 4. Create store settings
  console.log('Creating store settings...');
  await prisma.storeSetting.create({
    data: {
      storeId,
      address: 'Maka Al Mukarama Road, Km5, Hodan District, Mogadishu, Somalia',
      phone: '0907178067',
      email: TARGET_EMAIL,
      currency: 'USD',
      timezone: 'Africa/Mogadishu',
      dateFormat: 'MM/DD/YYYY',
      lowStockAlert: true,
      salesNotification: true,
      emailNotification: true,
      logoUrl: null,
      twoFactorEnabled: false,
      enablePharmacyModule: false,
    },
  });
  console.log('Store settings created.\n');

  // 5. Create subscription (Professional)
  console.log('Creating subscription...');
  await prisma.subscription.upsert({
    where: { storeId },
    create: {
      storeId,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      startsAt: new Date('2025-06-01'),
      trialEndsAt: new Date('2025-07-01'),
      billingCycle: 'MONTHLY',
    },
    update: {
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
    },
  });
  console.log('Subscription created.\n');

  // 6. Create categories
  console.log(`Creating ${CATEGORIES.length} categories...`);
  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        storeId,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isActive: true,
      },
    });
    categoryMap[cat.name] = created.id;
  }
  console.log(`${CATEGORIES.length} categories created.\n`);

  // 7. Create suppliers
  console.log(`Creating ${SUPPLIER_NAMES.length} suppliers...`);
  const supplierIds = [];
  for (const name of SUPPLIER_NAMES) {
    const supplier = await prisma.supplier.create({
      data: {
        storeId,
        name,
        phone: generateSomaliPhone(),
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@email.so`,
        address: `${randomChoice(SOMALI_STREETS)}, ${randomChoice(SOMALI_DISTRICTS)}, Mogadishu`,
        notes: randomChoice(['Regular supplier', 'Weekly delivery', 'Bi-weekly delivery', 'Cash on delivery', 'Credit account available']),
      },
    });
    supplierIds.push(supplier.id);
  }
  console.log(`${SUPPLIER_NAMES.length} suppliers created.\n`);

  // 8. Create products
  console.log(`Creating ${ALL_PRODUCTS.length} products...`);
  const productRecords = [];
  const categoryNames = CATEGORIES.map(c => c.name);

  for (let i = 0; i < ALL_PRODUCTS.length; i++) {
    const p = ALL_PRODUCTS[i];
    const catName = categoryNames[p.categoryIndex];
    const categoryId = categoryMap[catName];

    const initialStock = randomBetween(
      Math.max(p.minStock * 3, 15),
      Math.max(p.minStock * 10, 50)
    );

    const product = await prisma.product.create({
      data: {
        storeId,
        categoryId,
        name: p.name,
        barcode: p.barcode,
        sku: `SKU-${String(i + 1).padStart(5, '0')}`,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        stockQuantity: initialStock,
        minimumStock: p.minStock,
        unit: p.unit || 'pcs',
        isActive: true,
        image: null,
        brand: randomChoice(['', 'Local Brand', 'Imported', 'Premium', 'Economy', 'Somalia']),
      },
    });
    productRecords.push({ ...product, categoryName: catName });
  }
  console.log(`${ALL_PRODUCTS.length} products created.\n`);

  // 9. Create customers
  console.log('Creating 55 Somali customers...');
  const customerRecords = [];
  const usedPhones = new Set();

  for (let i = 0; i < 55; i++) {
    const firstName = randomChoice(SOMALI_FIRST_NAMES);
    const lastName = randomChoice(SOMALI_LAST_NAMES);
    let phone;
    do {
      phone = generateSomaliPhone();
    } while (usedPhones.has(phone));
    usedPhones.add(phone);

    const customerCode = `CUST-${String(i + 1).padStart(6, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        storeId,
        customerCode,
        firstName,
        lastName,
        phone,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.so`,
        address: `${randomChoice(SOMALI_STREETS)}, ${randomChoice(SOMALI_DISTRICTS)}, Mogadishu`,
        city: 'Mogadishu',
        notes: null,
        creditLimit: randomChoice([0, 0, 0, 0, 20, 50, 100, 200, 500]),
        currentBalance: 0,
        isActive: true,
      },
    });
    customerRecords.push(customer);
  }
  console.log(`${customerRecords.length} customers created.\n`);

  // 10. Create purchases (to establish stock and inventory records)
  console.log('Creating purchase history...');
  const purchaseStart = new Date('2025-12-01');
  const purchaseEnd = new Date('2026-06-25');
  const purchaseRecords = [];
  const usedInvoiceNumbers = new Set();

  // Create ~40 purchases over the period
  const numPurchases = 40;
  for (let pi = 0; pi < numPurchases; pi++) {
    const invoiceNum = `PO-${String(pi + 1).padStart(6, '0')}`;
    usedInvoiceNumbers.add(invoiceNum);

    const purchaseDate = randomDate(purchaseStart, purchaseEnd);
    const supplierId = randomChoice(supplierIds);
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    const numItems = randomBetween(3, 12);
    const purchaseProducts = randomSubset(productRecords, numItems, numItems);

    let total = 0;
    const items = purchaseProducts.map(pp => {
      const qty = randomBetween(3, 30);
      const costPrice = pp.costPrice || (pp.sellingPrice * 0.7);
      const lineTotal = qty * costPrice;
      total += lineTotal;
      return {
        productId: pp.id,
        productName: pp.name,
        quantity: qty,
        costPrice,
        unitName: pp.unit || 'pcs',
        unitConversionFactor: 1,
      };
    });

    // Create purchase as COMPLETED to add stock
    const purchase = await prisma.purchase.create({
      data: {
        storeId,
        invoiceNumber: invoiceNum,
        supplierId,
        supplierName: supplier.name,
        notes: randomChoice(['Monthly stock', 'Weekly order', 'Urgent restock', 'Regular supply', 'Promotional items']),
        total,
        status: 'COMPLETED',
        createdAt: purchaseDate,
        updatedAt: purchaseDate,
      },
    });

    // Create purchase items and inventory transactions
    for (const item of items) {
      await prisma.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          unitName: item.unitName,
          unitConversionFactor: item.unitConversionFactor,
        },
      });

      // Get current stock
      const currentProduct = await prisma.product.findUnique({ where: { id: item.productId } });
      const previousStock = currentProduct.stockQuantity;
      const baseQuantity = Math.round(item.quantity);
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: previousStock + baseQuantity },
      });

      await prisma.inventoryTransaction.create({
        data: {
          transactionType: 'IN',
          quantity: baseQuantity,
          previousStock,
          newStock: previousStock + baseQuantity,
          reason: `Purchase #${invoiceNum}`,
          storeId,
          productId: item.productId,
          createdBy: user.id,
          purchaseId: purchase.id,
          createdAt: purchaseDate,
        },
      });
    }

    purchaseRecords.push({ purchase, items, date: purchaseDate });
  }
  console.log(`${numPurchases} purchases created with stock adjustments.\n`);

  // 11. Create customers with purchase history (add some credit balance)
  for (const customer of customerRecords.slice(0, 30)) {
    const purchaseCount = randomBetween(1, 8);
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        currentBalance: randomFloat(5, 200),
        notes: `${purchaseCount} purchases this year`,
      },
    });
  }

  // 12. Create 700+ sales spread over 6 months
  console.log('Creating 750 sales spread over 6 months...');
  const saleStart = new Date('2026-01-01');
  const saleEnd = new Date('2026-06-28');
  const totalDays = (saleEnd - saleStart) / (1000 * 60 * 60 * 24);
  const salesPerDay = Math.ceil(750 / totalDays);

  const paymentMethods = ['SAHAL', 'SAHAL', 'SAHAL', 'SAHAL', 'SAHAL', 'SAHAL', 'SAHAL',
    'ZAAD', 'EVC_PLUS', 'CASH', 'CASH', 'CARD'];
  const paymentWeights = [7, 1, 1, 1, 1]; // SAHAL=70%, ZAAD=10%, EVC=10%, CASH=5%, CARD=5%

  let salesCreated = 0;
  const saleNumbers = new Set();
  let saleNumCounter = 1;

  // Track stock as we go for sales (we'll batch adjust at the end)
  const stockAdjustments = {};

  for (let dayOffset = 0; dayOffset < Math.ceil(totalDays); dayOffset++) {
    const currentDate = new Date(saleStart);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    // Skip future dates
    if (currentDate > new Date('2026-06-28')) break;

    // Weekend boost: more sales on Friday/Saturday
    const dayMultiplier = isWeekend(currentDate) ? 1.6 : 1.0;
    const dailySales = Math.round(salesPerDay * dayMultiplier * randomFloat(0.7, 1.3));

    // End of month boost (payday effect)
    const endOfMonth = currentDate.getDate() >= 25;
    const monthMultiplier = endOfMonth ? 1.4 : 1.0;
    const finalDailySales = Math.max(1, Math.round(dailySales * monthMultiplier));

    for (let si = 0; si < finalDailySales; si++) {
      if (salesCreated >= 750) break;
      salesCreated++;

      const saleNumber = `SALE-${String(saleNumCounter).padStart(6, '0')}`;
      saleNumCounter++;
      saleNumbers.add(saleNumber);

      // Random time during business hours (6:00 - 22:00)
      const hour = randomBetween(6, 21);
      const minute = randomBetween(0, 59);
      const saleDate = new Date(currentDate);
      saleDate.setHours(hour, minute, randomBetween(0, 59), 0);

      // Select items for this sale (1-8 items)
      const numItems = randomBetween(1, 8);
      const saleProducts = randomSubset(productRecords, numItems, numItems);

      let subtotal = 0;
      const saleItems = [];
      let customerId = null;

      // ~65% of sales have a customer
      if (Math.random() < 0.65) {
        customerId = randomChoice(customerRecords).id;
      }

      for (const sp of saleProducts) {
        const qty = randomBetween(1, Math.min(5, Math.max(1, Math.round(sp.stockQuantity / 20))));
        const unitPrice = sp.sellingPrice;

        // Track stock reduction
        if (!stockAdjustments[sp.id]) stockAdjustments[sp.id] = 0;
        stockAdjustments[sp.id] -= qty;

        const itemTotal = unitPrice * qty;
        subtotal += itemTotal;

        saleItems.push({
          productId: sp.id,
          productName: sp.name,
          barcode: sp.barcode,
          quantity: qty,
          unitPrice,
          costPrice: sp.costPrice,
          discount: 0,
          total: itemTotal,
          unitName: sp.unit || 'pcs',
          unitConversionFactor: 1,
        });
      }

      const discount = salesCreated % 20 === 0 ? randomFloat(0.5, 3.0) : 0;
      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      const total = subtotal - discount + tax;
      const paymentMethod = weightedRandom(
        ['SAHAL', 'ZAAD', 'EVC_PLUS', 'CASH', 'CARD'],
        [7, 1, 1, 1, 1]
      );
      const paid = paymentMethod === 'CASH' ? total + randomFloat(0, 5) : total;
      const changeGiven = paymentMethod === 'CASH' ? Math.max(0, paid - total) : 0;

      await prisma.sale.create({
        data: {
          saleNumber,
          subtotal,
          discount,
          tax,
          total,
          amountPaid: paid,
          changeGiven,
          paymentMethod,
          status: 'COMPLETED',
          storeId,
          customerId,
          cashierId: user.id,
          createdAt: saleDate,
          items: {
            create: saleItems.map(item => ({
              productId: item.productId,
              productName: item.productName,
              barcode: item.barcode,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              discount: item.discount,
              total: item.total,
              unitName: item.unitName,
              unitConversionFactor: item.unitConversionFactor,
            })),
          },
        },
      });
    }
    if (salesCreated >= 750) break;
  }

  console.log(`${salesCreated} sales created.\n`);

  // 13. Apply stock adjustments from sales
  console.log('Applying stock adjustments from sales...');
  for (const [productId, adjustment] of Object.entries(stockAdjustments)) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true, minimumStock: true, name: true },
    });
    if (product) {
      const newStock = Math.max(0, product.stockQuantity + adjustment);
      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      });
    }
  }
  console.log('Stock adjustments applied.\n');

  // 14. Verify some products have low stock or are out of stock
  console.log('Verifying stock levels...');
  const allProducts = await prisma.product.findMany({
    where: { storeId },
    select: { id: true, name: true, stockQuantity: true, minimumStock: true },
    orderBy: { stockQuantity: 'asc' },
  });

  const lowStock = allProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock);
  const outOfStock = allProducts.filter(p => p.stockQuantity === 0);
  console.log(`Products: ${allProducts.length} total, ${lowStock.length} low stock, ${outOfStock.length} out of stock`);

  // 15. Create backup named "Initial Demo Backup"
  console.log('\nCreating "Initial Demo Backup" backup...');
  const backupData = {
    store: await prisma.store.findUnique({ where: { id: storeId } }),
    user: await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    categories: await prisma.category.findMany({ where: { storeId } }),
    products: await prisma.product.findMany({ where: { storeId }, include: { units: true } }),
    customers: await prisma.customer.findMany({ where: { storeId } }),
    suppliers: await prisma.supplier.findMany({ where: { storeId } }),
    purchases: await prisma.purchase.findMany({ where: { storeId } }),
    purchaseItems: await prisma.purchaseItem.findMany({ where: { purchase: { storeId } } }),
    inventory: await prisma.inventoryTransaction.findMany({ where: { storeId } }),
    sales: await prisma.sale.findMany({ where: { storeId }, include: { items: true } }),
    storeSettings: await prisma.storeSetting.findMany({ where: { storeId } }),
  };
  const dataJson = JSON.stringify(backupData);
  await prisma.backup.create({
    data: {
      storeId,
      filename: 'Initial Demo Backup',
      data: dataJson,
      size: `${(dataJson.length / 1024).toFixed(2)} KB`,
      status: 'completed',
    },
  });
  console.log('Backup created successfully.\n');

  // 16. Final summary
  console.log('=== POPULATION COMPLETE ===');
  console.log(`\nStore: Barwaaqo Supermarket`);
  console.log(`User: ${user.email}`);
  console.log(`Categories: ${CATEGORIES.length}`);
  console.log(`Products: ${ALL_PRODUCTS.length}`);
  console.log(`Suppliers: ${SUPPLIER_NAMES.length}`);
  console.log(`Customers: ${customerRecords.length}`);
  console.log(`Purchases: ${purchaseRecords.length}`);
  console.log(`Sales: ${salesCreated}`);

  // Verify data integrity
  console.log('\n=== VERIFICATION ===');
  const counts = await Promise.all([
    prisma.category.count({ where: { storeId } }),
    prisma.product.count({ where: { storeId } }),
    prisma.supplier.count({ where: { storeId } }),
    prisma.customer.count({ where: { storeId } }),
    prisma.purchase.count({ where: { storeId } }),
    prisma.sale.count({ where: { storeId } }),
    prisma.inventoryTransaction.count({ where: { storeId } }),
    prisma.backup.count({ where: { storeId } }),
    prisma.storeSetting.count({ where: { storeId } }),
    prisma.saleItem.count({ where: { sale: { storeId } } }),
    prisma.purchaseItem.count({ where: { purchase: { storeId } } }),
  ]);
  console.log(`  Categories:           ${counts[0]}`);
  console.log(`  Products:             ${counts[1]}`);
  console.log(`  Suppliers:            ${counts[2]}`);
  console.log(`  Customers:            ${counts[3]}`);
  console.log(`  Purchases:            ${counts[4]}`);
  console.log(`  Sales:                ${counts[5]}`);
  console.log(`  Inventory Trans:     ${counts[6]}`);
  console.log(`  Backups:              ${counts[7]}`);
  console.log(`  Store Settings:       ${counts[8]}`);
  console.log(`  Sale Items:           ${counts[9]}`);
  console.log(`  Purchase Items:       ${counts[10]}`);

  // Check that no other users/stores were modified
  const otherUsers = await prisma.user.findMany({
    where: { email: { not: TARGET_EMAIL } },
    select: { id: true, email: true },
  });
  console.log(`\nOther users in database (should be untouched): ${otherUsers.length}`);
  for (const ou of otherUsers.slice(0, 5)) {
    console.log(`  - ${ou.email} (${ou.id})`);
  }

  // Generate estimated revenue report
  const revenue = await prisma.sale.aggregate({
    where: { storeId },
    _sum: { total: true, subtotal: true },
    _avg: { total: true },
  });
  console.log(`\n=== FINANCIAL SUMMARY ===`);
  console.log(`  Total Revenue:      $${revenue._sum.total.toFixed(2)}`);
  console.log(`  Total Subtotal:     $${revenue._sum.subtotal.toFixed(2)}`);
  console.log(`  Average Sale:       $${revenue._avg.total.toFixed(2)}`);

  // Product cost vs selling price analysis
  const costAnalysis = await prisma.product.aggregate({
    where: { storeId },
    _sum: { costPrice: true, sellingPrice: true },
  });
  console.log(`\n  Total Cost Value:   $${(costAnalysis._sum.costPrice || 0).toFixed(2)}`);
  console.log(`  Total Sell Value:   $${costAnalysis._sum.sellingPrice.toFixed(2)}`);

  await prisma.$disconnect();
  console.log('\nDone!');
}

main().catch(async (e) => {
  console.error('Error during population:', e);
  await prisma.$disconnect();
  process.exit(1);
});
