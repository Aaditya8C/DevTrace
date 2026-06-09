package com.devtrace.backend.git;

import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.diff.Edit;
import org.eclipse.jgit.diff.RawTextComparator;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.patch.FileHeader;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.EmptyTreeIterator;
import org.eclipse.jgit.util.io.DisabledOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
public class CommitAnalyzer {
    private static final Logger log = LoggerFactory.getLogger(CommitAnalyzer.class);

    public CommitStats analyzeCommit(Repository repository, RevCommit commit) {
        int added = 0;
        int deleted = 0;
        int files = 0;

        try (DiffFormatter df = new DiffFormatter(DisabledOutputStream.INSTANCE);
             RevWalk walk = new RevWalk(repository)) {
            df.setRepository(repository);
            df.setDiffComparator(RawTextComparator.DEFAULT);
            df.setDetectRenames(true);

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

            for (DiffEntry diff : diffs) {
                FileHeader fileHeader = df.toFileHeader(diff);
                for (Edit edit : fileHeader.toEditList()) {
                    added += edit.getLengthB();
                    deleted += edit.getLengthA();
                }
                files++;
            }
        } catch (IOException e) {
            log.warn("Failed to analyze diff for commit {}", commit.getName(), e);
        }

        return new CommitStats(commit, files, added, deleted);
    }
}
