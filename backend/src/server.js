const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("csv-parse/sync");
const { z } = require("zod");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.resolve(__dirname, "..", "..", "data");

function readCsv(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

// Cache en mémoire
const db = {
  categories: [],
  products: [],
  sales: [],
  productById: new Map(),
  categoryById: new Map(),
};

function loadData() {
  db.categories = readCsv("categories.csv");
  db.products = readCsv("produits.csv");
  db.sales = readCsv("ventes_mensuelles.csv").map((r) => ({
    id_vente_mensuelle: r.id_vente_mensuelle,
    id_produit: r.id_produit,
    annee: Number(r.annee),
    mois: Number(r.mois),
    quantite: Number(r.quantite),
    prix_moyen_unitaire: Number(r.prix_moyen_unitaire),
  }));

  db.productById = new Map(db.products.map((p) => [p.id_produit, p]));
  db.categoryById = new Map(db.categories.map((c) => [c.id_categorie, c]));
}

loadData();

function salesFilter({ year, categoryId }) {
  return db.sales.filter((s) => {
    if (year != null && s.annee !== year) return false;
    if (categoryId) {
      const p = db.productById.get(s.id_produit);
      if (!p || p.id_categorie !== categoryId) return false;
    }
    return true;
  });
}

function sumRevenue(rows) {
  let ca = 0;
  let qty = 0;
  for (const r of rows) {
    ca += r.quantite * r.prix_moyen_unitaire;
    qty += r.quantite;
  }
  return { ca, qty };
}

const YearSchema = z.coerce.number().int().min(2000).max(2100);

// Routes
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    loaded: {
      categories: db.categories.length,
      products: db.products.length,
      sales: db.sales.length,
    },
  });
});

app.get("/meta/years", (req, res) => {
  const years = Array.from(new Set(db.sales.map((s) => s.annee))).sort();
  res.json({ years });
});

app.get("/meta/categories", (req, res) => {
  res.json({ categories: db.categories });
});

app.get("/kpis/yearly", (req, res) => {
  const year = req.query.year ? YearSchema.parse(req.query.year) : null;
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : null;

  const rows = salesFilter({ year, categoryId });
  const { ca, qty } = sumRevenue(rows);
  const prix_moyen_pondere = qty > 0 ? ca / qty : 0;

  res.json({
    scope: { year, categoryId },
    kpis: {
      chiffre_affaires: Math.round(ca * 100) / 100,
      quantite: qty,
      prix_moyen_pondere: Math.round(prix_moyen_pondere * 100) / 100,
    },
  });
});

app.get("/timeseries/revenue", (req, res) => {
  const year = YearSchema.parse(req.query.year);
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : null;

  const rows = salesFilter({ year, categoryId });

  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    ca: 0,
    qty: 0,
  }));

  for (const r of rows) {
    const i = r.mois - 1;
    byMonth[i].ca += r.quantite * r.prix_moyen_unitaire;
    byMonth[i].qty += r.quantite;
  }

  res.json({
    scope: { year, categoryId },
    points: byMonth.map((m) => ({
      mois: m.mois,
      chiffre_affaires: Math.round(m.ca * 100) / 100,
      quantite: m.qty,
      prix_moyen_pondere:
        m.qty > 0 ? Math.round((m.ca / m.qty) * 100) / 100 : 0,
    })),
  });
});

