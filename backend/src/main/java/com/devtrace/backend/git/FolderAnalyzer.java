package com.devtrace.backend.git;

import org.eclipse.jgit.diff.DiffEntry;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Tracks folder modification frequency across all contributor commits.
 * Normalizes folder paths to the first two levels to prevent over-fragmentation
 * (e.g., "src/components" instead of "src/components/ui/button").
 */
@Component
public class FolderAnalyzer {

    private final Map<String, Integer> folderFrequency = new HashMap<>();

    /** Reset state for a new analysis run. */
    public void reset() {
        folderFrequency.clear();
    }

    /**
     * Accumulate folder statistics from a single commit's diff entries.
     */
    public void processDiffs(List<DiffEntry> diffs) {
        for (DiffEntry diff : diffs) {
            String path = diff.getChangeType() == DiffEntry.ChangeType.DELETE
                    ? diff.getOldPath()
                    : diff.getNewPath();

            String folder = normalizeFolderPath(path);
            if (folder != null && !folder.isEmpty()) {
                folderFrequency.merge(folder, 1, Integer::sum);
            }
        }
    }

    /** Return the full frequency map (unmodifiable copy). */
    public Map<String, Integer> getFolderFrequency() {
        return Collections.unmodifiableMap(folderFrequency);
    }

    /** Return the top N folders sorted by frequency descending. */
    public List<String> getTopFolders(int limit) {
        return folderFrequency.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * Normalize a file path to its first two directory levels.
     * "src/components/ui/Button.tsx"  → "src/components"
     * "backend/service/UserService.java" → "backend/service"
     * "README.md" → null (root-level file, no folder)
     */
    private String normalizeFolderPath(String filePath) {
        if (filePath == null || filePath.equals("/dev/null") || filePath.isBlank()) {
            return null;
        }

        String[] parts = filePath.split("/");
        if (parts.length <= 1) {
            return null; // root-level file — no meaningful folder
        }
        if (parts.length == 2) {
            return parts[0]; // single folder level: "src/App.tsx" → "src"
        }
        return parts[0] + "/" + parts[1]; // two levels: "src/components/Button.tsx" → "src/components"
    }
}
