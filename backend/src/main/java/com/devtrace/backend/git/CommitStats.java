package com.devtrace.backend.git;

import org.eclipse.jgit.revwalk.RevCommit;

public record CommitStats(
        RevCommit commit,
        int filesModified,
        int linesAdded,
        int linesDeleted
) {}