app.get("/analysis/category-contribution", (req, res) => {
  const year = YearSchema.parse(req.query.year);
  const ref = YearSchema.parse(req.query.ref);

  const contributions = db.categories.map((cat) => {
    const rowsY = salesFilter({ year, categoryId: cat.id_categorie });
    const rowsR = salesFilter({ year: ref, categoryId: cat.id_categorie });

    const caY = sumRevenue(rowsY).ca;
    const caR = sumRevenue(rowsR).ca;

    return {
      id_categorie: cat.id_categorie,
      categorie: cat.nom,
      ca_ref: Math.round(caR * 100) / 100,
      ca_year: Math.round(caY * 100) / 100,
      delta: Math.round((caY - caR) * 100) / 100,
    };
  });

  const totalDelta = contributions.reduce((acc, c) => acc + c.delta, 0);

  res.json({
    scope: { year, ref },
    total_delta: Math.round(totalDelta * 100) / 100,
    contributions: contributions
      .map((c) => ({
        ...c,
        share_of_delta:
          totalDelta !== 0
            ? Math.round((c.delta / totalDelta) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
  });
});

// Reload data (quand tu régénères les CSV)
app.post("/admin/reload", (req, res) => {
  loadData();
  res.json({
    ok: true,
    reloaded: {
      categories: db.categories.length,
      products: db.products.length,
      sales: db.sales.length,
    },
  });
});

app.get("/compare/yearly", (req, res) => {
  const year = YearSchema.parse(req.query.year);
  const ref = YearSchema.parse(req.query.ref);
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : null;

  const rowsY = salesFilter({ year, categoryId });
  const rowsR = salesFilter({ year: ref, categoryId });

  const { ca: caY, qty: qtyY } = sumRevenue(rowsY);
  const { ca: caR, qty: qtyR } = sumRevenue(rowsR);

  const pmY = qtyY > 0 ? caY / qtyY : 0;
  const pmR = qtyR > 0 ? caR / qtyR : 0;

  const deltaCA = caY - caR;
  const deltaQty = qtyY - qtyR;
  const deltaPm = pmY - pmR;

  const pct = (a, b) => (b !== 0 ? (a / b) * 100 : 0);

  res.json({
    scope: { year, ref, categoryId },
    year: {
      chiffre_affaires: Math.round(caY * 100) / 100,
      quantite: qtyY,
      prix_moyen_pondere: Math.round(pmY * 100) / 100,
    },
    ref: {
      chiffre_affaires: Math.round(caR * 100) / 100,
      quantite: qtyR,
      prix_moyen_pondere: Math.round(pmR * 100) / 100,
    },
    delta: {
      chiffre_affaires: Math.round(deltaCA * 100) / 100,
      quantite: deltaQty,
      prix_moyen_pondere: Math.round(deltaPm * 100) / 100,
      pct_chiffre_affaires: Math.round(pct(deltaCA, caR) * 100) / 100,
    },
  });
});

app.get("/analysis/price-volume", (req, res) => {
  const year = YearSchema.parse(req.query.year);
  const ref = YearSchema.parse(req.query.ref);
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : null;

  const rowsY = salesFilter({ year, categoryId });
  const rowsR = salesFilter({ year: ref, categoryId });

  const { ca: caY, qty: qtyY } = sumRevenue(rowsY);
  const { ca: caR, qty: qtyR } = sumRevenue(rowsR);

  const pmY = qtyY > 0 ? caY / qtyY : 0;
  const pmR = qtyR > 0 ? caR / qtyR : 0;

  const deltaCA = caY - caR;

  // Décomposition
  const effet_volume = (qtyY - qtyR) * pmR; // volume au prix ref
  const effet_prix = (pmY - pmR) * qtyY; // prix sur volume year
  const effet_mix = deltaCA - effet_volume - effet_prix; // résiduel

  const pct = (a, b) => (b !== 0 ? (a / b) * 100 : 0);

  res.json({
    scope: { year, ref, categoryId },
    year: {
      chiffre_affaires: Math.round(caY * 100) / 100,
      quantite: qtyY,
      prix_moyen_pondere: Math.round(pmY * 100) / 100,
    },
    ref: {
      chiffre_affaires: Math.round(caR * 100) / 100,
      quantite: qtyR,
      prix_moyen_pondere: Math.round(pmR * 100) / 100,
    },
    delta: {
      chiffre_affaires: Math.round(deltaCA * 100) / 100,
      pct_chiffre_affaires: Math.round(pct(deltaCA, caR) * 100) / 100,
    },
    decomposition: {
      effet_volume: Math.round(effet_volume * 100) / 100,
      effet_prix: Math.round(effet_prix * 100) / 100,
      effet_mix: Math.round(effet_mix * 100) / 100,
    },
  });
});

app.get("/analysis/diagnostic", (req, res) => {
  const year = YearSchema.parse(req.query.year);
  const ref = YearSchema.parse(req.query.ref);

  const rowsY = salesFilter({ year });
  const rowsR = salesFilter({ year: ref });

  const { ca: caY, qty: qtyY } = sumRevenue(rowsY);
  const { ca: caR, qty: qtyR } = sumRevenue(rowsR);

  const pmY = qtyY > 0 ? caY / qtyY : 0;
  const pmR = qtyR > 0 ? caR / qtyR : 0;

  const deltaCA = caY - caR;

  const effet_volume = (qtyY - qtyR) * pmR;
  const effet_prix = (pmY - pmR) * qtyY;
  const effet_mix = deltaCA - effet_volume - effet_prix;

  // --- Catégorie la plus contributrice ---
  const categoryDeltas = db.categories.map((cat) => {
    const y = salesFilter({ year, categoryId: cat.id_categorie });
    const r = salesFilter({ year: ref, categoryId: cat.id_categorie });

    const caYcat = sumRevenue(y).ca;
    const caRcat = sumRevenue(r).ca;

    return {
      categorie: cat.nom,
      delta: caYcat - caRcat,
    };
  });

  const topCategory = categoryDeltas.sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  )[0];

  // --- Top produits contributeurs ---
  const productMap = new Map();

  for (const p of db.products) {
    const y = salesFilter({ year }).filter(
      (s) => s.id_produit === p.id_produit,
    );
    const r = salesFilter({ year: ref }).filter(
      (s) => s.id_produit === p.id_produit,
    );

    const caYprod = sumRevenue(y).ca;
    const caRprod = sumRevenue(r).ca;

    const delta = caYprod - caRprod;

    productMap.set(p.id_produit, {
      produit: p.nom,
      delta,
    });
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const pct = (a, b) => (b !== 0 ? (a / b) * 100 : 0);

  res.json({
    scope: { year, ref },
    summary: {
      delta_ca: Math.round(deltaCA * 100) / 100,
      pct_ca: Math.round(pct(deltaCA, caR) * 100) / 100,
    },
    drivers: {
      effet_volume: Math.round(effet_volume * 100) / 100,
      effet_prix: Math.round(effet_prix * 100) / 100,
      effet_mix: Math.round(effet_mix * 100) / 100,
    },
    top_category: topCategory,
    top_products: topProducts,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Express API running on http://localhost:${PORT}`);
});
