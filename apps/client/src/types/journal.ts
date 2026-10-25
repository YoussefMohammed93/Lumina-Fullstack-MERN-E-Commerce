export type JournalStoryStatus = "draft" | "published";

export interface JournalStory {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  body: string[];
  relatedProductCategory: string;
  readMinutes: number;
  status: JournalStoryStatus;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalStoriesResponse {
  stories: JournalStory[];
}
