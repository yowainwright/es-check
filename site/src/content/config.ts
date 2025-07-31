import { defineCollection, z } from "astro:content";

const documentation = defineCollection({
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
    }),
});

export const collections = {
  docs: documentation,
};
