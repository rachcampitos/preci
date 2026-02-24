/**
 * Script para asignar categorias a productos sin categoria
 * basado en heuristicas de nombre y marca.
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts
 * Dry run: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts --dry-run
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

// Exclusion patterns — skip these products entirely (pet food, baby gear, etc.)
const EXCLUDE_PATTERNS = [
  /alimento\s+(para|p\/)\s+(perro|gato|mascota)/i,
  /extractor\s+de\s+leche/i,
  /vaso\s+yogurt\s+(frozen|spiderman|minnie|avengers|mickey)/i,
  /cuchillo\s+.*\s+carne/i,
  /aderezo\s+para\s+(carne|pavo|pollo)/i,
];

interface CategoryRule {
  category: string;
  patterns: RegExp[];
}

const RULES: CategoryRule[] = [
  {
    category: 'carnes',
    patterns: [
      /\bpollo\b/i,
      /\bcarne\b/i,
      /\bcerdo\b/i,
      /\bres\b/i,
      /\bpavo\b/i,
      /\bchorizo\b/i,
      /\bsalchicha\b/i,
      /\bjam[oó]n\b/i,
      /\btocino\b/i,
      /\bhamburguesa\b/i,
      /\bhot\s*dog\b/i,
      /\bchuleta\b/i,
      /\blomito?\b/i,
      /\bcostilla/i,
      /\bfilete\b/i,
      /\bbistec\b/i,
      /\bbife\b/i,
      /\bmolleja\b/i,
      /\bh[ií]gado\b/i,
      /\bmondongo\b/i,
      /\bsolomillo\b/i,
      /\blech[oó]n\b/i,
      /\bchicharr[oó]n\b/i,
      /\bbondiola\b/i,
      /\bmilanesa\b/i,
      /\bmuslo/i,
      /\balita/i,
      /\bespinazo\b/i,
      /\bsasami\b/i,
      /\benrollado\b/i,
      /\bmatambrito\b/i,
      /\bpierna\b.*\b(cerdo|res)\b/i,
      /\bribs\b/i,
      /\btomahawk\b/i,
      /\bpica[ñn]a\b/i,
      /\bentra[ñn]a\b/i,
      /\balb[oó]ndiga/i,
      /\bpescado\b/i,
      /\bat[uú]n\b/i,
      /\bsardina/i,
      /\bmariscos?\b/i,
      /\bcamar[oó]n/i,
      /\blangostino/i,
      /\bsalm[oó]n\b/i,
      /\btrucha\b/i,
      /\bcalamar/i,
      /\bpulpo\b/i,
    ],
  },
  {
    category: 'lacteos',
    patterns: [
      /^leche\b/i,
      /\bleche\s+(entera|light|descremada|evaporada|uht|fresca|reconstituida|en polvo|zero)/i,
      /\byogurt\b/i,
      /\byogur\b/i,
      /\bqueso\b/i,
      /\bmantequilla\b/i,
      /\bcrema\s+de\s+leche/i,
      /\bricotta\b/i,
      /\bmozzarella\b/i,
      /\bparmesano\b/i,
      /\bcheddar\b/i,
      /\bgouda\b/i,
      /\bedam\b/i,
      /\bdeslactosad/i,
      /\bmanjar\b/i,
      /\bdulce\s+de\s+leche/i,
      /\bleche\s+condensad/i,
    ],
  },
  {
    category: 'frutas_verduras',
    patterns: [
      /\bmanzana\b/i,
      /\bpl[aá]tano\b/i,
      /\bbanano?\b/i,
      /\bpapaya\b/i,
      /\bnaranja\b/i,
      /\blim[oó]n\b/i,
      /\btomate\b/i,
      /\bcebolla\b/i,
      /\bpapa\b/i,
      /\blechuga\b/i,
      /\bzanahoria\b/i,
      /\bbr[oó]coli\b/i,
      /\bpepino\b/i,
      /\bpalta\b/i,
      /\baguacate\b/i,
      /\bmandarina\b/i,
      /\buvas?\b/i,
      /\bfresas?\b/i,
      /\bpi[ñn]a\b/i,
      /\bmango\b/i,
      /\bsand[ií]a\b/i,
      /\bmel[oó]n\b/i,
      /\bkiwi\b/i,
      /\bapio\b/i,
      /\bespinaca\b/i,
      /\bpimiento\b/i,
      /\baj[ií]\b/i,
      /\brocoto\b/i,
      /\bchoclo\b/i,
      /\bcamote\b/i,
      /\bbetarraga\b/i,
      /\byuca\b/i,
      /\bdurazno\b/i,
      /\bcereza\b/i,
      /\bar[aá]ndano/i,
      /\bframbuesa/i,
      /\bcoco\b/i,
      /\bgranada\b/i,
      /\bpera\b/i,
      /\bvainita\b/i,
      /\bcoliflor\b/i,
      /\balcachofa\b/i,
      /\bpallar/i,
      /\bhaba\b/i,
      /\barveja/i,
    ],
  },
  {
    category: 'bebidas',
    patterns: [
      /\bagua\s+(mineral|de\s+mesa|sin\s+gas|con\s+gas)/i,
      /\bgaseosa\b/i,
      /\bjugo\b/i,
      /\bn[eé]ctar\b/i,
      /\bcerveza\b/i,
      /\bvino\b/i,
      /\bpisco\b/i,
      /\bron\b/i,
      /\bvodka\b/i,
      /\bwhisky\b/i,
      /\benergizante\b/i,
      /\bt[eé]\b/i,
      /\binfusi[oó]n/i,
      /\bchicha\b/i,
      /\brefresco\b/i,
      /\blimonada\b/i,
      /\bemoliente\b/i,
      /\bcoca.cola\b/i,
      /\bpepsi\b/i,
      /\binca\s*kola\b/i,
      /\bsprite\b/i,
      /\bfanta\b/i,
      /\bred\s*bull\b/i,
      /\bgatorade\b/i,
      /\bpowerade\b/i,
      /\bsporade\b/i,
      /\bsoda\b/i,
      /\bcaf[eé]\b/i,
      /\bnescaf[eé]/i,
      /\bmanzanilla\b/i,
      /\ban[ií]s\b/i,
    ],
  },
  {
    category: 'granos_cereales',
    patterns: [
      /\barroz\b/i,
      /\bfideo/i,
      /\bpasta\b/i,
      /\bavena\b/i,
      /\bcereal\b/i,
      /\bma[ií]z\b/i,
      /\bquinua\b/i,
      /\blenteja/i,
      /\bfrijol/i,
      /\bgarbanzo/i,
      /\bharina\b/i,
      /\btallar[ií]n/i,
      /\bspaghetti\b/i,
      /\braviole?s?\b/i,
      /\bsorrentino/i,
      /\blasagna\b/i,
      /\btrigo\b/i,
      /\bs[eé]mola\b/i,
      /\bcornflakes?\b/i,
      /\bmuesli\b/i,
      /\bgranola\b/i,
    ],
  },
  {
    category: 'panaderia',
    patterns: [
      /^pan\b/i,
      /\bgalleta/i,
      /\bbizcocho/i,
      /\btorta\b/i,
      /\bpastel\b/i,
      /\bcroissant\b/i,
      /\btostada/i,
      /\bwafer\b/i,
      /\brosquilla/i,
      /\bque[qk]ue\b/i,
      /\bdonut/i,
      /\bchifon\b/i,
      /\bempanada\b/i,
      /\bpanet[oó]n/i,
    ],
  },
  {
    category: 'limpieza',
    patterns: [
      /\bdetergente\b/i,
      /\blej[ií]a\b/i,
      /\blimpiatodo\b/i,
      /\bdesinfectante\b/i,
      /\besponja\b/i,
      /\btrapeador\b/i,
      /\bescoba\b/i,
      /\bpapel\s+higi[eé]nico/i,
      /\bservilleta/i,
      /\bbolsa\s+(de\s+)?basura/i,
      /\bambientador/i,
      /\bsuavizante\b/i,
      /\bcloro\b/i,
      /\bsapolio\b/i,
      /\blavavajilla/i,
      /\binsecticida\b/i,
      /\bquitamanchas\b/i,
      /\blimpiador\b/i,
      /\brecogedor\b/i,
      /\bguante.*(limpieza|latex)/i,
      /\bpaper\s+towel/i,
      /\btoalla\s+de\s+papel/i,
    ],
  },
  {
    category: 'higiene',
    patterns: [
      /\bshampoo\b/i,
      /\bchampu\b/i,
      /\bcrema\s+dental/i,
      /\bpasta\s+dental/i,
      /\bcepillo\s+dental/i,
      /\bdesodorante\b/i,
      /\btoalla\s+higi[eé]nica/i,
      /\bpa[ñn]al/i,
      /\bcolonia\b/i,
      /\bperfume\b/i,
      /\btalco\b/i,
      /\balgod[oó]n\b/i,
      /\bprotector\s+solar/i,
      /\bacondicionador\b/i,
      /\benjuague\s+bucal/i,
      /\bjab[oó]n\b/i,
      /\bgel\s+(de\s+)?ba[ñn]o/i,
      /\btoallita/i,
      /\bpa[ñn]ito/i,
      /\bcuritas?\b/i,
      /\bprot[eé]sis\s+dental/i,
    ],
  },
  {
    category: 'enlatados',
    patterns: [
      /\bconserva\b/i,
      /\benlatado\b/i,
      /\ben\s+alm[ií]bar/i,
      /\bsalsa\s+de\s+tomate/i,
      /\bketchup\b/i,
      /\bmayonesa\b/i,
      /\bmostaza\b/i,
      /\bsopa\s+instant[aá]nea/i,
      /\bramen\b/i,
      /\bmaruchan\b/i,
      /\bajinomen\b/i,
    ],
  },
  {
    category: 'aceites',
    patterns: [
      /\baceite\b/i,
      /\boliva\b/i,
      /\bgirasol\b/i,
      /\bmanteca\b/i,
      /\bmargarina\b/i,
      /\bvinagre\b/i,
    ],
  },
];

function categorize(name: string): string | null {
  // Check exclusions first
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(name)) return null;
  }

  // Match rules in priority order
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(name)) return rule.category;
    }
  }

  return null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const app = await NestFactory.createApplicationContext(CategorizeModule, {
    logger: ['error', 'warn', 'log'],
  });
  const productModel = app.get<Model<any>>(getModelToken(Product.name));

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
