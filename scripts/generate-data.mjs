import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ---------- Helpers ----------
function uuidFromString(input) {
  // UUID deterministic from SHA-256
  const hex = crypto.createHash("sha256").update(input).digest("hex");
  // 8-4-4-4-12
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function toCSV(rows, headers) {
  const lines = [];
  lines.push(headers.join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

// Deterministic pseudo-random in [0,1) from a key (no state)
function rand01(key) {
  const h = crypto.createHash("sha256").update(key).digest();
  // Use first 4 bytes as uint32
  const x = h.readUInt32BE(0);
  return x / 0xffffffff;
}

// ---------- Scenario ----------
const OUT_DIR = path.resolve("data");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const years = [2023, 2024, 2025]; // 3 années (modifie si tu veux)
const months = Array.from({ length: 12 }, (_, i) => i + 1);

// 5 catégories (10 produits chacune)
const categories = [
  { name: "Dermocosmétique", code: "DERMO" },
  { name: "Compléments alimentaires", code: "COMP" },
  { name: "OTC", code: "OTC" },
  { name: "Hygiène & soins", code: "HYGI" },
  { name: "Bébé & maternité", code: "BEBE" },
].map((c) => ({
  id_categorie: uuidFromString(`cat:${c.code}`),
  nom: c.name,
  code: c.code,
}));

// Produits (liste 50)
const productDefs = [
  // Dermo (1-10)
  ["Crème Hydratante Peaux Sensibles 50ml", "DERMO"],
  ["Sérum Vitamine C Éclat 30ml", "DERMO"],
  ["Gel Nettoyant Purifiant 200ml", "DERMO"],
  ["Crème Anti-Âge Nuit 40ml", "DERMO"],
  ["Fluide Matifiant SPF30 50ml", "DERMO"],
  ["Baume Lèvres Réparateur", "DERMO"],
  ["Eau Micellaire Douceur 400ml", "DERMO"],
  ["Crème Mains Nourrissante 75ml", "DERMO"],
  ["Masque Apaisant Aloe Vera", "DERMO"],
  ["Lotion Tonique Hydratante", "DERMO"],

  // OTC (11-20)
  ["Paracétamol 500mg Boîte 16", "OTC"],
  ["Ibuprofène 200mg Boîte 20", "OTC"],
  ["Sirop Toux Sèche 150ml", "OTC"],
  ["Spray Gorge Apaisant", "OTC"],
  ["Pastilles Gorge Menthol", "OTC"],
  ["Spray Nasal Décongestionnant", "OTC"],
  ["Solution Lavage Nasal", "OTC"],
  ["Crème Antalgique Musculaire", "OTC"],
  ["Comprimés Allergie Printemps", "OTC"],
  ["Gel Arnica Chocs & Bleus", "OTC"],

  // Compléments (21-30)
  ["Magnésium + Vitamine B6", "COMP"],
  ["Vitamine D3 1000 UI", "COMP"],
  ["Complexe Immunité", "COMP"],
  ["Oméga 3 Capsules", "COMP"],
  ["Probiotiques Équilibre Intestinal", "COMP"],
  ["Collagène Marin", "COMP"],
  ["Multivitamines Adulte", "COMP"],
  ["Fer + Vitamine C", "COMP"],
  ["Mélatonine Sommeil", "COMP"],
  ["Complexe Articulations", "COMP"],

  // Hygiène (31-40)
  ["Gel Douche Peaux Sensibles", "HYGI"],
  ["Shampooing Usage Fréquent", "HYGI"],
  ["Dentifrice Gencives Sensibles", "HYGI"],
  ["Bain de Bouche Fraîcheur", "HYGI"],
  ["Savon Surgras Dermatologique", "HYGI"],
  ["Déodorant Peaux Sensibles", "HYGI"],
  ["Solution Désinfectante Mains", "HYGI"],
  ["Pansements Assortis", "HYGI"],
  ["Gel Hydroalcoolique 100ml", "HYGI"],
  ["Eau Oxygénée 10 Volumes", "HYGI"],

  // Bébé (41-50)
  ["Lait Infantile 1er Âge", "BEBE"],
  ["Lait Infantile 2ème Âge", "BEBE"],
  ["Liniment Oléo-Calcaire", "BEBE"],
  ["Crème Change Bébé", "BEBE"],
  ["Thermomètre Digital Bébé", "BEBE"],
  ["Sérum Physiologique Bébé", "BEBE"],
  ["Gel Lavant Bébé", "BEBE"],
  ["Sucettes Silicone 0-6 mois", "BEBE"],
  ["Huile Massage Bébé", "BEBE"],
  ["Vitamine D Bébé", "BEBE"],
];

// Stars (selon notre plan)
const starNames = new Set([
  "Paracétamol 500mg Boîte 16",
  "Ibuprofène 200mg Boîte 20",
  "Sirop Toux Sèche 150ml",
  "Spray Nasal Décongestionnant",
  "Crème Hydratante Peaux Sensibles 50ml",
  "Sérum Vitamine C Éclat 30ml",
  "Crème Anti-Âge Nuit 40ml",
  "Magnésium + Vitamine B6",
  "Complexe Immunité",
  "Gel Douche Peaux Sensibles",
]);

// Build products with deterministic IDs, SKUs, base price
const products = productDefs.map(([nom, catCode], idx) => {
  const cat = categories.find((c) => c.code === catCode);
  const id_produit = uuidFromString(`prod:${nom}`);
  const sku = `SKU-${String(idx + 1).padStart(3, "0")}`;
  const marque = `Marque ${catCode}`; // générique
  const isStar = starNames.has(nom);

  // Base price by category + a little deterministic spread
  const baseByCat = {
    OTC: 6.5,
    DERMO: 14.0,
    COMP: 12.0,
    HYGI: 7.0,
    BEBE: 10.0,
  }[catCode];

  const spread = (rand01(`priceSpread:${nom}`) - 0.5) * 0.6; // +/- 0.3
  const base_price = round2(baseByCat * (1 + spread));

  return {
    id_produit,
    nom,
    marque,
    sku,
    id_categorie: cat.id_categorie,
    categorie_code: catCode,
    actif: true,
    base_price,
    tier: isStar ? "STAR" : "NORMAL",
  };
});

// Assign NORMAL products into MID/SMALL based on deterministic ranking to match 25/15
const normals = products.filter((p) => p.tier !== "STAR");
const rankedNormals = normals
  .map((p) => ({ p, r: rand01(`tierRank:${p.nom}`) }))
  .sort((a, b) => a.r - b.r);

rankedNormals.forEach((obj, i) => {
  obj.p.tier = i < 25 ? "MID" : "SMALL";
});

// Seasonality factors by category and month (simple but credible)
function seasonality(catCode, month) {
  // month: 1..12
  const m = month;
  if (catCode === "OTC") {
    // Jan-Feb high, Oct-Nov medium
    if (m === 1 || m === 2) return 1.35;
    if (m === 10 || m === 11) return 1.15;
    return 0.95;
  }
  if (catCode === "DERMO") {
    // May-Aug higher
    if (m >= 5 && m <= 8) return 1.2;
    if (m === 12) return 1.05;
    return 0.95;
  }
  if (catCode === "COMP") {
    // Mar-Apr and Sep-Nov higher
    if (m === 3 || m === 4) return 1.2;
    if (m >= 9 && m <= 11) return 1.15;
    return 0.95;
  }
  if (catCode === "HYGI") {
    // stable, slight Sep bump
    if (m === 9) return 1.08;
    return 1.0;
  }
  if (catCode === "BEBE") {
    // very stable
    return 1.0;
  }
  return 1.0;
}

// Year multipliers (global + category adjustments)
// 2023 base, 2024 growth, 2025 decline (OTC hit)
const yearConfig = {
  2023: { vol: 1.0, price: 1.0, catVol: {} },
  2024: {
    vol: 1.08,
    price: 1.03,
    catVol: { DERMO: 1.12, COMP: 1.15, OTC: 1.05, HYGI: 1.06, BEBE: 1.02 },
  },
  2025: {
    vol: 0.94,
    price: 1.01,
    catVol: { OTC: 0.85, DERMO: 1.0, COMP: 1.03, HYGI: 0.95, BEBE: 1.0 },
  },
};

// Base quantities by tier
function baseQty(tier, productName) {
  const jitter = rand01(`qtyBase:${productName}`) - 0.5; // [-0.5, 0.5)
  if (tier === "STAR") return Math.round(260 + jitter * 60); // ~230-290
  if (tier === "MID") return Math.round(115 + jitter * 50); // ~90-140
  return Math.round(50 + jitter * 40); // ~30-70
}

// Monthly price variation: mild noise + occasional promo dips
function monthlyPrice(product, year, month) {
  const y = yearConfig[year];
  const base = product.base_price * y.price;

  // small monthly drift/noise
  const noise =
    (rand01(`priceNoise:${product.nom}:${year}:${month}`) - 0.5) * 0.04; // +/-2%
  let price = base * (1 + noise);

  // promo probability differs by category
  const promoProb =
    {
      OTC: 0.05,
      DERMO: 0.1,
      COMP: 0.08,
      HYGI: 0.06,
      BEBE: 0.04,
    }[product.categorie_code] ?? 0.06;

  const promoRoll = rand01(`promo:${product.nom}:${year}:${month}`);
  if (promoRoll < promoProb) {
    // promo between -5% and -18%
    const promoDepth =
      0.05 + rand01(`promoDepth:${product.nom}:${year}:${month}`) * 0.13;
    price = price * (1 - promoDepth);
  }

  // keep sane bounds
  price = clamp(price, 1.0, 200.0);
  return round2(price);
}

// Quantity model: base tier × seasonality × year multipliers × light noise
function monthlyQty(product, year, month) {
  const y = yearConfig[year];
  const catMul = y.catVol?.[product.categorie_code] ?? 1.0;

  const s = seasonality(product.categorie_code, month);
  const b = baseQty(product.tier, product.nom);

  const noise =
    (rand01(`qtyNoise:${product.nom}:${year}:${month}`) - 0.5) * 0.2; // +/-10%
  let q = b * s * y.vol * catMul * (1 + noise);

  // ensure int >= 0
  q = Math.max(0, Math.round(q));
  return q;
}

// ---------- Generate CSV data ----------
const categoriesRows = categories.map(({ id_categorie, nom }) => ({
  id_categorie,
  nom,
}));

const productsRows = products.map((p) => ({
  id_produit: p.id_produit,
  nom: p.nom,
  marque: p.marque,
  sku: p.sku,
  id_categorie: p.id_categorie,
  actif: p.actif,
}));

const salesRows = [];
for (const year of years) {
  for (const month of months) {
    for (const product of products) {
      const quantite = monthlyQty(product, year, month);
      const prix_moyen_unitaire = monthlyPrice(product, year, month);

      salesRows.push({
        id_vente_mensuelle: uuidFromString(
          `sale:${product.id_produit}:${year}:${month}`,
        ),
        id_produit: product.id_produit,
        annee: year,
        mois: month,
        quantite,
        prix_moyen_unitaire: prix_moyen_unitaire.toFixed(2),
      });
    }
  }
}

// ---------- Write files ----------
fs.writeFileSync(
  path.join(OUT_DIR, "categories.csv"),
  toCSV(categoriesRows, ["id_categorie", "nom"]),
  "utf-8",
);
fs.writeFileSync(
  path.join(OUT_DIR, "produits.csv"),
  toCSV(productsRows, [
    "id_produit",
    "nom",
    "marque",
    "sku",
    "id_categorie",
    "actif",
  ]),
  "utf-8",
);
fs.writeFileSync(
  path.join(OUT_DIR, "ventes_mensuelles.csv"),
  toCSV(salesRows, [
    "id_vente_mensuelle",
    "id_produit",
    "annee",
    "mois",
    "quantite",
    "prix_moyen_unitaire",
  ]),
  "utf-8",
);

console.log(
  "✅ CSV générés dans /data : categories.csv, produits.csv, ventes_mensuelles.csv",
);
console.log(
  `   ventes_mensuelles.csv: ${salesRows.length} lignes (attendu: 50*36=1800)`,
);
