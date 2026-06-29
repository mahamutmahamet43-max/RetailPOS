import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const paymentMethods = ["SAHAL", "CASH", "CARD", "ZAAD", "EVC_PLUS"] as const

const categoryData = [
  { name: "Beverages", description: "Carbonated drinks and sodas", color: "#EF4444" },
  { name: "Dairy", description: "Milk, cheese, yogurt and dairy products", color: "#F59E0B" },
  { name: "Bakery", description: "Bread, cakes and pastries", color: "#D97706" },
  { name: "Snacks", description: "Chips, nuts and snack foods", color: "#E97316" },
  { name: "Rice & Pasta", description: "Rice varieties and pasta products", color: "#10B981" },
  { name: "Cooking Oil", description: "Cooking oils and olive oils", color: "#FCD34D" },
  { name: "Sugar & Sweeteners", description: "Sugar and sweetener products", color: "#F472B6" },
  { name: "Tea & Coffee", description: "Hot beverage products", color: "#8B4513" },
  { name: "Bottled Water", description: "Drinking water in various sizes", color: "#3B82F6" },
  { name: "Personal Care", description: "Soap, shampoo and hygiene products", color: "#EC4899" },
  { name: "Cleaning Supplies", description: "Household cleaning products", color: "#6366F1" },
  { name: "Canned Foods", description: "Canned goods and preserved foods", color: "#14B8A6" },
  { name: "Electronics", description: "Batteries, cables and accessories", color: "#8B5CF6" },
  { name: "Stationery", description: "Office and school supplies", color: "#0EA5E9" },
  { name: "Baby Products", description: "Baby care and feeding products", color: "#F43F5E" },
]

