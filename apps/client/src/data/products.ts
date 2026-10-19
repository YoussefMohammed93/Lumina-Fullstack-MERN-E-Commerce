import type { Collection, Product, Testimonial } from "../types/product";

const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const products: Product[] = [
  {
    id: "prod-clay-01",
    name: "Bouclé Lounge Chair",
    slug: "boucle-lounge-chair",
    description:
      "A low, generous seat wrapped in undyed bouclé. The oak frame is joined by hand and left unsealed so it deepens with the years.",
    price: 1290,
    category: "Living",
    images: [
      photo("photo-1616486338812-3dadae4b4ace"),
      photo("photo-1567538096630-e0c55bd6374c"),
    ],
    stock: 8,
    rating: 4.8,
    reviewCount: 34,
    badge: "new",
    materials: "Undyed bouclé, solid oak",
    dimensions: "82 × 88 × 74 cm",
  },
  {
    id: "prod-clay-02",
    name: "Stoneware Pour-Over Set",
    slug: "stoneware-pour-over-set",
    description:
      "Wheel-thrown stoneware with a matte bone glaze. Holds eight cups and keeps its heat long after the last pour.",
    price: 148,
    category: "Dining",
    images: [
      photo("photo-1495474472287-4d71bcdd2085"),
      photo("photo-1514228742587-6b1558fcca3d"),
    ],
    stock: 42,
    rating: 4.6,
    reviewCount: 61,
    materials: "High-fired stoneware",
    dimensions: "1 L capacity",
  },
  {
    id: "prod-clay-03",
    name: "Linen Table Runner",
    slug: "linen-table-runner",
    description:
      "Washed European flax with a raw, open-weave edge. Soft enough to wrinkle gracefully, heavy enough to stay put.",
    price: 96,
    compareAtPrice: 120,
    category: "Dining",
    images: [
      photo("photo-1600585154340-be6161a56a0c"),
      photo("photo-1600585154340-be6161a56a0c"),
    ],
    stock: 61,
    rating: 4.4,
    reviewCount: 28,
    badge: "sale",
    materials: "100% washed Belgian linen",
    dimensions: "240 × 45 cm",
  },
  {
    id: "prod-clay-04",
    name: "Halo Table Lamp",
    slug: "halo-table-lamp",
    description:
      "A paper-thin linen shade over a cherry base. The light it casts is warm, low, and free of glare.",
    price: 340,
    category: "Lighting",
    images: [
      photo("photo-1507473885765-e6ed057f782c"),
      photo("photo-1543198126-a8339d5ae6b1"),
    ],
    stock: 17,
    rating: 4.9,
    reviewCount: 73,
    badge: "limited",
    materials: "Linen shade, turned cherry",
    dimensions: "Ø 34 × 46 cm",
  },
  {
    id: "prod-clay-05",
    name: "Hand-Blown Carafe",
    slug: "hand-blown-carafe",
    description:
      "Each carafe is blown in a small Portuguese workshop, so no two glass volumes are quite alike. Sealed with a cork stopper.",
    price: 78,
    category: "Dining",
    images: [
      photo("photo-1513558161293-cdaf765ed2fd"),
      photo("photo-1517248135467-4c7edcad34c4"),
    ],
    stock: 120,
    rating: 4.5,
    reviewCount: 45,
    materials: "Recycled glass, cork",
    dimensions: "1.1 L capacity",
  },
  {
    id: "prod-clay-06",
    name: "Oak Floating Shelf",
    slug: "oak-floating-shelf",
    description:
      "A single plank of white oak, eased at every edge and finished with hardwax oil. Concealed steel pins disappear into the wall.",
    price: 265,
    category: "Living",
    images: [
      photo("photo-1493663284031-b7e3aefcae8e"),
      photo("photo-1524758631624-e2822e304c36"),
    ],
    stock: 24,
    rating: 4.7,
    reviewCount: 19,
    materials: "Solid white oak, steel",
    dimensions: "120 × 24 × 4 cm",
  },
  {
    id: "prod-clay-07",
    name: "Pleated Pendant",
    slug: "pleated-pendant",
    description:
      "Folded paper diffuses the bulb into a soft, even pool. Hangs from a fabric-wrapped cord in the colour of raw cotton.",
    price: 410,
    compareAtPrice: 480,
    category: "Lighting",
    images: [
      photo("photo-1513506003901-1e6a229e2d15"),
      photo("photo-1524484485831-a92ffc0de03f"),
    ],
    stock: 12,
    rating: 4.6,
    reviewCount: 22,
    badge: "sale",
    materials: "Folded cotton paper, brass",
    dimensions: "Ø 52 × 38 cm",
  },
  {
    id: "prod-clay-08",
    name: "Ribbed Stone Vase",
    slug: "ribbed-stone-vase",
    description:
      "Carved from a single block of limestone. The ribs catch the afternoon light; the interior is sealed for stems.",
    price: 190,
    category: "Objects",
    images: [
      photo("photo-1578500494198-246f612d3b3d"),
      photo("photo-1581783898377-1c85bf937427"),
    ],
    stock: 30,
    rating: 4.3,
    reviewCount: 16,
    materials: "Carved limestone",
    dimensions: "Ø 18 × 32 cm",
  },
  {
    id: "prod-clay-09",
    name: "Woven Wool Throw",
    slug: "woven-wool-throw",
    description:
      "Loomed in the Scottish borders from undyed lambswool. Light enough for a summer evening, warm enough for winter.",
    price: 220,
    category: "Living",
    images: [
      photo("photo-1584100936595-c0654b55a2e2"),
      photo("photo-1522708323590-d24dbb6b0267"),
    ],
    stock: 36,
    rating: 4.8,
    reviewCount: 52,
    materials: "100% undyed lambswool",
    dimensions: "140 × 190 cm",
  },
  {
    id: "prod-clay-10",
    name: "Brass Candle Holders",
    slug: "brass-candle-holders",
    description:
      "A pair of turned brass holders that patina rather than polish. Weighted at the base so they never wander.",
    price: 135,
    category: "Objects",
    images: [
      photo("photo-1603006905003-be475563bc59"),
      photo("photo-1540932239986-30128078f3c5"),
    ],
    stock: 48,
    rating: 4.5,
    reviewCount: 31,
    badge: "new",
    materials: "Solid brushed brass",
    dimensions: "Set of two, 22 / 28 cm",
  },
  {
    id: "prod-clay-11",
    name: "Cane Dining Chair",
    slug: "cane-dining-chair",
    description:
      "A slim ash frame with a hand-woven cane back. Sold individually; they push in neatly beneath most tables.",
    price: 380,
    category: "Dining",
    images: [
      photo("photo-1503602642458-232111445657"),
      photo("photo-1505693416388-ac5ce068fe85"),
    ],
    stock: 40,
    rating: 4.7,
    reviewCount: 87,
    materials: "Solid ash, hand-woven cane",
    dimensions: "47 × 52 × 79 cm",
  },
  {
    id: "prod-clay-12",
    name: "Alabaster Wall Sconce",
    slug: "alabaster-wall-sconce",
    description:
      "A slab of translucent alabaster mounted on a blackened steel arm. It glows rather than shines.",
    price: 520,
    category: "Lighting",
    images: [
      photo("photo-1524634126442-357e0eac3c14"),
      photo("photo-1558618666-fcd25c85cd64"),
    ],
    stock: 6,
    rating: 4.9,
    reviewCount: 12,
    badge: "limited",
    materials: "Alabaster, blackened steel",
    dimensions: "24 × 12 × 18 cm",
  },
];

