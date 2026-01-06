# SirenOOP: Guided Object-Oriented System Design

SirenOOP is an intelligent, guided workflow tool designed to assist developers and students in creating robust Object-Oriented System Designs. It leverages Google Vertex AI to provide real-time feedback, generate design artifacts (Mermaid diagrams), and validiate architectural decisions.

## 🚀 Features

- **Guided 4-Phase Workflow**:
  1.  **Analysis Phase**: Requirement gathering, use case definition, and scope analysis.
  2.  **System Design Phase**: Architecture selection, component identification, and high-level design.
  3.  **Object Design Phase**: Detailed class design, design pattern application (GoF/GRASP), and relationship mapping.
  4.  **Validation Phase**: Verification of the design against requirements, ensuring completeness and correctness.

- **AI-Powered Assistance**:
  - **Design Partner**: Acts as a senior architect pair-programmer.
  - **Pattern Advisor**: Suggests design patterns based on specific problem contexts.
  - **Diagram Generation**: Automatically generates Mermaid.js class and sequence diagrams.

- **Persistent Workspaces**: Projects are saved to Firestore, allowing for long-running design sessions.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend/Services**: TypeScript, Server Actions
- **AI**: Google Vertex AI (Gemini Pro)
- **Database**: Firebase Firestore
- **Storage**: Google Drive Integration

## 🏁 Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    - Ensure your `.env.local` is set up with Firebase and Vertex AI credentials.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
5.  **Open Browser**: Navigate to `http://localhost:3000`.

## 📂 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `presentation/`: UI components (Wizards, Phase views).
- `services/`: Business logic and AI orchestration.
- `repositories/`: Data access layer (Firestore, Vertex AI).
- `core/`: Domain models and types.
- `tests/`: Unit and integration tests.

## 🧪 Testing

Run the test suite with:

```bash
npm test
```
