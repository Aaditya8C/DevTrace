package com.devtrace.backend.git;

import com.devtrace.backend.exception.GitException;
import com.devtrace.backend.model.FileChangeResult;
import com.devtrace.backend.model.RawContributionData;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.diff.Edit;
import org.eclipse.jgit.diff.RawTextComparator;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.patch.FileHeader;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.EmptyTreeIterator;
import org.eclipse.jgit.util.io.DisabledOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/**
 * Performs a single-pass traversal of all contributor commits, feeding
 * each commit's data to every analyzer simultaneously. Replaces the
 * old dual-traversal in ContributionExtractor.
 */
@Component
public class ContributionAggregator {
    private static final Logger log = LoggerFactory.getLogger(ContributionAggregator.class);

    private final FileChangeAnalyzer fileChangeAnalyzer;
    private final FolderAnalyzer folderAnalyzer;
    private final KeywordAnalyzer keywordAnalyzer;

    public ContributionAggregator(
            FileChangeAnalyzer fileChangeAnalyzer,
            FolderAnalyzer folderAnalyzer,
            KeywordAnalyzer keywordAnalyzer
    ) {
        this.fileChangeAnalyzer = fileChangeAnalyzer;
        this.folderAnalyzer = folderAnalyzer;
        this.keywordAnalyzer = keywordAnalyzer;
    }

    /**
     * Walk every commit in the repository once, filter by author,
     * and feed commit data to all analyzers.
     *
     * @param repoPath path to the cloned repository
     * @param githubUsername the contributor username to match
     * @return aggregated raw data from all analyzers
     */
    public RawContributionData aggregate(Path repoPath, String githubUsername) {
        log.info("Starting single-pass contribution aggregation for user {} from {}", githubUsername, repoPath);
        File gitDir = new File(repoPath.toFile(), ".git");
        String repositoryName = repoPath.getFileName().toString();

        // Reset all analyzers for this run
        fileChangeAnalyzer.reset();
        folderAnalyzer.reset();
        keywordAnalyzer.reset();

        int totalCommits = 0;
        int totalFilesModified = 0;
        int totalLinesAdded = 0;
        int totalLinesDeleted = 0;
        LocalDate firstCommitDate = null;
        LocalDate lastCommitDate = null;
        List<String> commitMessages = new ArrayList<>();

        try (Repository repository = new FileRepositoryBuilder().setGitDir(gitDir).build();
             Git git = new Git(repository);
             DiffFormatter df = new DiffFormatter(DisabledOutputStream.INSTANCE);
             RevWalk walk = new RevWalk(repository)) {

            df.setRepository(repository);
            df.setDiffComparator(RawTextComparator.DEFAULT);
            df.setDetectRenames(true);

            Iterable<RevCommit> commits = git.log().call();

            for (RevCommit commit : commits) {
                String authorName = commit.getAuthorIdent().getName();
                String authorEmail = commit.getAuthorIdent().getEmailAddress();

                if (!matchesAuthor(authorName, authorEmail, githubUsername)) {
                    continue;
                }

                totalCommits++;

                // ── Collect commit message ──────────────────
                commitMessages.add(commit.getShortMessage());
                keywordAnalyzer.processCommitMessage(commit.getShortMessage());

                // ── Track commit dates ──────────────────────
                LocalDate commitDate = Instant.ofEpochSecond(commit.getCommitTime())
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();

                if (firstCommitDate == null || commitDate.isBefore(firstCommitDate)) {
                    firstCommitDate = commitDate;
                }
                if (lastCommitDate == null || commitDate.isAfter(lastCommitDate)) {
                    lastCommitDate = commitDate;
                }

                // ── Compute diffs once, feed to all analyzers ──
                List<DiffEntry> diffs;
                try (ObjectReader reader = repository.newObjectReader()) {
                    CanonicalTreeParser commitTree = new CanonicalTreeParser();
                    commitTree.reset(reader, commit.getTree().getId());

                    AbstractTreeIterator parentTree;
                    if (commit.getParentCount() > 0) {
                        RevCommit parent = walk.parseCommit(commit.getParent(0).getId());
                        CanonicalTreeParser pTree = new CanonicalTreeParser();
                        pTree.reset(reader, parent.getTree().getId());
                        parentTree = pTree;
                    } else {
                        parentTree = new EmptyTreeIterator();
                    }

                    diffs = df.scan(parentTree, commitTree);
                }

                // ── Per-diff line statistics ─────────────────
                int commitFiles = 0;
                int commitAdded = 0;
                int commitDeleted = 0;

                for (DiffEntry diff : diffs) {
                    try {
                        FileHeader fileHeader = df.toFileHeader(diff);
                        for (Edit edit : fileHeader.toEditList()) {
                            commitAdded += edit.getLengthB();
                            commitDeleted += edit.getLengthA();
                        }
                    } catch (IOException e) {
                        log.warn("Failed to parse diff for file {} in commit {}", diff.getNewPath(), commit.getName(), e);
                    }
                    commitFiles++;
                }

                totalFilesModified += commitFiles;
                totalLinesAdded += commitAdded;
                totalLinesDeleted += commitDeleted;

                // ── Feed diff entries to specialized analyzers ──
                fileChangeAnalyzer.processDiffs(diffs);
                folderAnalyzer.processDiffs(diffs);
            }

        } catch (Exception e) {
            log.error("Failed to aggregate contributions at {}", repoPath, e);
            throw new GitException("Error aggregating repository contributions: " + e.getMessage(), e);
        }

        log.info("Aggregation complete for {}: {} commits, {} files, +{} -{} lines",
                githubUsername, totalCommits, totalFilesModified, totalLinesAdded, totalLinesDeleted);

        FileChangeResult fileChangeResult = fileChangeAnalyzer.buildResult();

        return new RawContributionData(
                repositoryName,
                totalCommits,
                totalFilesModified,
                totalLinesAdded,
                totalLinesDeleted,
                firstCommitDate,
                lastCommitDate,
                commitMessages,
                folderAnalyzer.getFolderFrequency(),
                fileChangeResult.extensionFrequency(),
                keywordAnalyzer.getKeywordFrequency(),
                fileChangeResult
        );
    }

    private boolean matchesAuthor(String name, String email, String username) {
        if (username == null) return false;
        String lowerUsername = username.toLowerCase();
        boolean nameMatch = name != null && name.toLowerCase().contains(lowerUsername);
        boolean emailMatch = email != null && email.toLowerCase().contains(lowerUsername);
        return nameMatch || emailMatch;
    }
}