// This will become an admin-managed field in the product collection.
const cashOnDeliveryUnavailable = new Set([
  "prod-clay-01",
  "prod-clay-04",
  "prod-clay-07",
  "prod-clay-11",
  "prod-clay-12",
]);

products.forEach((product) => {
  product.cashOnDeliveryAvailable = !cashOnDeliveryUnavailable.has(product.id);
});

export const collections: Collection[] = [
  {
    id: "col-living",
    eyebrow: "01 · Living",
    title: "The living room",
    description: "Seating, shelves and everything that holds a room together.",
    image: photo("photo-1616486338812-3dadae4b4ace", 800),
    href: "#featured",
    span: "standard",
  },
  {
    id: "col-dining",
    eyebrow: "02 · Dining",
    title: "At the table",
    description: "Stoneware, linen and glass for long, unhurried meals.",
    image: photo("photo-1600585154340-be6161a56a0c", 800),
    href: "#featured",
    span: "standard",
  },
  {
    id: "col-lighting",
    eyebrow: "03 · Lighting",
    title: "Soft light",
    description: "Warm, low and free of glare.",
    image: photo("photo-1507473885765-e6ed057f782c", 800),
    href: "#featured",
    span: "standard",
  },
  {
    id: "col-objects",
    eyebrow: "04 · Objects",
    title: "Small things",
    description: "The pieces that reward a second look.",
    image: photo("photo-1578500494198-246f612d3b3d", 800),
    href: "#featured",
    span: "standard",
  },
  {
    id: "col-bedroom",
    eyebrow: "05 · Bedroom",
    title: "Rest well",
    description: "Linens, frames and quiet textures for winding down.",
    image: photo("photo-1522771739844-6a9f6d5f14af", 800),
    href: "#featured",
    span: "standard",
  },
  {
    id: "col-workspace",
    eyebrow: "06 · Workspace",
    title: "The desk",
    description: "Minimal tools and surfaces for focused work.",
    image: photo("photo-1518455027359-f3f8164ba6bd", 800),
    href: "#featured",
    span: "standard",
  },
  {
    id: "col-bathroom",
    eyebrow: "07 · Bathroom",
    title: "Stone & water",
    description: "Ceramics and vessels shaped for daily ritual.",
    image: photo("photo-1552321554-5fefe8c9ef14", 800),
    href: "#featured",
    span: "standard",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "rev-01",
    quote:
      "Everything arrived wrapped like a gift. Two years on, the chair still looks better than the day it came through the door.",
    name: "Amara Diallo",
    location: "Copenhagen",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "rev-02",
    quote:
      "I bought the pour-over set on a whim and now it is the first thing I reach for every morning. Quietly perfect.",
    name: "Daniel Reyes",
    location: "Mexico City",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "rev-03",
    quote:
      "Rare to find a shop that trusts you to make your own choices. The pieces speak for themselves, and they speak softly.",
    name: "Ingrid Strand",
    location: "Oslo",
    rating: 4,
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

export const categories = [
  "All",
  "Living",
  "Dining",
  "Lighting",
  "Objects",
] as const;
