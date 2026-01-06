# Services Layer - Business Logic

## Status: INTERFACES ONLY

This directory contains interface definitions for the business logic layer.

### Defined Interfaces:
- ✅ `IDesignArchitectService` - Main orchestration service
- ✅ `IQuestionGeneratorService` - Discovery question generation
- ✅ `IMermaidGeneratorService` - Diagram generation

### Implementation Status:
- ❌ **NOT IMPLEMENTED** - These services are defined but not implemented
- 🔜 **NEXT PHASE** - Another AI agent will implement these

### For Next Developer:

When implementing these services:

1. **Follow TDD** - Write tests first
2. **Use Repository Interfaces** - Depend on abstractions, not concrete classes
3. **Single Responsibility** - Each service has one clear purpose
4. **Dependency Injection** - Constructor injection pattern

Example:
\`\`\`typescript
export class QuestionGeneratorService implements IQuestionGeneratorService {
  constructor(
    private vertexAIRepo: IVertexAIRepository,
    private firestoreRepo: IFirestoreRepository
  ) {}

  async generate(description: string): Promise<Question[]> {
    // Your implementation here
  }
}
\`\`\`

### Available Repositories (Ready to Use):
- ✅ `AuthRepository`
- ✅ `GoogleDriveRepository`
- ✅ `VertexAIRepository`
- ✅ `FirestoreRepository`

See `HANDOFF.md` for complete implementation guide.
