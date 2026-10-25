import type { IJournalStory } from "../models/journal-story.model.js";

export const starterJournalStories: Omit<
  IJournalStory,
  "publishedAt" | "createdAt" | "updatedAt"
>[] = [
  {
    slug: "a-room-that-unfolds-slowly",
    category: "Living well",
    title: "A room that unfolds slowly",
    excerpt:
      "How to build a living space through texture, proportion, and the objects that earn their place over time.",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1500&q=85",
    imageAlt: "A calm living room layered with natural textures",
    body: [
      "The rooms we return to most often are rarely made all at once. They gather their character quietly: a chair that becomes a favourite reading spot, a lamp that changes the mood of an evening, a shelf that holds the things worth keeping close.",
      "Start with comfort rather than completion. Choose one generous anchor, then leave enough space for the room to breathe. The best additions are not the loudest ones; they bring warmth, useful texture, or a shape that balances everything nearby.",
      "Let materials do some of the work. Wool softens a hard line. Oak brings visual calm. A hand-finished object offers a small moment of attention in an otherwise busy day.",
    ],
    relatedProductCategory: "Living",
    readMinutes: 5,
    status: "published",
  },
  {
    slug: "the-pleasure-of-the-table",
    category: "At the table",
    title: "The pleasure of the table",
    excerpt:
      "A few thoughtful pieces are all it takes to make an ordinary meal feel unhurried and generous.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "A warm, thoughtfully set dining space",
    body: [
      "The table is one of the simplest places to make a ritual. It asks very little: a surface worth gathering around, a useful vessel, and the time to notice what is in front of you.",
      "Favour pieces that become better with use. Linen that relaxes after every wash, stoneware with the slight irregularity of a hand, and glass that catches the last of the afternoon light all make a meal feel personal.",
      "There is no need to match everything. A restrained palette and a few tactile materials are enough to make the setting feel considered without becoming precious.",
    ],
    relatedProductCategory: "Dining",
    readMinutes: 4,
    status: "published",
  },
  {
    slug: "lighting-for-the-hours-after-dark",
    category: "Light study",
    title: "Lighting for the hours after dark",
    excerpt:
      "Why layered, lower light makes a home feel more welcoming—and where to begin.",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "A softly lit table lamp in a quiet room",
    body: [
      "Good lighting is less about brightness than atmosphere. The right pool of light makes a corner useful, gives a table a centre, and lets the rest of the room recede.",
      "Begin with more than one source. A table lamp at eye level can soften the edges of a room, while a pendant gives shape to the space beneath it. Together they are far more inviting than a single overhead fixture.",
      "Choose shades and finishes that diffuse rather than glare. The aim is light that stays with you, not light that demands to be noticed.",
    ],
    relatedProductCategory: "Lighting",
    readMinutes: 3,
    status: "published",
  },
];
