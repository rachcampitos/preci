/**
 * Script para asignar categorias a productos sin categoria.
 * Enfoque de dos fases: primero detecta QUE es el producto,
 * luego solo usa ingredientes si el producto ES ese ingrediente.
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts
 * Dry run: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts --dry-run
 * Reset + re-run: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts --reset
 */
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017/preci',
    ),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
})
class CategorizeModule {}

// ─── PHASE 0: Skip entirely (not a grocery product) ──────────────────────
const SKIP_PATTERNS = [
  /alimento\s+(h[uú]medo\s+)?(para|p\/)\s+(perro|gato|mascota)/i,
  /\b(snack|galleta|hueso)\s+(para|p\/)\s+(perro|gato)/i,
  /\bgnawlers\b/i,
  /\brambala\b.*\b(snack|oreja)/i,
  /\bpets?\s+republic\b.*\bsnack/i,
  /extractor\s+de\s+leche/i,
  /\bvaso\s+yogurt\s+(frozen|spiderman|minnie|avengers|mickey)/i,
  /\bcuchillo\b.*\bcarne\b/i,
  /\bcontenedor\s+de\s+cereal/i,
  /\bcrema\s+de\s+mano/i,
];

// ─── PHASE 1: "What IS this product?" — categorize by product type ───────
// These rules match the PRIMARY nature of the product, not its flavor.
// Order matters: first match wins.
interface TypeRule {
  category: string;
  patterns: RegExp[];
}

