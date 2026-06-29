package com.collabcode.room.service;

import com.collabcode.common.exception.ApiException;
import com.collabcode.room.domain.SavedCode;
import com.collabcode.room.repository.SavedCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SavedCodeService {

    private final SavedCodeRepository savedCodeRepository;

    public SavedCodeService(SavedCodeRepository savedCodeRepository) {
        this.savedCodeRepository = savedCodeRepository;
    }

    @Transactional
    public Map<String, Object> saveCode(UUID userId, String roomCode, String fileName, String language, String code) {
        // We could check if a file with this exact name exists for this user and roomCode to update, 
        // but it's often fine to just create a new one, or we can search for an existing one.
        // Let's create a new one or update if same name and room
        SavedCode existing = savedCodeRepository.findAllByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .filter(sc -> sc.getRoomCode().equals(roomCode) && sc.getFileName().equals(fileName))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            existing.setCode(code);
            existing.setLanguage(language);
            savedCodeRepository.save(existing);
            return toDto(existing);
        }

        SavedCode newCode = SavedCode.create(userId, roomCode, fileName, language, code);
        savedCodeRepository.save(newCode);
        return toDto(newCode);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserSavedCodes(UUID userId) {
        return savedCodeRepository.findAllByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(SavedCodeService::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSavedCode(UUID id, UUID userId) {
        SavedCode savedCode = savedCodeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("SAVED_CODE_NOT_FOUND", "Saved code not found"));
        if (!savedCode.getUserId().equals(userId)) {
            throw ApiException.forbidden("FORBIDDEN", "Not allowed to access this saved code");
        }
        return toDto(savedCode);
    }

    @Transactional
    public void deleteSavedCode(UUID id, UUID userId) {
        SavedCode savedCode = savedCodeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("SAVED_CODE_NOT_FOUND", "Saved code not found"));
        if (!savedCode.getUserId().equals(userId)) {
            throw ApiException.forbidden("FORBIDDEN", "Not allowed to delete this saved code");
        }
        savedCodeRepository.delete(savedCode);
    }

    public static Map<String, Object> toDto(SavedCode sc) {
        return Map.of(
                "id", sc.getId().toString(),
                "roomCode", sc.getRoomCode(),
                "fileName", sc.getFileName(),
                "language", sc.getLanguage(),
                "code", sc.getCode() != null ? sc.getCode() : "",
                "savedAt", sc.getSavedAt().toString(),
                "updatedAt", sc.getUpdatedAt().toString()
        );
    }
}
