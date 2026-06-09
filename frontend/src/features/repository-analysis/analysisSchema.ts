import { z } from "zod";

// ============================================================
// DevTrace — Repository Analysis Zod Schema
// ============================================================

export const analysisSchema = z.object({
  repositoryUrl: z
    .string()
    .min(1, "Repository URL is required")
    .url("Please enter a valid URL")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname === "github.com";
        } catch {
          return false;
        }
      },
      { message: "URL must be a valid GitHub repository URL (github.com/...)" }
    ),
  githubUsername: z
    .string()
    .min(1, "GitHub username is required")
    .min(2, "Username must be at least 2 characters")
    .max(39, "GitHub usernames cannot exceed 39 characters")
    .regex(
      /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,37}$/i,
      "Invalid GitHub username format"
    ),
});

export type AnalysisFormValues = z.infer<typeof analysisSchema>;
