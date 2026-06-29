package com.collabcode.room.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;
import org.bson.Document;
import java.util.List;

@Component
public class DataMigration implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    public DataMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- RUNNING DATA MIGRATION ---");
        
        List<Document> files = mongoTemplate.findAll(Document.class, "files");
        for (Document file : files) {
            if (!file.containsKey("room_id") || file.get("room_id") == null) {
                Object projectId = file.get("project_id");
                if (projectId != null) {
                    Document project = mongoTemplate.findById(projectId, Document.class, "projects");
                    if (project != null) {
                        Object roomId = project.get("room_id");
                        if (roomId != null) {
                            file.put("room_id", roomId);
                            mongoTemplate.save(file, "files");
                            System.out.println("Migrated file " + file.get("_id") + " to room " + roomId);
                        }
                    } else {
                        System.out.println("Orphaned file " + file.get("_id") + " (project not found), deleting...");
                        mongoTemplate.remove(file, "files");
                    }
                } else {
                    System.out.println("Invalid file " + file.get("_id") + " (no room_id and no project_id), deleting...");
                    mongoTemplate.remove(file, "files");
                }
            }
        }
        System.out.println("--- DATA MIGRATION COMPLETE ---");
    }
}
