package com.devtrace.backend.git;

import com.devtrace.backend.exception.GitException;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

@Component
public class RepositoryCloner {
    private static final Logger log = LoggerFactory.getLogger(RepositoryCloner.class);

    public void cloneRepository(String repositoryUrl, Path destinationPath) {
        cloneRepository(repositoryUrl, destinationPath, null);
    }

    public void cloneRepository(String repositoryUrl, Path destinationPath, String token) {
        log.info("Cloning repository {} to {} (token present: {})", repositoryUrl, destinationPath, token != null && !token.isEmpty());
        try {
            var cloner = Git.cloneRepository()
                    .setURI(repositoryUrl)
                    .setDirectory(destinationPath.toFile())
                    .setCloneAllBranches(false)
                    .setNoCheckout(false);

            if (token != null && !token.trim().isEmpty()) {
                cloner.setCredentialsProvider(new org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider(token, ""));
            }

            cloner.call().close();
            log.info("Cloning completed successfully for {}", repositoryUrl);
        } catch (org.eclipse.jgit.api.errors.TransportException e) {
            log.error("Transport error cloning repository {}: {}", repositoryUrl, e.getMessage());
            throw new GitException("Repository not found or access denied. Please verify your credentials or repository permissions.", e);
        } catch (GitAPIException e) {
            log.error("Failed to clone repository {}", repositoryUrl, e);
            throw new GitException("Failed to clone repository: " + e.getMessage(), e);
        }
    }

    public void deleteRepository(Path destinationPath) throws IOException {
        log.info("Deleting repository path {}", destinationPath);
        if (Files.exists(destinationPath)) {
            try (var stream = Files.walk(destinationPath)) {
                stream.sorted(Comparator.reverseOrder())
                      .map(Path::toFile)
                      .forEach(file -> {
                          if (!file.delete()) {
                              log.warn("Failed to delete file/directory: {}", file.getAbsolutePath());
                          }
                      });
            }
            log.info("Deleted repository path {} successfully", destinationPath);
        }
    }
}
