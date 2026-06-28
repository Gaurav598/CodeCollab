package com.collabcode.room.service;

import com.collabcode.room.domain.Room;
import com.collabcode.room.repository.RoomRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class RoomCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(RoomCleanupService.class);

    private final RoomRepository roomRepository;
    private final RoomService roomService;

    public RoomCleanupService(RoomRepository roomRepository, RoomService roomService) {
        this.roomRepository = roomRepository;
        this.roomService = roomService;
    }

    // Runs every hour
    @Scheduled(fixedRate = 3600000)
    public void cleanupInactiveRooms() {
        logger.info("Starting scheduled cleanup of inactive rooms...");
        Instant oneDayAgo = Instant.now().minus(1, ChronoUnit.DAYS);
        List<Room> inactiveRooms = roomRepository.findByLastActiveAtBefore(oneDayAgo);
        
        int deletedCount = 0;
        for (Room room : inactiveRooms) {
            try {
                logger.info("Deleting inactive room: {}", room.getRoomCode());
                roomService.deleteRoomInternal(room);
                deletedCount++;
            } catch (Exception e) {
                logger.error("Failed to delete inactive room: {}", room.getRoomCode(), e);
            }
        }
        logger.info("Cleanup finished. Deleted {} inactive rooms.", deletedCount);
    }
}
