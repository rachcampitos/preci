import { ProductCategory } from './schemas/product.schema';

/**
 * Auto-categorize a product by its name.
 * Two-phase approach:
 *   Phase 0: Skip non-grocery/non-school items (pet food, etc.)
 *   Phase 1: Identify by product TYPE (what IS this product?)
 *   Phase 2: Identify by primary ingredient (name STARTS with the ingredient)
 */

// ─── PHASE 0: Skip entirely ──────────────────────────────────────────
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

// ─── PHASE 1: Product type rules (first match wins) ──────────────────
interface TypeRule {
  category: ProductCategory;
  patterns: RegExp[];
}

const PRODUCT_TYPE_RULES: TypeRule[] = [
  // Escolar / Oficina
  {
    category: ProductCategory.ESCOLAR,
    patterns: [
      /\bcuaderno/i, /\bcuadernillo/i,
      /\bl[aá]piz\b/i, /\bl[aá]pices\b/i, /\blapicero/i, /\bportaminas\b/i,
      /\bplum[oó]n/i, /\bmarcador/i, /\bresaltador/i,
      /\bcrayon/i, /\bcrayola/i, /\bcolor(es)?\s+(faber|artesco|staedtler|stabilo)/i,
      /\btempera/i, /\bacuarela/i, /\bpincel/i,
      /\bborrador\b/i, /\btajador\b/i, /\bsacapunta/i,
      /\bcartuchera/i, /\bmochila\b/i, /\blonchera/i,
      /\bregla\b.*\b(cm|30|20|escolar)/i,
      /\bcomp[aá]s\b/i, /\bescuadra\b/i, /\btransportador/i,
      /\bfolder/i, /\barchivador/i, /\bseparador/i,
      /\bcartulina/i, /\bpapel\s+(bond|seda|cr[eé]pe|lustre|craft|kraft|canson)/i,
      /\bgoma\s+(en\s+barra|l[ií]quida|escolar)/i, /\bpegamento\b/i,
      /\bcinta\s+(masking|scotch|adhesiva|de\s+embalaje)/i,
      /\btijera\s+(escolar|punta\s+roma)/i,
      /\bsticker/i, /\bmanualidad/i, /\bcer[aá]mica\s+en\s+fr[ií]o/i,
      /\bfaber.castell\b/i, /\bartesco\b/i, /\bstandford\b/i, /\bstabilo\b/i,
      /\bdavid\b.*\bcuaderno/i, /\bnorma\b.*\bcuaderno/i,
      /\bsketchbook\b/i,
      /\bpizarra\b/i, /\btiza\b/i,
      /\btomatodo/i,
      /\bengrapador/i, /\bgrapa\b/i, /\bperforador/i,
      /\bpost.it\b/i, /\bnota\s+adhesiva/i,
      /\brompecabeza/i, /\bjuego\s+did[aá]ctico/i,
    ],
  },
  // Higiene
  {
    category: ProductCategory.HIGIENE,
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
    category: ProductCategory.LIMPIEZA,
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
  // Bebidas
  {
    category: ProductCategory.BEBIDAS,
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
  // Enlatados / salsas
  {
    category: ProductCategory.ENLATADOS,
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
  // Panaderia / galletas / snacks
  {
    category: ProductCategory.PANADERIA,
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
  // Snacks salados → panaderia
  {
    category: ProductCategory.PANADERIA,
    patterns: [
      /^snack\b/i,
      /\bpapas\s+(fritas|pringles|lays|inka|kryzpo|voraz)/i,
      /^papas\b/i,
      /\bchips?\b.*\b(doritos|tostitos|tortilla)/i,
      /\bdoritos\b/i,
      /\bpiqueo/i,
    ],
  },
  // Aceites
  {
    category: ProductCategory.ACEITES,
    patterns: [
      /^aceite\b/i, /\baceite\s+(de\s+)?(oliva|vegetal|girasol|canola|coco|soya)/i,
      /\bmanteca\b/i,
      /\bmargarina\b/i,
      /\bvinagre\b/i,
    ],
  },
  // Granos, cereales, pastas
  {
    category: ProductCategory.GRANOS_CEREALES,
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

// ─── PHASE 2: Primary ingredient = product IS that thing ─────────────
const INGREDIENT_RULES: TypeRule[] = [
  {
    category: ProductCategory.LACTEOS,
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
    category: ProductCategory.CARNES,
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
    category: ProductCategory.FRUTAS_VERDURAS,
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

/**
 * Categorize a product by name. Returns null if no match.
 */
export function categorizeProduct(name: string): ProductCategory | null {
  // Phase 0: Skip non-relevant items
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(name)) return null;
  }

  // Phase 1: Identify by product type
  for (const rule of PRODUCT_TYPE_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(name)) return rule.category;
    }
  }

  // Phase 2: Identify by primary ingredient
  for (const rule of INGREDIENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(name)) return rule.category;
    }
  }

  return null;
}
