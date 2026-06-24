package com.collabcode.room.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a source file within a Project.
 * Named FileEntry to avoid collision with java.io.File.
 */
@Entity
@Table(name = "files",
       uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "path"}))
public class FileEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Relative path within the project, e.g. "src/index.js". */
    @Column(nullable = false, length = 500)
    private String path;

    /** Persisted CRDT snapshot. Live state lives in the Yjs doc in the sync service. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content = "";

    /** Monaco language identifier, e.g. "javascript", "python". */
    @Column(nullable = false, length = 50)
    private String language = "plaintext";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected FileEntry() {}

    public static FileEntry create(Project project, String path, String language) {
        FileEntry f = new FileEntry();
        f.project = project;
        f.path = path;
        f.language = language;
        return f;
    }

    public UUID getId() { return id; }
    public Project getProject() { return project; }
    public String getPath() { return path; }
    public String getContent() { return content; }
    public String getLanguage() { return language; }
    public Instant getCreatedAt() { return createdAt; }

    public void setPath(String path) { this.path = path; }
    public void setContent(String content) { this.content = content; }
    public void setLanguage(String language) { this.language = language; }
}