const PRODUCT_TYPE_RULES: TypeRule[] = [
  // Higiene (must come before others because "jabón de limón" is higiene, not frutas)
  {
    category: 'higiene',
    patterns: [
      /\bshampoo\b/i, /\bchampu\b/i,
      /\bcrema\s+dental/i, /\bpasta\s+dental/i, /\bcepillo\s+dental/i,
      /\bdesodorante\b/i,
      /\btoalla\s+higi[eé]nica/i,
      /\bpa[ñn]al(es)?\b/i,
      /\bcolonia\b/i, /\bperfume\b/i,
      /\btalco\b/i,
      /\bprotector\s+solar/i,
      /\bacondicionador\b/i,
      /\benjuague\s+bucal/i,
      /\bjab[oó]n\b/i,
      /\bgel\s+(de\s+)?ba[ñn]o/i,
      /\btoallita/i, /\bpa[ñn]ito/i,
      /\bcuritas?\b/i,
      /\balgod[oó]n\b/i,
    ],
  },
  // Limpieza
  {
    category: 'limpieza',
    patterns: [
      /\bdetergente\b/i, /\blej[ií]a\b/i, /\blimpiatodo\b/i,
      /\bdesinfectante\b/i, /\besponja\b/i, /\btrapeador\b/i, /\bescoba\b/i,
      /\bpapel\s+higi[eé]nico/i, /\bservilleta/i,
      /\bbolsa\s+(de\s+)?basura/i,
      /\bambientador/i, /\bsuavizante\b/i, /\bcloro\b/i,
      /\bsapolio\b/i, /\blavavajilla/i,
      /\binsecticida\b/i, /\bquitamanchas\b/i, /\blimpiador\b/i,
      /\brecogedor\b/i,
      /\btoalla\s+de\s+papel/i,
    ],
  },
  // Bebidas (before frutas because "jugo de naranja" is bebida, not fruta)
  {
    category: 'bebidas',
    patterns: [
      /\bagua\s+(mineral|de\s+mesa|sin\s+gas|con\s+gas|saborizada)/i,
      /\bgaseosa\b/i,
      /^jugo\b/i, /\bjugo\s+de\s+fruta/i, /\bjugo\b.*\bbotella\b/i, /\bjugo\b.*\bcaja\b/i,
      /\bn[eé]ctar\b/i,
      /\bcerveza\b/i, /\bvino\b/i, /\bpisco\b/i, /\bron\b/i, /\bvodka\b/i, /\bwhisky\b/i,
      /\benergizante\b/i,
      /\binfusi[oó]n/i,
      /\bchicha\b/i, /\brefresco\b/i, /\blimonada\b/i, /\bemoliente\b/i,
      /\bcoca.cola\b/i, /\bpepsi\b/i, /\binca\s*kola\b/i,
      /\bsprite\b/i, /\bfanta\b/i,
      /\bred\s*bull\b/i, /\bgatorade\b/i, /\bpowerade\b/i, /\bsporade\b/i,
      /\bsoda\b/i,
      /\bnescaf[eé]/i,
      /^caf[eé]\b/i, /\bcaf[eé]\s+(instant|molido|en\s+grano|tostado|soluble)/i,
      /^t[eé]\b/i, /\bt[eé]\s+(verde|negro|rojo|blanco)/i,
      /\bmanzanilla\b.*\b(caja|bolsa|filtrante)/i,
      /\ban[ií]s\b.*\b(caja|bolsa|filtrante)/i,
    ],
  },
  // Enlatados / salsas / sopas instantaneas
  {
    category: 'enlatados',
    patterns: [
      /\bconserva\b/i, /\benlatado\b/i,
      /\ben\s+alm[ií]bar/i,
      /\bsalsa\s+de\s+tomate/i, /\bsalsa\s+(roja|cl[aá]sica|casera)\s+de\s+tomate/i,
      /\bketchup\b/i, /\bmayonesa\b/i, /\bmostaza\b/i,
      /\bsopa\s+instant[aá]nea/i, /\bsopa\s+ramen/i,
      /\bramen\b/i, /\bmaruchan\b/i, /\bajinomen\b/i,
      /\bsopa\s+de\b/i,
    ],
  },
  // Panaderia / galletas / snacks dulces
  {
    category: 'panaderia',
    patterns: [
      /^pan\s/i, /^pan$/i,
      /\bgalleta/i,
      /\bbizcocho/i, /\btorta\b/i, /\bpastel\b/i,
      /\bcroissant\b/i, /\btostada/i,
      /\bwafer\b/i, /\brosquilla/i,
      /\bque[qk]ue\b/i, /\bdonut/i,
      /\bpanet[oó]n/i,
      /\bchocolate\b/i,
      /\bcaramelo/i,
      /\bgoma\s+de\s+mascar/i,
      /\bchicle\b/i,
    ],
  },
  // Snacks salados → panaderia (close enough, no separate "snacks" category)
  {
    category: 'panaderia',
    patterns: [
      /^snack\b/i,
      /\bpapas\s+(fritas|pringles|lays|inka|kryzpo|voraz)/i,
      /^papas\b/i,
      /\bchips?\b.*\b(doritos|tostitos|tortilla)/i,
      /\bdoritos\b/i,
      /\bpiqueo/i,
    ],
  },
  // Aceites (before granos because "aceite de oliva" is aceites)
  {
    category: 'aceites',
    patterns: [
      /^aceite\b/i, /\baceite\s+(de\s+)?(oliva|vegetal|girasol|canola|coco|soya)/i,
      /\bmanteca\b/i,
      /\bmargarina\b/i,
      /\bvinagre\b/i,
    ],
  },
  // Granos, cereales, pastas (ravioles, lasagna etc. van aqui)
  {
    category: 'granos_cereales',
    patterns: [
      /^arroz\b/i, /\barroz\s+(extra|superior|integral|arborio)/i,
      /^fideo/i, /\bfideo\b/i,
      /^pasta\b/i,
      /\bavena\b/i,
      /^cereal\b/i, /\bcereal\s+(en\s+barra|integral)/i,
      /\bquinua\b/i,
      /\blenteja/i, /\bfrijol/i, /\bgarbanzo/i,
      /^harina\b/i,
      /\btallar[ií]n/i, /\bspaghetti\b/i,
      /\braviole?s?\b/i, /\bsorrentino/i, /\blasagna\b/i,
      /\bgranola\b/i, /\bmuesli\b/i,
      /\bcornflakes?\b/i,
    ],
  },
];

