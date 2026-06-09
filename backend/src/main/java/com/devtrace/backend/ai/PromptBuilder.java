package com.devtrace.backend.ai;

import com.devtrace.backend.model.ContributionBreakdownItem;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds a compact, high-signal prompt for the AI layer using
 * pre-processed contribution intelligence. The AI's role is to
 * polish and enhance structured findings — not analyze raw data.
 */
@Component
public class PromptBuilder {

    public String buildReportPrompt(ContributionContext context) {

        // ── Primary areas ────────────────────────────────────
        String areasText = context.getPrimaryAreas() != null && !context.getPrimaryAreas().isEmpty()
                ? context.getPrimaryAreas().stream()
                    .map(a -> "- " + a)
                    .collect(Collectors.joining("\n"))
                : "- General Development";

        // ── Major activities ─────────────────────────────────
        String activitiesText = context.getMajorActivities() != null && !context.getMajorActivities().isEmpty()
                ? context.getMajorActivities().stream()
                    .map(a -> "- " + a)
                    .collect(Collectors.joining("\n"))
                : "- Software Development";

        // ── Technology stack ─────────────────────────────────
        String techText = context.getTechnologyIndicators() != null && !context.getTechnologyIndicators().isEmpty()
                ? String.join(", ", context.getTechnologyIndicators())
                : "Not identified";

        // ── Top folders ──────────────────────────────────────
        String foldersText = context.getTopFolders() != null && !context.getTopFolders().isEmpty()
                ? context.getTopFolders().stream()
                    .limit(8)
                    .map(f -> "- " + f)
                    .collect(Collectors.joining("\n"))
                : "- root";

        // ── Top keywords from commits ────────────────────────
        String keywordsText = context.getTopKeywords() != null && !context.getTopKeywords().isEmpty()
                ? String.join(", ", context.getTopKeywords())
                : "general development";

        // ── File extension breakdown ─────────────────────────
        String extensionsText = context.getExtensionFrequency() != null && !context.getExtensionFrequency().isEmpty()
                ? context.getExtensionFrequency().entrySet().stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(10)
                    .map(e -> e.getKey() + ": " + e.getValue() + " files")
                    .collect(Collectors.joining(", "))
                : "Not available";

        // ── Contribution breakdown ───────────────────────────
        String breakdownText = context.getContributionBreakdown() != null && !context.getContributionBreakdown().isEmpty()
                ? context.getContributionBreakdown().stream()
                    .map(b -> "- " + b.getArea() + ": " + b.getPercentage() + "%")
                    .collect(Collectors.joining("\n"))
                : "- General: 100%";

        return """
            You are an expert technical career coach and resume writer. Your task is to use the pre-analyzed contribution profile below and generate a professional, recruiter-ready career report.
            
            IMPORTANT: The analysis has already been performed. You are enhancing and polishing structured findings, not analyzing raw data.
            
            Contributor Profile:
            - Repository: %s
            - Total Commits: %d
            - Files Modified: %d
            - Lines Added: %d
            - Lines Deleted: %d
            - Contribution Period: %s
            
            Engineering Focus Areas:
            %s
            
            Major Activities:
            %s
            
            Technology Stack: %s
            
            Contribution Breakdown:
            %s
            
            Top Modified Directories:
            %s
            
            Key Themes from Commit History: %s
            
            File Types Modified: %s
            
            You must return a valid JSON object matching the following structure. Do NOT wrap the JSON in markdown code blocks (e.g. do NOT include ```json or ```). Return ONLY the raw JSON string.
            
            JSON Structure:
            {
              "contributionSummary": [
                "Detailed summary bullet 1 (explain what was built, problems solved, and business value).",
                "Detailed summary bullet 2..."
              ],
              "resumeBullets": [
                "ATS-friendly resume bullet 1 starting with a strong action verb, containing quantified metrics where possible.",
                "ATS-friendly resume bullet 2..."
              ],
              "linkedInSummary": "A natural, professional project summary in 100-200 words suitable for a LinkedIn 'About' or project section, avoiding AI jargon and buzzword overload.",
              "interviewTopics": [
                "Potential technical interview topic 1 based on their work",
                "Potential technical interview topic 2..."
              ]
            }
            
            Strict Guidelines:
            1. contributionSummary: Generate 4 to 8 detailed bullets. Reference specific engineering areas, technologies, and quantified metrics from the profile above.
            2. resumeBullets: Generate 5 to 10 highly-polished bullets starting with strong action verbs. Use the actual commit count, line counts, file counts, and technology stack provided.
            3. linkedInSummary: Must be 100 to 200 words, sound natural and written in first-person ("I") or professional third-person, focusing on engineering impact. Mention specific technologies used.
            4. interviewTopics: Generate 4 to 6 relevant concepts to study for interviews, directly tied to the engineering areas and technologies listed above.
            5. Do NOT invent technologies or frameworks not listed in the profile.
            6. Return ONLY the JSON. Verify JSON validity before outputting.
            """.formatted(
                context.getRepositoryName(),
                context.getTotalCommits(),
                context.getFilesModified(),
                context.getLinesAdded(),
                context.getLinesDeleted(),
                context.getContributionPeriod(),
                areasText,
                activitiesText,
                techText,
                breakdownText,
                foldersText,
                keywordsText,
                extensionsText
        );
    }
}
