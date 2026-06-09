package com.devtrace.backend.git;

import com.devtrace.backend.model.FileChangeResult;
import org.eclipse.jgit.diff.DiffEntry;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Analyzes file-level changes across all contributor commits.
 * Tracks extension frequencies, change types (ADD/MODIFY/DELETE),
 * and derives technology indicators from file extensions.
 */
@Component
public class FileChangeAnalyzer {

    // ── Extension → Technology mapping ───────────────────────
    private static final Map<String, String> EXTENSION_TECH_MAP = Map.ofEntries(
            Map.entry(".java", "Java"),
            Map.entry(".kt", "Kotlin"),
            Map.entry(".scala", "Scala"),
            Map.entry(".py", "Python"),
            Map.entry(".rb", "Ruby"),
            Map.entry(".go", "Go"),
            Map.entry(".rs", "Rust"),
            Map.entry(".cs", "C#"),
            Map.entry(".cpp", "C++"),
            Map.entry(".c", "C"),
            Map.entry(".ts", "TypeScript"),
            Map.entry(".tsx", "React"),
            Map.entry(".js", "JavaScript"),
            Map.entry(".jsx", "React"),
            Map.entry(".vue", "Vue.js"),
            Map.entry(".svelte", "Svelte"),
            Map.entry(".html", "HTML"),
            Map.entry(".css", "CSS"),
            Map.entry(".scss", "SCSS"),
            Map.entry(".less", "LESS"),
            Map.entry(".sql", "SQL"),
            Map.entry(".graphql", "GraphQL"),
            Map.entry(".proto", "Protocol Buffers"),
            Map.entry(".dart", "Flutter/Dart"),
            Map.entry(".swift", "Swift"),
            Map.entry(".m", "Objective-C"),
            Map.entry(".xml", "XML"),
            Map.entry(".yml", "YAML"),
            Map.entry(".yaml", "YAML"),
            Map.entry(".json", "JSON"),
            Map.entry(".sh", "Shell"),
            Map.entry(".bash", "Shell"),
            Map.entry(".ps1", "PowerShell"),
            Map.entry(".tf", "Terraform"),
            Map.entry(".Dockerfile", "Docker"),
            Map.entry(".gradle", "Gradle"),
            Map.entry(".md", "Markdown")
    );

    // Mutable accumulators — reset per analysis run
    private final Map<String, Integer> extensionFrequency = new HashMap<>();
    private int filesAdded;
    private int filesModified;
    private int filesDeleted;

    /** Reset state for a new analysis run. */
    public void reset() {
        extensionFrequency.clear();
        filesAdded = 0;
        filesModified = 0;
        filesDeleted = 0;
    }

    /**
     * Accumulate statistics from a single commit's diff entries.
     */
    public void processDiffs(List<DiffEntry> diffs) {
        for (DiffEntry diff : diffs) {
            // Track change type
            switch (diff.getChangeType()) {
                case ADD -> filesAdded++;
                case MODIFY -> filesModified++;
                case DELETE -> filesDeleted++;
                case RENAME, COPY -> filesModified++;
            }

            // Track extension
            String path = diff.getChangeType() == DiffEntry.ChangeType.DELETE
                    ? diff.getOldPath()
                    : diff.getNewPath();

            String ext = extractExtension(path);
            if (ext != null && !ext.isEmpty()) {
                extensionFrequency.merge(ext, 1, Integer::sum);
            }
        }
    }

    /**
     * Build the final result after all commits have been processed.
     */
    public FileChangeResult buildResult() {
        List<String> technologies = extensionFrequency.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .filter(EXTENSION_TECH_MAP::containsKey)
                .map(EXTENSION_TECH_MAP::get)
                .distinct()
                .limit(8)
                .collect(Collectors.toList());

        return new FileChangeResult(
                new HashMap<>(extensionFrequency),
                filesAdded,
                filesModified,
                filesDeleted,
                technologies
        );
    }

    private String extractExtension(String filePath) {
        if (filePath == null || filePath.equals("/dev/null") || filePath.isBlank()) {
            return null;
        }
        // Handle Dockerfile specially
        String fileName = filePath.contains("/")
                ? filePath.substring(filePath.lastIndexOf('/') + 1)
                : filePath;
        if (fileName.equals("Dockerfile") || fileName.startsWith("Dockerfile.")) {
            return ".Dockerfile";
        }

        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(dotIndex).toLowerCase();
    }
}
