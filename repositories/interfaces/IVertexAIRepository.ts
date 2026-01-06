export interface IVertexAIRepository {
    generateText(prompt: string, model?: string): Promise<string>;
    generateWithParameters(
        prompt: string,
        temperature?: number,
        maxTokens?: number
    ): Promise<string>;
}
