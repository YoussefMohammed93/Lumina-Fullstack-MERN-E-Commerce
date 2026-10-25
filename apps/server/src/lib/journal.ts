import { JournalStory } from "../models/journal-story.model.js";
import { starterJournalStories } from "../data/journal-stories.js";

export async function ensureStarterJournalStories() {
  if ((await JournalStory.estimatedDocumentCount()) > 0) {
    const now = Date.now();
    await Promise.all(
      starterJournalStories.map((story, index) =>
        JournalStory.updateOne(
          {
            slug: story.slug,
            status: "published",
            publishedAt: { $exists: false },
          },
          { $set: { publishedAt: new Date(now - index * 1000) } },
        ),
      ),
    );
    return;
  }
  try {
    const now = Date.now();
    await JournalStory.insertMany(
      starterJournalStories.map((story, index) => ({
        ...story,
        publishedAt: new Date(now - index * 1000),
      })),
      { ordered: false },
    );
  } catch (error) {
    const duplicateKey =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000;
    if (!duplicateKey || (await JournalStory.estimatedDocumentCount()) === 0)
      throw error;
  }
}
