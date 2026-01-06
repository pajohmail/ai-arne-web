# Services Layer - Business Logic

## Status: PARTIALLY IMPLEMENTED

This directory contains the business logic layer for the SirenOOP application.

### Implemented Services:
- ✅ `DesignArchitectService` - Main orchestration service. Manages the 4-phase design workflow (Analysis, System Design, Object Design, Validation).
- ✅ `DesignPatternAdvisor` - Analyses requirements to suggest appropriate design patterns (GoF, GRASP).
- ✅ `PromptFactory` - Generates context-aware prompts for the AI (Vertex AI) based on current phase and user input.

### Interfaces (Contracts):
- `IDesignArchitectService`
- `IQuestionGeneratorService`
- `IMermaidGeneratorService`

### Dependencies:
These services rely on the Repository layer for external communications:
- `IVertexAIRepository` (AI interactions)
- `IFirestoreRepository` (Persistence)
- `IGoogleDriveRepository` (Document storage)

### Testing:
- Unit tests are located in `tests/services/`.
- Run tests with `npm test`.