const productsByCategory: Record<string, { name: string; costPrice: number; sellingPrice: number; barcode: string; minimumStock: number; unit: string }[]> = {
  Beverages: [
    { name: "Coca-Cola 330ml", costPrice: 0.35, sellingPrice: 0.50, barcode: "2001000100001", minimumStock: 24, unit: "pcs" },
    { name: "Pepsi 330ml", costPrice: 0.33, sellingPrice: 0.45, barcode: "2001000100002", minimumStock: 24, unit: "pcs" },
    { name: "Sprite 330ml", costPrice: 0.32, sellingPrice: 0.45, barcode: "2001000100003", minimumStock: 24, unit: "pcs" },
    { name: "Fanta Orange 330ml", costPrice: 0.32, sellingPrice: 0.45, barcode: "2001000100004", minimumStock: 24, unit: "pcs" },
    { name: "7UP 330ml", costPrice: 0.30, sellingPrice: 0.45, barcode: "2001000100005", minimumStock: 24, unit: "pcs" },
    { name: "Coca-Cola 1.5L", costPrice: 1.00, sellingPrice: 1.50, barcode: "2001000100006", minimumStock: 12, unit: "pcs" },
    { name: "Pepsi 1.5L", costPrice: 0.95, sellingPrice: 1.40, barcode: "2001000100007", minimumStock: 12, unit: "pcs" },
    { name: "Sprite 1.5L", costPrice: 0.90, sellingPrice: 1.35, barcode: "2001000100008", minimumStock: 12, unit: "pcs" },
    { name: "Fanta Orange 1.5L", costPrice: 0.90, sellingPrice: 1.35, barcode: "2001000100009", minimumStock: 12, unit: "pcs" },
    { name: "Miranda 330ml", costPrice: 0.30, sellingPrice: 0.40, barcode: "2001000100010", minimumStock: 24, unit: "pcs" },
  ],
  Dairy: [
    { name: "Fresh Milk 1L", costPrice: 1.20, sellingPrice: 1.80, barcode: "2001000200001", minimumStock: 10, unit: "pcs" },
    { name: "Powdered Milk 400g", costPrice: 3.00, sellingPrice: 4.50, barcode: "2001000200002", minimumStock: 10, unit: "pcs" },
    { name: "Yogurt 1L", costPrice: 1.50, sellingPrice: 2.20, barcode: "2001000200003", minimumStock: 10, unit: "pcs" },
    { name: "Yogurt Drink 200ml", costPrice: 0.50, sellingPrice: 0.80, barcode: "2001000200004", minimumStock: 20, unit: "pcs" },
    { name: "Cheese Slices 200g", costPrice: 2.50, sellingPrice: 3.80, barcode: "2001000200005", minimumStock: 10, unit: "pcs" },
    { name: "Butter 500g", costPrice: 2.00, sellingPrice: 3.20, barcode: "2001000200006", minimumStock: 10, unit: "pcs" },
    { name: "Cream 200ml", costPrice: 1.30, sellingPrice: 2.00, barcode: "2001000200007", minimumStock: 10, unit: "pcs" },
    { name: "Condensed Milk 397g", costPrice: 1.80, sellingPrice: 2.80, barcode: "2001000200008", minimumStock: 10, unit: "pcs" },
    { name: "Ice Cream 1L", costPrice: 2.50, sellingPrice: 4.00, barcode: "2001000200009", minimumStock: 8, unit: "pcs" },
    { name: "Evaporated Milk 410g", costPrice: 1.20, sellingPrice: 1.90, barcode: "2001000200010", minimumStock: 15, unit: "pcs" },
  ],
  Bakery: [
    { name: "White Bread Loaf", costPrice: 0.40, sellingPrice: 0.70, barcode: "2001000300001", minimumStock: 10, unit: "pcs" },
    { name: "Brown Bread Loaf", costPrice: 0.50, sellingPrice: 0.85, barcode: "2001000300002", minimumStock: 10, unit: "pcs" },
    { name: "Croissant 4pk", costPrice: 1.20, sellingPrice: 2.00, barcode: "2001000300003", minimumStock: 8, unit: "pcs" },
    { name: "Doughnut 6pk", costPrice: 1.50, sellingPrice: 2.50, barcode: "2001000300004", minimumStock: 8, unit: "pcs" },
    { name: "Chocolate Cake Slice", costPrice: 1.00, sellingPrice: 1.80, barcode: "2001000300005", minimumStock: 10, unit: "pcs" },
    { name: "Muffin 4pk", costPrice: 1.30, sellingPrice: 2.20, barcode: "2001000300006", minimumStock: 8, unit: "pcs" },
    { name: "Pita Bread 6pk", costPrice: 0.80, sellingPrice: 1.40, barcode: "2001000300007", minimumStock: 10, unit: "pcs" },
    { name: "Bagel 4pk", costPrice: 1.10, sellingPrice: 1.90, barcode: "2001000300008", minimumStock: 8, unit: "pcs" },
    { name: "Cinnamon Roll", costPrice: 0.70, sellingPrice: 1.20, barcode: "2001000300009", minimumStock: 10, unit: "pcs" },
    { name: "Flatbread 5pk", costPrice: 0.90, sellingPrice: 1.50, barcode: "2001000300010", minimumStock: 10, unit: "pcs" },
  ],
  Snacks: [
    { name: "Potato Chips 150g", costPrice: 0.80, sellingPrice: 1.20, barcode: "2001000400001", minimumStock: 20, unit: "pcs" },
    { name: "Tortilla Chips 200g", costPrice: 1.30, sellingPrice: 2.00, barcode: "2001000400002", minimumStock: 15, unit: "pcs" },
    { name: "Roasted Peanuts 100g", costPrice: 0.40, sellingPrice: 0.70, barcode: "2001000400003", minimumStock: 20, unit: "pcs" },
    { name: "Cashew Nuts 150g", costPrice: 2.00, sellingPrice: 3.20, barcode: "2001000400004", minimumStock: 10, unit: "pcs" },
    { name: "Mixed Nuts 200g", costPrice: 2.50, sellingPrice: 3.80, barcode: "2001000400005", minimumStock: 10, unit: "pcs" },
    { name: "Popcorn 100g", costPrice: 0.50, sellingPrice: 0.90, barcode: "2001000400006", minimumStock: 20, unit: "pcs" },
    { name: "Crackers 200g", costPrice: 0.70, sellingPrice: 1.10, barcode: "2001000400007", minimumStock: 15, unit: "pcs" },
    { name: "Pretzels 150g", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001000400008", minimumStock: 15, unit: "pcs" },
    { name: "Rice Cakes 120g", costPrice: 0.80, sellingPrice: 1.30, barcode: "2001000400009", minimumStock: 15, unit: "pcs" },
    { name: "Trail Mix 150g", costPrice: 1.80, sellingPrice: 2.80, barcode: "2001000400010", minimumStock: 10, unit: "pcs" },
  ],
  "Rice & Pasta": [
    { name: "Sona Rice 1kg", costPrice: 1.10, sellingPrice: 1.60, barcode: "2001000500001", minimumStock: 15, unit: "pcs" },
    { name: "Sona Rice 5kg", costPrice: 5.00, sellingPrice: 7.50, barcode: "2001000500002", minimumStock: 10, unit: "pcs" },
    { name: "Sona Rice 10kg", costPrice: 9.50, sellingPrice: 14.00, barcode: "2001000500003", minimumStock: 5, unit: "pcs" },
    { name: "Basmati Rice 1kg", costPrice: 1.80, sellingPrice: 2.80, barcode: "2001000500004", minimumStock: 10, unit: "pcs" },
    { name: "Basmati Rice 5kg", costPrice: 8.50, sellingPrice: 13.00, barcode: "2001000500005", minimumStock: 5, unit: "pcs" },
    { name: "Spaghetti 500g", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001000500006", minimumStock: 20, unit: "pcs" },
    { name: "Macaroni 500g", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001000500007", minimumStock: 20, unit: "pcs" },
    { name: "Penne Pasta 500g", costPrice: 0.70, sellingPrice: 1.10, barcode: "2001000500008", minimumStock: 15, unit: "pcs" },
    { name: "Wheat Flour 2kg", costPrice: 1.50, sellingPrice: 2.30, barcode: "2001000500009", minimumStock: 10, unit: "pcs" },
    { name: "Couscous 500g", costPrice: 0.90, sellingPrice: 1.40, barcode: "2001000500010", minimumStock: 15, unit: "pcs" },
  ],
  "Cooking Oil": [
    { name: "Vegetable Oil 1L", costPrice: 1.80, sellingPrice: 2.80, barcode: "2001000600001", minimumStock: 12, unit: "pcs" },
    { name: "Vegetable Oil 3L", costPrice: 5.00, sellingPrice: 7.50, barcode: "2001000600002", minimumStock: 6, unit: "pcs" },
    { name: "Vegetable Oil 5L", costPrice: 8.00, sellingPrice: 12.00, barcode: "2001000600003", minimumStock: 4, unit: "pcs" },
    { name: "Olive Oil 500ml", costPrice: 4.00, sellingPrice: 6.50, barcode: "2001000600004", minimumStock: 8, unit: "pcs" },
    { name: "Olive Oil 1L", costPrice: 7.50, sellingPrice: 12.00, barcode: "2001000600005", minimumStock: 6, unit: "pcs" },
    { name: "Sunflower Oil 1L", costPrice: 1.60, sellingPrice: 2.50, barcode: "2001000600006", minimumStock: 12, unit: "pcs" },
    { name: "Canola Oil 1L", costPrice: 1.70, sellingPrice: 2.60, barcode: "2001000600007", minimumStock: 12, unit: "pcs" },
    { name: "Coconut Oil 500ml", costPrice: 3.00, sellingPrice: 4.80, barcode: "2001000600008", minimumStock: 8, unit: "pcs" },
    { name: "Sesame Oil 250ml", costPrice: 2.50, sellingPrice: 4.00, barcode: "2001000600009", minimumStock: 8, unit: "pcs" },
    { name: "Palm Oil 2L", costPrice: 3.00, sellingPrice: 4.50, barcode: "2001000600010", minimumStock: 8, unit: "pcs" },
  ],
  "Sugar & Sweeteners": [
    { name: "White Sugar 1kg", costPrice: 0.90, sellingPrice: 1.40, barcode: "2001000700001", minimumStock: 15, unit: "pcs" },
    { name: "White Sugar 5kg", costPrice: 4.00, sellingPrice: 6.00, barcode: "2001000700002", minimumStock: 5, unit: "pcs" },
    { name: "Brown Sugar 1kg", costPrice: 1.10, sellingPrice: 1.70, barcode: "2001000700003", minimumStock: 10, unit: "pcs" },
    { name: "Icing Sugar 500g", costPrice: 0.80, sellingPrice: 1.30, barcode: "2001000700004", minimumStock: 10, unit: "pcs" },
    { name: "Sugar Cubes 200g", costPrice: 0.70, sellingPrice: 1.10, barcode: "2001000700005", minimumStock: 15, unit: "pcs" },
    { name: "Honey 500g", costPrice: 4.00, sellingPrice: 6.50, barcode: "2001000700006", minimumStock: 8, unit: "pcs" },
    { name: "Splenda Sweetener 100pk", costPrice: 3.50, sellingPrice: 5.50, barcode: "2001000700007", minimumStock: 8, unit: "pcs" },
    { name: "Jaggery 500g", costPrice: 1.20, sellingPrice: 1.90, barcode: "2001000700008", minimumStock: 10, unit: "pcs" },
  ],
  "Tea & Coffee": [
    { name: "Black Tea Bags 100pk", costPrice: 1.50, sellingPrice: 2.50, barcode: "2001000800001", minimumStock: 15, unit: "pcs" },
    { name: "Green Tea Bags 50pk", costPrice: 1.80, sellingPrice: 3.00, barcode: "2001000800002", minimumStock: 10, unit: "pcs" },
    { name: "Instant Coffee 200g", costPrice: 4.00, sellingPrice: 6.50, barcode: "2001000800003", minimumStock: 10, unit: "pcs" },
    { name: "Ground Coffee 250g", costPrice: 3.50, sellingPrice: 5.50, barcode: "2001000800004", minimumStock: 8, unit: "pcs" },
    { name: "Coffee Beans 500g", costPrice: 6.00, sellingPrice: 9.50, barcode: "2001000800005", minimumStock: 6, unit: "pcs" },
    { name: "Herbal Tea 20pk", costPrice: 1.20, sellingPrice: 2.00, barcode: "2001000800006", minimumStock: 10, unit: "pcs" },
    { name: "Chai Tea 50pk", costPrice: 1.60, sellingPrice: 2.80, barcode: "2001000800007", minimumStock: 10, unit: "pcs" },
    { name: "Espresso Beans 250g", costPrice: 4.50, sellingPrice: 7.00, barcode: "2001000800008", minimumStock: 6, unit: "pcs" },
    { name: "Decaf Coffee 200g", costPrice: 3.80, sellingPrice: 6.00, barcode: "2001000800009", minimumStock: 8, unit: "pcs" },
    { name: "Earl Grey Tea 25pk", costPrice: 1.40, sellingPrice: 2.30, barcode: "2001000800010", minimumStock: 10, unit: "pcs" },
  ],
  "Bottled Water": [
    { name: "Bottled Water 500ml", costPrice: 0.15, sellingPrice: 0.25, barcode: "2001000900001", minimumStock: 24, unit: "pcs" },
    { name: "Bottled Water 1.5L", costPrice: 0.25, sellingPrice: 0.40, barcode: "2001000900002", minimumStock: 12, unit: "pcs" },
    { name: "Bottled Water 5L", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001000900003", minimumStock: 6, unit: "pcs" },
    { name: "Sparkling Water 500ml", costPrice: 0.50, sellingPrice: 0.80, barcode: "2001000900004", minimumStock: 12, unit: "pcs" },
    { name: "Flavored Water 500ml", costPrice: 0.40, sellingPrice: 0.70, barcode: "2001000900005", minimumStock: 12, unit: "pcs" },
    { name: "Spring Water 10L", costPrice: 1.00, sellingPrice: 1.60, barcode: "2001000900006", minimumStock: 4, unit: "pcs" },
    { name: "Coconut Water 330ml", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001000900007", minimumStock: 12, unit: "pcs" },
    { name: "Vitamin Water 500ml", costPrice: 0.70, sellingPrice: 1.20, barcode: "2001000900008", minimumStock: 10, unit: "pcs" },
  ],
  "Personal Care": [
    { name: "Bath Soap 100g", costPrice: 0.40, sellingPrice: 0.70, barcode: "2001001000001", minimumStock: 20, unit: "pcs" },
    { name: "Shampoo 200ml", costPrice: 1.80, sellingPrice: 3.00, barcode: "2001001000002", minimumStock: 10, unit: "pcs" },
    { name: "Conditioner 200ml", costPrice: 1.80, sellingPrice: 3.00, barcode: "2001001000003", minimumStock: 10, unit: "pcs" },
    { name: "Body Wash 500ml", costPrice: 2.50, sellingPrice: 4.00, barcode: "2001001000004", minimumStock: 8, unit: "pcs" },
    { name: "Hand Sanitizer 100ml", costPrice: 0.80, sellingPrice: 1.40, barcode: "2001001000005", minimumStock: 20, unit: "pcs" },
    { name: "Deodorant 50ml", costPrice: 1.50, sellingPrice: 2.50, barcode: "2001001000006", minimumStock: 12, unit: "pcs" },
    { name: "Toothpaste 100g", costPrice: 1.00, sellingPrice: 1.80, barcode: "2001001000007", minimumStock: 20, unit: "pcs" },
    { name: "Toothbrush", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001001000008", minimumStock: 20, unit: "pcs" },
    { name: "Moisturizer 100ml", costPrice: 2.00, sellingPrice: 3.50, barcode: "2001001000009", minimumStock: 8, unit: "pcs" },
    { name: "Sunscreen 100ml", costPrice: 3.00, sellingPrice: 5.00, barcode: "2001001000010", minimumStock: 8, unit: "pcs" },
  ],
  "Cleaning Supplies": [
    { name: "Laundry Detergent 1kg", costPrice: 2.50, sellingPrice: 4.00, barcode: "2001001100001", minimumStock: 10, unit: "pcs" },
    { name: "Dish Soap 500ml", costPrice: 1.00, sellingPrice: 1.60, barcode: "2001001100002", minimumStock: 15, unit: "pcs" },
    { name: "Bleach 1L", costPrice: 1.20, sellingPrice: 2.00, barcode: "2001001100003", minimumStock: 12, unit: "pcs" },
    { name: "Floor Cleaner 1L", costPrice: 1.30, sellingPrice: 2.20, barcode: "2001001100004", minimumStock: 10, unit: "pcs" },
    { name: "Glass Cleaner 500ml", costPrice: 1.00, sellingPrice: 1.70, barcode: "2001001100005", minimumStock: 12, unit: "pcs" },
    { name: "Multi-Surface Cleaner 750ml", costPrice: 1.50, sellingPrice: 2.50, barcode: "2001001100006", minimumStock: 10, unit: "pcs" },
    { name: "Toilet Cleaner 500ml", costPrice: 1.10, sellingPrice: 1.80, barcode: "2001001100007", minimumStock: 12, unit: "pcs" },
    { name: "Scouring Sponge 5pk", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001001100008", minimumStock: 20, unit: "pcs" },
    { name: "Scouring Powder 500g", costPrice: 0.80, sellingPrice: 1.30, barcode: "2001001100009", minimumStock: 15, unit: "pcs" },
    { name: "Fabric Softener 1L", costPrice: 1.80, sellingPrice: 2.80, barcode: "2001001100010", minimumStock: 10, unit: "pcs" },
  ],
  "Canned Foods": [
    { name: "Canned Tuna 185g", costPrice: 1.20, sellingPrice: 1.90, barcode: "2001001200001", minimumStock: 15, unit: "pcs" },
    { name: "Canned Sardines 125g", costPrice: 0.80, sellingPrice: 1.30, barcode: "2001001200002", minimumStock: 15, unit: "pcs" },
    { name: "Canned Corn 340g", costPrice: 0.90, sellingPrice: 1.50, barcode: "2001001200003", minimumStock: 12, unit: "pcs" },
    { name: "Canned Beans 400g", costPrice: 0.80, sellingPrice: 1.30, barcode: "2001001200004", minimumStock: 15, unit: "pcs" },
    { name: "Canned Tomatoes 400g", costPrice: 0.70, sellingPrice: 1.10, barcode: "2001001200005", minimumStock: 20, unit: "pcs" },
    { name: "Tomato Paste 140g", costPrice: 0.40, sellingPrice: 0.70, barcode: "2001001200006", minimumStock: 25, unit: "pcs" },
    { name: "Canned Soup 400g", costPrice: 1.00, sellingPrice: 1.60, barcode: "2001001200007", minimumStock: 10, unit: "pcs" },
    { name: "Canned Peas 300g", costPrice: 0.70, sellingPrice: 1.10, barcode: "2001001200008", minimumStock: 12, unit: "pcs" },
    { name: "Canned Mushrooms 200g", costPrice: 1.10, sellingPrice: 1.80, barcode: "2001001200009", minimumStock: 10, unit: "pcs" },
    { name: "Canned Fruit Cocktail 400g", costPrice: 1.30, sellingPrice: 2.10, barcode: "2001001200010", minimumStock: 10, unit: "pcs" },
  ],
  Electronics: [
    { name: "AA Batteries 4pk", costPrice: 1.00, sellingPrice: 1.80, barcode: "2001001300001", minimumStock: 15, unit: "pcs" },
    { name: "AAA Batteries 4pk", costPrice: 1.00, sellingPrice: 1.80, barcode: "2001001300002", minimumStock: 15, unit: "pcs" },
    { name: "USB Cable 1m", costPrice: 1.00, sellingPrice: 2.00, barcode: "2001001300003", minimumStock: 10, unit: "pcs" },
    { name: "Phone Charger", costPrice: 2.50, sellingPrice: 4.50, barcode: "2001001300004", minimumStock: 8, unit: "pcs" },
    { name: "Power Bank 10000mAh", costPrice: 8.00, sellingPrice: 14.00, barcode: "2001001300005", minimumStock: 5, unit: "pcs" },
    { name: "Wired Earphones", costPrice: 2.00, sellingPrice: 3.50, barcode: "2001001300006", minimumStock: 10, unit: "pcs" },
    { name: "LED Bulb 10W", costPrice: 1.50, sellingPrice: 2.80, barcode: "2001001300007", minimumStock: 12, unit: "pcs" },
    { name: "Extension Cord 3m", costPrice: 3.00, sellingPrice: 5.00, barcode: "2001001300008", minimumStock: 6, unit: "pcs" },
    { name: "Wired Mouse", costPrice: 3.00, sellingPrice: 5.00, barcode: "2001001300009", minimumStock: 6, unit: "pcs" },
    { name: "Wired Keyboard", costPrice: 5.00, sellingPrice: 8.00, barcode: "2001001300010", minimumStock: 6, unit: "pcs" },
  ],
  Stationery: [
    { name: "Ballpoint Pen 10pk", costPrice: 0.80, sellingPrice: 1.30, barcode: "2001001400001", minimumStock: 15, unit: "pcs" },
    { name: "Pencil 12pk", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001001400002", minimumStock: 15, unit: "pcs" },
    { name: "Eraser", costPrice: 0.15, sellingPrice: 0.30, barcode: "2001001400003", minimumStock: 30, unit: "pcs" },
    { name: "Ruler 30cm", costPrice: 0.20, sellingPrice: 0.40, barcode: "2001001400004", minimumStock: 20, unit: "pcs" },
    { name: "Notebook A5", costPrice: 0.80, sellingPrice: 1.40, barcode: "2001001400005", minimumStock: 15, unit: "pcs" },
    { name: "Exercise Book 80pg", costPrice: 0.40, sellingPrice: 0.70, barcode: "2001001400006", minimumStock: 25, unit: "pcs" },
    { name: "Sticky Notes 100pk", costPrice: 0.60, sellingPrice: 1.00, barcode: "2001001400007", minimumStock: 15, unit: "pcs" },
    { name: "Permanent Marker 4pk", costPrice: 1.00, sellingPrice: 1.70, barcode: "2001001400008", minimumStock: 10, unit: "pcs" },
    { name: "Glue Stick", costPrice: 0.30, sellingPrice: 0.60, barcode: "2001001400009", minimumStock: 20, unit: "pcs" },
    { name: "Scissors", costPrice: 0.80, sellingPrice: 1.40, barcode: "2001001400010", minimumStock: 10, unit: "pcs" },
  ],
  "Baby Products": [
    { name: "Baby Diapers Size 3 30pk", costPrice: 5.00, sellingPrice: 8.00, barcode: "2001001500001", minimumStock: 5, unit: "pcs" },
    { name: "Baby Diapers Size 4 28pk", costPrice: 5.50, sellingPrice: 8.50, barcode: "2001001500002", minimumStock: 5, unit: "pcs" },
    { name: "Baby Wipes 80pk", costPrice: 1.50, sellingPrice: 2.50, barcode: "2001001500003", minimumStock: 10, unit: "pcs" },
    { name: "Baby Oil 200ml", costPrice: 1.80, sellingPrice: 3.00, barcode: "2001001500004", minimumStock: 8, unit: "pcs" },
    { name: "Baby Shampoo 200ml", costPrice: 1.80, sellingPrice: 3.00, barcode: "2001001500005", minimumStock: 8, unit: "pcs" },
    { name: "Baby Lotion 200ml", costPrice: 1.80, sellingPrice: 3.00, barcode: "2001001500006", minimumStock: 8, unit: "pcs" },
    { name: "Baby Powder 200g", costPrice: 1.20, sellingPrice: 2.00, barcode: "2001001500007", minimumStock: 10, unit: "pcs" },
    { name: "Baby Food Jar 120g", costPrice: 1.00, sellingPrice: 1.70, barcode: "2001001500008", minimumStock: 15, unit: "pcs" },
    { name: "Baby Cereal 250g", costPrice: 2.00, sellingPrice: 3.20, barcode: "2001001500009", minimumStock: 10, unit: "pcs" },
    { name: "Baby Bottle 250ml", costPrice: 2.50, sellingPrice: 4.00, barcode: "2001001500010", minimumStock: 8, unit: "pcs" },
  ],
}

const customerData = [
  { firstName: "Hodan", lastName: "Mohamed", phone: "+252612345601" },
  { firstName: "Abdirahman", lastName: "Hassan", phone: "+252612345602" },
  { firstName: "Fartun", lastName: "Ali", phone: "+252612345603" },
  { firstName: "Mohamud", lastName: "Ahmed", phone: "+252612345604" },
  { firstName: "Asha", lastName: "Ibrahim", phone: "+252612345605" },
  { firstName: "Khadar", lastName: "Hussein", phone: "+252612345606" },
  { firstName: "Safiya", lastName: "Omar", phone: "+252612345607" },
  { firstName: "Yusuf", lastName: "Osman", phone: "+252612345608" },
  { firstName: "Maryan", lastName: "Abdullahi", phone: "+252612345609" },
  { firstName: "Hassan", lastName: "Farah", phone: "+252612345610" },
  { firstName: "Amina", lastName: "Nor", phone: "+252612345611" },
  { firstName: "Shukri", lastName: "Abdi", phone: "+252612345612" },
  { firstName: "Ahmed", lastName: "Aden", phone: "+252612345613" },
  { firstName: "Halimo", lastName: "Ismail", phone: "+252612345614" },
  { firstName: "Dahir", lastName: "Ali", phone: "+252612345615" },
  { firstName: "Nasteho", lastName: "Jama", phone: "+252612345616" },
  { firstName: "Abdiweli", lastName: "Mohamed", phone: "+252612345617" },
  { firstName: "Khadijo", lastName: "Salad", phone: "+252612345618" },
  { firstName: "Jamal", lastName: "Hassan", phone: "+252612345619" },
  { firstName: "Rahma", lastName: "Yusuf", phone: "+252612345620" },
  { firstName: "Farhiya", lastName: "Ali", phone: "+252612345621" },
  { firstName: "Mohamed", lastName: "Nur", phone: "+252612345622" },
  { firstName: "Saida", lastName: "Hussein", phone: "+252612345623" },
  { firstName: "Ibrahim", lastName: "Osman", phone: "+252612345624" },
  { firstName: "Zeinab", lastName: "Ahmed", phone: "+252612345625" },
  { firstName: "Abdullahi", lastName: "Abdi", phone: "+252612345626" },
  { firstName: "Siham", lastName: "Farah", phone: "+252612345627" },
  { firstName: "Mohamud", lastName: "Cali", phone: "+252612345628" },
  { firstName: "Fadumo", lastName: "Jama", phone: "+252612345629" },
  { firstName: "Zakaria", lastName: "Ali", phone: "+252612345630" },
]

const supplierData = [
  { name: "Hormuud Trading Co.", phone: "+252612345701", email: "info@hormuudtrade.so", address: "Mogadishu, Somalia" },
  { name: "Bakaaro Wholesalers", phone: "+252612345702", email: "orders@bakaarowholesale.so", address: "Mogadishu, Somalia" },
  { name: "Somalia Beverage Distributors", phone: "+252612345703", email: "info@somalibev.so", address: "Mogadishu, Somalia" },
  { name: "East Africa Dairy Ltd", phone: "+252612345704", email: "sales@eastafricadairy.so", address: "Mogadishu, Somalia" },
  { name: "Golden Grain Importers", phone: "+252612345705", email: "info@goldengrain.so", address: "Mogadishu, Somalia" },
  { name: "AfriOil Industries", phone: "+252612345706", email: "sales@afrioil.so", address: "Mogadishu, Somalia" },
  { name: "Red Sea Electronics", phone: "+252612345707", email: "info@redseaec.so", address: "Mogadishu, Somalia" },
  { name: "City Fresh Bakery Supply", phone: "+252612345708", email: "orders@cityfresh.so", address: "Mogadishu, Somalia" },
  { name: "Global Hygiene Products", phone: "+252612345709", email: "info@globalhygiene.so", address: "Mogadishu, Somalia" },
  { name: "Somali Stationery Mart", phone: "+252612345710", email: "sales@somalistationery.so", address: "Mogadishu, Somalia" },
  { name: "Sahra Baby Products", phone: "+252612345711", email: "info@sahrababy.so", address: "Mogadishu, Somalia" },
  { name: "Canned Goods Intl", phone: "+252612345712", email: "orders@cannedgoodsintl.so", address: "Mogadishu, Somalia" },
  { name: "Shamso Tea & Coffee Ltd", phone: "+252612345713", email: "info@shamsotea.so", address: "Mogadishu, Somalia" },
  { name: "CleanHome Supplies", phone: "+252612345714", email: "sales@cleanhome.so", address: "Mogadishu, Somalia" },
  { name: "Premium Foods Distributor", phone: "+252612345715", email: "info@premiumfoods.so", address: "Mogadishu, Somalia" },
]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generateId(existing: Set<string>): string {
  let id: string
  do {
    id = crypto.randomUUID()
  } while (existing.has(id))
  existing.add(id)
  return id
}

const baseSaleNumber = 1000

export async function POST() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()
  if (!store) return noStoreResponse()

  const storeId = store.id
  const userId = auth.userId
  const existingIds = new Set<string>()

  try {
    const existingData = await Promise.all([
      prisma.inventoryTransaction.count({ where: { storeId } }),
      prisma.saleItem.count({ where: { sale: { storeId } } }),
      prisma.sale.count({ where: { storeId } }),
      prisma.purchaseItem.count({ where: { purchase: { storeId } } }),
      prisma.purchase.count({ where: { storeId } }),
      prisma.product.count({ where: { storeId } }),
      prisma.customer.count({ where: { storeId } }),
      prisma.supplier.count({ where: { storeId } }),
      prisma.category.count({ where: { storeId } }),
      prisma.backup.count({ where: { storeId } }),
    ])
    const total = existingData.reduce((a, b) => a + b, 0)
    if (total > 0) {
      return NextResponse.json(
        { success: false, error: "Store already has data. Please use a fresh account or contact support." },
        { status: 409 }
      )
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { name: "Barwaaqo Supermarket" },
    })

    await prisma.storeSetting.upsert({
      where: { storeId },
      update: { phone: "0907178067", address: "Mogadishu, Somalia", currency: "USD" },
      create: { storeId, phone: "0907178067", address: "Mogadishu, Somalia", currency: "USD", timezone: "Africa/Mogadishu", dateFormat: "MM/DD/YYYY" },
    })

    await prisma.subscription.upsert({
      where: { storeId },
      update: { status: "ACTIVE", plan: "PROFESSIONAL" },
      create: { storeId, plan: "PROFESSIONAL", status: "ACTIVE", startsAt: new Date("2025-01-01"), billingCycle: "MONTHLY" },
    })

    const categories = categoryData.map(c => ({
      id: generateId(existingIds), storeId,
      name: c.name, description: c.description, color: c.color, icon: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    }))
    await prisma.category.createMany({ data: categories })

    const catMap = new Map(categories.map(c => [c.name, c.id]))

    const products = Object.entries(productsByCategory).flatMap(([catName, prods]) => {
      const catId = catMap.get(catName)!
      return prods.map(p => ({
        id: generateId(existingIds), storeId, categoryId: catId,
        name: p.name, barcode: p.barcode, sku: p.barcode,
        costPrice: p.costPrice, sellingPrice: p.sellingPrice,
        stockQuantity: 200, minimumStock: p.minimumStock, unit: p.unit,
        isActive: true, brand: null, image: null, description: null,
        expiryDate: null, isPharmacyItem: false, requiresPrescription: false,
        createdAt: new Date(), updatedAt: new Date(),
      }))
    })
    await prisma.product.createMany({ data: products })

    const productMap = new Map(products.map(p => [p.id, p]))

    const customers = customerData.map((c, i) => ({
      id: generateId(existingIds), storeId,
      customerCode: `CUST-${(1001 + i).toString()}`,
      firstName: c.firstName, lastName: c.lastName,
      phone: c.phone,
      email: `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}@example.com`,
      address: "Mogadishu, Somalia", city: "Mogadishu",
      companyName: null, notes: null,
      creditLimit: randomFloat(50, 500), currentBalance: 0, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    }))
    await prisma.customer.createMany({ data: customers })

    const suppliers = supplierData.map(s => ({
      id: generateId(existingIds), storeId,
      name: s.name, phone: s.phone, email: s.email, address: s.address, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    }))
    await prisma.supplier.createMany({ data: suppliers })

    const supplierIds = suppliers.map(s => s.id)
    const customerIds = customers.map(c => c.id)
    const allProductIds = products.map(p => p.id)

    const purchaseStart = new Date("2025-08-01")
    const purchaseEnd = new Date("2025-09-15")

    const purchases: any[] = []
    const allPurchaseItems: any[] = []
    const invTransactionsPurchase: any[] = []

    let purchaseNum = 100
    for (let i = 0; i < 30; i++) {
      const purId = generateId(existingIds)
      const date = randomDate(purchaseStart, purchaseEnd)
      const invoiceNumber = `PUR-${purchaseNum++}`
      const supplier = randomElement(suppliers)
      const itemCount = randomInt(3, 8)
      let purTotal = 0
      const selectedProducts = new Set<string>()
      const items: typeof allPurchaseItems = []

      for (let j = 0; j < itemCount; j++) {
        let prodId: string
        do { prodId = randomElement(allProductIds) } while (selectedProducts.has(prodId))
        selectedProducts.add(prodId)
        const prod = productMap.get(prodId)!
        const qty = randomInt(10, 60)
        const costPrice = prod.costPrice ?? 0
        purTotal += qty * costPrice
        const itemId = generateId(existingIds)
        items.push({ id: itemId, purchaseId: purId, productId: prodId, productName: prod.name, quantity: qty, costPrice, unitName: prod.unit ?? "pcs", unitConversionFactor: 1, createdAt: date, updatedAt: date })

        const prevStock = prod.stockQuantity
        prod.stockQuantity += qty
        invTransactionsPurchase.push({
          id: generateId(existingIds), storeId, productId: prodId,
          transactionType: "IN", quantity: qty,
          previousStock: prevStock, newStock: prod.stockQuantity,
          reason: `Purchase: ${invoiceNumber}`, reference: invoiceNumber,
          createdBy: userId, purchaseId: purId, createdAt: date,
        })
      }

      purTotal = parseFloat(purTotal.toFixed(2))

      purchases.push({
        id: purId, storeId, supplierId: supplier.id, supplierName: supplier.name, invoiceNumber,
        total: purTotal, notes: null, status: "COMPLETED",
        createdAt: date, updatedAt: date,
      })
      allPurchaseItems.push(...items)
    }
    await prisma.purchase.createMany({ data: purchases })
    await prisma.purchaseItem.createMany({ data: allPurchaseItems })
    await prisma.inventoryTransaction.createMany({ data: invTransactionsPurchase })

    const initialInvTransactions = allProductIds.map(prodId => {
      const prod = productMap.get(prodId)!
      return {
        id: generateId(existingIds), storeId, productId: prodId,
        transactionType: "IN" as const, quantity: prod.stockQuantity,
        previousStock: 0, newStock: prod.stockQuantity,
        reason: "Initial stock", reference: "SEED",
        createdBy: userId, purchaseId: null,
        createdAt: new Date("2025-08-01"),
      }
    })
    await prisma.inventoryTransaction.createMany({ data: initialInvTransactions as any })

    const saleStart = new Date("2025-10-01")
    const saleEnd = new Date("2026-03-28")

    const BATCH_SIZE = 50
    const targetSales = 520

    const saleBatchData: any[] = []

    for (let i = 0; i < targetSales; i++) {
      const saleId = generateId(existingIds)
      const saleNum = baseSaleNumber + i
      const saleNumber = `SALE-${saleNum.toString().padStart(6, "0")}`
      const date = randomDate(saleStart, saleEnd)
      const customerId = Math.random() < 0.7 ? randomElement(customerIds) : null

      const itemCount = randomInt(2, 5)
      let subtotal = 0
      const selectedProducts = new Set<string>()
      const items: any[] = []
      const transactions: any[] = []

      for (let j = 0; j < itemCount; j++) {
        let prodId: string
        do { prodId = randomElement(allProductIds) } while (selectedProducts.has(prodId))
        selectedProducts.add(prodId)

        const prod = productMap.get(prodId)!
        const qty = randomInt(1, 5)
        const unitPrice = prod.sellingPrice
        const costPrice = prod.costPrice
        const itemTotal = parseFloat((qty * unitPrice).toFixed(2))
        subtotal += itemTotal

        items.push({
          id: generateId(existingIds), saleId,
          productId: prodId, productName: prod.name,
          barcode: prod.barcode, quantity: qty,
          unitPrice, costPrice, discount: 0, total: itemTotal,
          unitName: prod.unit ?? "pcs", unitConversionFactor: 1, returnedQuantity: 0,
          createdAt: date, updatedAt: date,
        })

        const prevStock = prod.stockQuantity
        prod.stockQuantity = Math.max(0, prod.stockQuantity - qty)
        transactions.push({
          id: generateId(existingIds), storeId, productId: prodId,
          transactionType: "OUT", quantity: qty,
          previousStock: prevStock, newStock: prod.stockQuantity,
          reason: `Sale: ${saleNumber}`, reference: saleNumber,
          createdBy: userId, purchaseId: null, createdAt: date,
        })
      }

      const saleDiscount = Math.random() < 0.3 ? randomFloat(0.5, 5, 2) : 0
      subtotal = parseFloat(subtotal.toFixed(2))
      const tax = parseFloat(((subtotal - saleDiscount) * 0.05).toFixed(2))
      const grandTotal = parseFloat((subtotal - saleDiscount + tax).toFixed(2))
      const paymentMethod = randomElement(paymentMethods)
      const changeGiven = paymentMethod === "CASH" ? randomFloat(0, 5, 2) : 0
      const amountPaid = parseFloat((grandTotal + changeGiven).toFixed(2))

      saleBatchData.push({
        sale: {
          id: saleId, storeId, customerId, saleNumber,
          subtotal, discount: saleDiscount, tax,
          total: grandTotal, amountPaid, changeGiven,
          paymentMethod, status: "COMPLETED",
          cashierId: userId, createdAt: date,
        },
        items, transactions,
      })
    }

    for (let i = 0; i < saleBatchData.length; i += BATCH_SIZE) {
      const batch = saleBatchData.slice(i, i + BATCH_SIZE)
      await prisma.sale.createMany({ data: batch.map(b => b.sale) })
      await prisma.saleItem.createMany({ data: batch.flatMap(b => b.items) })
      await prisma.inventoryTransaction.createMany({ data: batch.flatMap(b => b.transactions) })
    }

    const stockUpdates = products.map(p => prisma.product.update({
      where: { id: p.id },
      data: { stockQuantity: p.stockQuantity },
    }))
    await prisma.$transaction(stockUpdates)

    const backupData = {
      seedVersion: "1.0", seededAt: new Date().toISOString(),
      summary: {
        categories: categories.length, products: products.length,
        customers: customers.length, suppliers: suppliers.length,
        purchases: purchases.length, purchaseItems: allPurchaseItems.length,
        sales: saleBatchData.length,
        saleItems: saleBatchData.reduce((sum, b) => sum + b.items.length, 0),
        inventoryTransactions: invTransactionsPurchase.length + initialInvTransactions.length + saleBatchData.reduce((sum, b) => sum + b.transactions.length, 0),
      },
    }
    const dataJson = JSON.stringify(backupData)
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `retailpos-demo-backup-${dateStr}.json`
    const size = `${(dataJson.length / 1024).toFixed(2)} KB`

    await prisma.backup.create({
      data: { storeId, filename, data: dataJson, size, status: "completed" },
    })

    logger.info("Demo seed completed", {
      storeId, categories: categories.length, products: products.length,
      customers: customers.length, suppliers: suppliers.length,
      purchases: purchases.length, sales: saleBatchData.length,
    })

    return NextResponse.json({
      success: true,
      message: "Barwaaqo Supermarket demo store seeded successfully!",
      summary: {
        store: "Barwaaqo Supermarket",
        categories: categories.length, products: products.length,
        customers: customers.length, suppliers: suppliers.length,
        purchases: purchases.length, sales: saleBatchData.length,
        backup: filename,
      },
    })
  } catch (error) {
    logger.error("Demo seed failed", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: "Seeding failed. Please try again.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
