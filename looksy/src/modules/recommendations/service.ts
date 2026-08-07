import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { MemoriesRepository } from "./repository";
import type { CreateMemoryInput, EvidenceInput, MemoryQuery } from "./types";

const STATUS_THRESHOLDS: Array<[number, string]> = [
  [0.8, "confirmed"],
  [0.6, "possible"],
  [0.4, "emerging"],
  [0.2, "fading"],
  [0, "dormant"],
];

export function computeStatusFromConfidence(confidence: number): string {
  for (const [threshold, status] of STATUS_THRESHOLDS) {
    if (confidence >= threshold) {
      return status;
    }
  }
  return "dormant";
}

export class FashionMemoryService {
  constructor(private readonly repository: MemoriesRepository) {}

  async getMemories(userId: string, query: MemoryQuery = {}) {
    return this.repository.findMemories(userId, {
      status: query.status ?? "confirmed",
      ...query,
    });
  }

  async getMemoryWithEvidence(userId: string, memoryId: string) {
    const memory = await this.verifyOwnership(userId, memoryId);
    const evidence = await this.repository.findEvidence(memory.id);
    return { ...memory, evidence };
  }

  async addMemory(userId: string, input: CreateMemoryInput) {
    if (input.confidence !== undefined && (input.confidence < 0 || input.confidence > 1)) {
      throw new ValidationError("confidence must be between 0 and 1", { confidence: input.confidence });
    }
    const memory = await this.repository.insertMemory(userId, input);
    const evidence = await this.repository.findEvidence(memory.id);
    return { ...memory, evidence };
  }

  async addEvidence(userId: string, memoryId: string, input: EvidenceInput) {
    await this.verifyOwnership(userId, memoryId);
    return this.repository.insertEvidence(memoryId, input);
  }

  async updateConfidence(userId: string, memoryId: string, confidence: number) {
    if (confidence < 0 || confidence > 1) {
      throw new ValidationError("confidence must be between 0 and 1", { confidence });
    }
    const memory = await this.verifyOwnership(userId, memoryId);
    const updated = await this.repository.updateMemory(memory.id, {
      confidence,
      status: computeStatusFromConfidence(confidence),
      lastSignalAt: new Date(),
    });
    return updated;
  }

  async confirmMemory(userId: string, memoryId: string) {
    const memory = await this.verifyOwnership(userId, memoryId);
    const confirmed = await this.repository.updateMemory(memory.id, {
      confidence: Math.max(memory.confidence, 0.8),
      status: "confirmed",
      userConfirmedAt: new Date(),
      lastConfirmed: new Date(),
    });
    return confirmed;
  }

  async rejectMemory(userId: string, memoryId: string, correctionText?: string) {
    const memory = await this.verifyOwnership(userId, memoryId);
    return this.repository.updateMemory(memory.id, {
      status: "deleted",
      deletedAt: new Date(),
      userCorrectedAt: new Date(),
      correctionText: correctionText ?? null,
    });
  }

  async correctMemory(userId: string, memoryId: string, input: { description?: string; correctionText?: string }) {
    const memory = await this.verifyOwnership(userId, memoryId);
    if (!input.description && !input.correctionText) {
      throw new ValidationError("provide description or correctionText to correct a memory");
    }
    return this.repository.updateMemory(memory.id, {
      description: input.description ?? memory.description,
      correctionText: input.correctionText ?? memory.correctionText,
      userCorrectedAt: new Date(),
    });
  }

  private async verifyOwnership(userId: string, memoryId: string) {
    const memory = await this.repository.findMemoryById(memoryId);
    if (!memory) {
      throw new NotFoundError("Fashion memory", memoryId);
    }
    if (memory.userId !== userId) {
      throw new ForbiddenError("This memory belongs to another user");
    }
    return memory;
  }
}
