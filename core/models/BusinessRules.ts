/**
 * Business Rules Model (DMN - Decision Model and Notation)
 * Provides structured decision tables for complex business logic
 * that can be executed by decision engines or converted to code
 */

export interface DecisionTable {
  id: string;
  name: string;
  description: string;
  hitPolicy: HitPolicy;           // How to evaluate multiple matching rules
  inputs: DecisionInput[];
  outputs: DecisionOutput[];
  rules: DecisionRule[];
  dmnXml?: string;                // Standard DMN XML (optional)
}

export type HitPolicy =
  | 'UNIQUE'      // Only one rule matches
  | 'FIRST'       // Return first matching rule
  | 'PRIORITY'    // Return highest priority match
  | 'ANY'         // Any match is valid
  | 'COLLECT';    // Collect all matching outputs

export interface DecisionInput {
  id: string;
  label: string;
  expression: string;             // FEEL expression or property path (e.g., "customer.type")
  type: 'string' | 'number' | 'boolean' | 'date';
  allowedValues?: any[];          // Optional: restrict to specific values
}

export interface DecisionOutput {
  id: string;
  label: string;
  name: string;                   // Output variable name
  type: 'string' | 'number' | 'boolean' | 'object';
}

export interface DecisionRule {
  inputEntries: string[];         // Conditions for each input (e.g., ['"Premium"', '> 1000'])
  outputEntries: string[];        // Values for each output (e.g., ['20', 'true'])
  description?: string;
  priority?: number;              // Used with PRIORITY hit policy
}

/**
 * Example Decision Table (Pricing Logic):
 *
 * Inputs: Customer Type, Order Amount
 * Outputs: Discount %, Priority Shipping
 *
 * | Customer Type | Order Amount | Discount % | Priority Shipping |
 * |--------------|--------------|------------|-------------------|
 * | "Premium"    | > 1000       | 20         | true              |
 * | "Premium"    | > 500        | 15         | true              |
 * | "Standard"   | > 1000       | 10         | false             |
 * | "Standard"   | > 500        | 5          | false             |
 * | *            | *            | 0          | false             |
 */

/**
 * FEEL (Friendly Enough Expression Language) Examples:
 * - Comparisons: >, <, >=, <=, =, !=
 * - Ranges: [100..500], ]0..100[
 * - Lists: "Premium", "Gold", "Silver"
 * - Wildcards: * (any value)
 * - Functions: sum(), count(), min(), max()
 */

export interface BusinessRulesSpecification {
  decisionTables: DecisionTable[];
  dmnDiagrams?: string[];         // Mermaid or DMN XML diagrams
  completed: boolean;
}
