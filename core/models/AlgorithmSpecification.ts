/**
 * Algorithm Specification Model
 * Provides detailed pseudocode and flowchart specifications for operations
 * to enable AI code generation of business logic
 */

export interface AlgorithmSpecification {
  operation: string;              // Operation name (from contract)
  purpose: string;                // What does this algorithm do?
  inputParameters: Parameter[];   // Input data
  outputType: string;             // Return type
  pseudocode: string;             // Structured pseudocode
  flowChart?: string;             // Mermaid flowchart (optional)
  complexity: ComplexityAnalysis;
  edgeCases: EdgeCase[];          // Special cases to handle
  examples: AlgorithmExample[];
}

export interface Parameter {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  defaultValue?: any;
}

export interface ComplexityAnalysis {
  time: string;                   // O(n), O(log n), O(n²), etc.
  space: string;                  // O(1), O(n), etc.
  explanation?: string;           // Why this complexity?
}

export interface EdgeCase {
  condition: string;              // "Empty list", "Null input", "Negative value"
  handling: string;               // How is this case handled?
  expectedBehavior: string;       // What should happen?
}

export interface AlgorithmExample {
  input: any;                     // Example input values
  output: any;                    // Expected output
  explanation: string;            // Step-by-step explanation
}

/**
 * Pseudocode notation standards:
 * - IF/ELSE for conditionals
 * - FOR/WHILE for loops
 * - FUNCTION calls
 * - RETURN statements
 * - Variable assignments
 *
 * Example:
 * ```
 * STEP 1: Initialize result = 0
 * STEP 2: FOR each item in items
 *   STEP 2.1: IF item.isValid THEN
 *     STEP 2.1.1: result = result + item.value
 *   STEP 2.2: END IF
 * STEP 3: END FOR
 * STEP 4: RETURN result
 * ```
 */