// ─── PHASE 2: Primary ingredient = product IS that thing ─────────────────
// Only matches if the product name STARTS with or IS primarily the ingredient.
// "Leche Gloria" = lacteos, but "Galleta con Leche" was already caught as panaderia.
const INGREDIENT_RULES: TypeRule[] = [
  {
    category: 'lacteos',
    patterns: [
      /^leche\b/i,
      /^yogurt\b/i, /^yogur\b/i,
      /^queso\b/i,
      /^mantequilla\b/i,
      /^crema\s+de\s+leche/i,
      /^ricotta\b/i, /^mozzarella\b/i, /^parmesano\b/i,
      /^cheddar\b/i, /^gouda\b/i, /^edam\b/i,
      /^manjar\b/i,
      /^dulce\s+de\s+leche\b/i,
      /^leche\s+condensad/i,
    ],
  },
  {
    category: 'carnes',
    patterns: [
      /^pollo\b/i, /^muslo/i, /^alita/i, /^pechuga/i,
      /^carne\b/i,
      /^cerdo\b/i, /^chuleta\b/i, /^costilla/i,
      /^pavo\b/i,
      /^chorizo\b/i, /^salchicha\b/i,
      /^jam[oó]n\b/i, /^tocino\b/i,
      /^hamburguesa\b/i, /^hot\s*dog\b/i,
      /^lomo\b/i, /^lomito\b/i,
      /^filete\b/i, /^bistec\b/i, /^bife\b/i,
      /^molleja\b/i, /^h[ií]gado\b/i, /^mondongo\b/i,
      /^solomillo\b/i, /^bondiola\b/i, /^milanesa\b/i,
      /^chicharr[oó]n\b/i, /^lech[oó]n\b/i,
      /^espinazo\b/i, /^sasami\b/i,
      /^enrollado\b/i, /^matambrito\b/i,
      /^tomahawk\b/i, /^pica[ñn]a\b/i, /^entra[ñn]a\b/i,
      /^ribs\b/i, /^baby\s+back\s+ribs/i,
      /^alb[oó]ndiga/i,
      /^pescado\b/i, /^at[uú]n\b/i, /^sardina/i,
      /^camar[oó]n/i, /^langostino/i,
      /^salm[oó]n\b/i, /^trucha\b/i,
      /^calamar/i, /^pulpo\b/i,
      /^pierna\b/i, /^pernil\b/i, /^asado\b/i, /^guiso\b/i,
      /^gyoza\b/i,
      /^cecina\b/i,
    ],
  },
  {
    category: 'frutas_verduras',
    patterns: [
      /^manzana/i, /^pl[aá]tano/i, /^banano/i,
      /^papaya/i, /^naranja/i, /^lim[oó]n\b/i,
      /^tomate\b/i, /^cebolla/i,
      /^papa\b/i, /^papas?\s+\bx\s+kg/i,
      /^lechuga/i, /^zanahoria/i,
      /^br[oó]coli/i, /^pepino/i,
      /^palta/i, /^aguacate/i,
      /^mandarina/i, /^uvas?$/i, /^uva\b/i,
      /^fresas?$/i, /^fresa\b/i,
      /^pi[ñn]a\b/i, /^mango\b/i,
      /^sand[ií]a/i, /^mel[oó]n/i, /^kiwi/i,
      /^apio/i, /^espinaca/i, /^pimiento/i,
      /^aj[ií]\b/i, /^rocoto/i,
      /^choclo/i, /^camote/i, /^betarraga/i, /^yuca/i,
      /^durazno/i, /^cereza/i,
      /^ar[aá]ndano/i, /^frambuesa/i,
      /^coco\b/i, /^granada\b/i, /^pera\b/i,
      /^vainita/i, /^coliflor/i, /^alcachofa/i,
      /^arveja/i, /^haba\b/i,
    ],
  },
];

function categorize(name: string): string | null {
  // Phase 0: Skip non-grocery items
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(name)) return null;
  }

  // Phase 1: Identify by product type (what IS this product?)
  for (const rule of PRODUCT_TYPE_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(name)) return rule.category;
    }
  }

  // Phase 2: Identify by primary ingredient (name STARTS with the ingredient)
  for (const rule of INGREDIENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(name)) return rule.category;
    }
  }

  return null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const reset = process.argv.includes('--reset');

  const app = await NestFactory.createApplicationContext(CategorizeModule, {
    logger: ['error', 'warn', 'log'],
  });
  const productModel = app.get<Model<any>>(getModelToken(Product.name));

  // Reset: clear all categories first (to re-run from scratch)
  if (reset) {
    const result = await productModel.updateMany(
      { category: { $exists: true } },
      { $unset: { category: '' } },
    );
    console.log(`Reset: ${result.modifiedCount} categorias eliminadas`);
  }

  const uncategorized = await productModel
    .find({ $or: [{ category: { $exists: false } }, { category: null }] })
    .select('name brand')
    .lean();

  console.log(`Productos sin categoria: ${uncategorized.length}`);

  const stats: Record<string, number> = {};
  let skipped = 0;
  let updated = 0;

  for (const product of uncategorized) {
    const category = categorize(product.name);
    if (!category) {
      skipped++;
      continue;
    }

    stats[category] = (stats[category] || 0) + 1;

    if (!dryRun) {
      await productModel.updateOne(
        { _id: product._id },
        { $set: { category } },
      );
    }
    updated++;
  }

  console.log(`\nResultados${dryRun ? ' (DRY RUN)' : ''}:`);
  console.log(`  Categorizados: ${updated}`);
  console.log(`  Sin match: ${skipped}`);
  console.log('\nPor categoria:');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  await app.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
