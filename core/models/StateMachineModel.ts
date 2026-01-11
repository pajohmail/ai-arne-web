/**
 * Verified State Machine Model
 * Provides formal state machine specifications with property verification
 * to enable AI generation of correct state transition code
 */

export interface StateMachineSpecification {
  stateMachines: VerifiedStateMachine[];
  completed: boolean;
}

export interface VerifiedStateMachine {
  id: string;
  name: string;
  entity: string;                // Which entity (Order, User, Workflow, etc.)
  description: string;
  type: StateMachineType;
  states: StateDefinition[];
  transitions: TransitionDefinition[];
  initialState: string;
  finalStates: string[];
  errorStates: string[];
  invariants: StateMachineInvariant[];
  properties: StateMachineProperty[];
  mermaidDiagram: string;        // UML state diagram
  formalSpec?: string;           // TLA+/Alloy specification
  testCases: StateMachineTestCase[];
}

export type StateMachineType =
  | 'Simple'                     // Basic state machine
  | 'Hierarchical'               // Nested states (substates)
  | 'Concurrent'                 // Parallel regions
  | 'Timed';                     // Time-dependent transitions

export interface StateDefinition {
  id: string;
  name: string;
  type: StateType;
  entryActions?: Action[];       // Execute when entering state
  exitActions?: Action[];        // Execute when leaving state
  doActions?: Action[];          // Execute while in state
  allowedOperations: string[];   // Which operations are allowed
  invariants?: string[];         // Conditions that must hold in this state
  timeout?: TimeoutConfig;       // Auto-transition after timeout
  substates?: StateDefinition[]; // For hierarchical state machines
}

export type StateType =
  | 'Initial'                    // Starting state
  | 'Normal'                     // Regular state
  | 'Final'                      // End state (successful)
  | 'Error'                      // Error state
  | 'Choice'                     // Decision point
  | 'Fork'                       // Split into concurrent substates
  | 'Join';                      // Merge concurrent substates

export interface Action {
  type: 'Call' | 'Send' | 'Assign' | 'Log' | 'Validate';
  target: string;                // Function/method to call or variable to assign
  parameters?: Record<string, any>;
  description: string;
}

export interface TimeoutConfig {
  duration: number;              // Milliseconds
  targetState: string;           // State to transition to
  action?: Action;               // Optional action on timeout
}

export interface TransitionDefinition {
  id: string;
  from: string;                  // Source state ID
  to: string;                    // Target state ID
  trigger: TriggerDefinition;
  guard?: GuardCondition;        // Condition for transition
  actions?: Action[];            // Actions to execute during transition
  priority?: number;             // For conflict resolution (higher = more priority)
  description: string;
}

export interface TriggerDefinition {
  type: TriggerType;
  event?: string;                // Event name
  condition?: string;            // Additional condition
}

export type TriggerType =
  | 'Event'                      // External event
  | 'Completion'                 // State activities completed
  | 'Time'                       // Time-based
  | 'Change'                     // Variable change
  | 'Call';                      // Method call

export interface GuardCondition {
  expression: string;            // Boolean expression
  variables: string[];           // Variables used in expression
  description: string;
}

export interface StateMachineInvariant {
  id: string;
  name: string;
  expression: string;            // Formal expression
  description: string;
  scope: 'Global' | 'State' | 'Transition';
  appliesTo?: string[];          // State/transition IDs
  critical: boolean;
}

export interface StateMachineProperty {
  id: string;
  name: string;
  type: PropertyType;
  formula: string;               // Formal logic formula
  description: string;
  verificationMethod: 'Model Checking' | 'Theorem Proving' | 'Testing';
  verificationStatus?: 'Verified' | 'Violated' | 'Unknown';
}

export type PropertyType =
  | 'Safety'                     // Bad states never reached
  | 'Liveness'                   // Good states eventually reached
  | 'Reachability'               // All states reachable
  | 'Deadlock Freedom'           // No deadlock states
  | 'Determinism'                // At most one transition per event
  | 'Completeness';              // All events handled in all states

export interface StateMachineTestCase {
  id: string;
  name: string;
  description: string;
  initialState: string;
  eventSequence: TestEvent[];
  expectedFinalState: string;
  expectedActions: string[];
  shouldSucceed: boolean;
  violatesProperty?: string;     // If testing property violation
}

export interface TestEvent {
  event: string;
  parameters?: Record<string, any>;
  expectedState: string;         // Expected state after this event
  expectedGuard?: boolean;       // Whether guard should pass
}

/**
 * Example State Machine - Order Lifecycle:
 *
 * States:
 * - Created (Initial)
 * - PaymentPending
 * - Paid
 * - Processing
 * - Shipped
 * - Delivered (Final)
 * - Cancelled (Final)
 * - Failed (Error)
 *
 * Transitions:
 * - Created -> PaymentPending [submit]
 * - PaymentPending -> Paid [payment_success]
 * - PaymentPending -> Failed [payment_failed]
 * - PaymentPending -> Cancelled [cancel / refund]
 * - Paid -> Processing [start_processing]
 * - Processing -> Shipped [ship / send_notification]
 * - Shipped -> Delivered [confirm_delivery]
 * - [any state] -> Cancelled [cancel / refund if paid]
 *
 * Invariants:
 * - order.total > 0 (in all states)
 * - order.items.length > 0 (in all states except Cancelled/Failed)
 * - order.payment != null (in Paid, Processing, Shipped, Delivered)
 * - order.shipment != null (in Shipped, Delivered)
 *
 * Properties:
 * - Safety: Never reach Delivered without payment
 * - Liveness: Every order eventually reaches a final state
 * - Reachability: All non-error states are reachable
 */

/**
 * Example Mermaid State Diagram:
 *
 * ```mermaid
 * stateDiagram-v2
 *   [*] --> Created
 *   Created --> PaymentPending : submit
 *   PaymentPending --> Paid : payment_success
 *   PaymentPending --> Failed : payment_failed
 *   PaymentPending --> Cancelled : cancel
 *   Paid --> Processing : start_processing
 *   Processing --> Shipped : ship
 *   Shipped --> Delivered : confirm_delivery
 *   Delivered --> [*]
 *   Created --> Cancelled : cancel
 *   Paid --> Cancelled : cancel
 *   Cancelled --> [*]
 *   Failed --> [*]
 *
 *   note right of PaymentPending
 *     Timeout: 30 minutes
 *     Auto-cancel if no payment
 *   end note
 * ```
 */

/**
 * Example TLA+ State Machine Specification:
 *
 * ```tla
 * ---- MODULE OrderStateMachine ----
 * EXTENDS Naturals, Sequences
 *
 * CONSTANTS
 *   OrderIds
 *
 * VARIABLES
 *   orderState,
 *   orderData
 *
 * States == {
 *   "Created",
 *   "PaymentPending",
 *   "Paid",
 *   "Processing",
 *   "Shipped",
 *   "Delivered",
 *   "Cancelled",
 *   "Failed"
 * }
 *
 * InitialStates == {"Created"}
 * FinalStates == {"Delivered", "Cancelled", "Failed"}
 * ErrorStates == {"Failed"}
 *
 * TypeInvariant ==
 *   /\ orderState \in [OrderIds -> States]
 *   /\ \A o \in OrderIds :
 *        orderState[o] \in {"Paid", "Processing", "Shipped", "Delivered"}
 *        => orderData[o].payment /= NULL
 *
 * Init ==
 *   /\ orderState = [o \in OrderIds |-> "Created"]
 *   /\ orderData = [o \in OrderIds |-> [
 *        total |-> 0,
 *        payment |-> NULL,
 *        shipment |-> NULL
 *      ]]
 *
 * Submit(order) ==
 *   /\ orderState[order] = "Created"
 *   /\ orderData[order].total > 0
 *   /\ orderState' = [orderState EXCEPT ![order] = "PaymentPending"]
 *   /\ UNCHANGED orderData
 *
 * PaymentSuccess(order) ==
 *   /\ orderState[order] = "PaymentPending"
 *   /\ orderState' = [orderState EXCEPT ![order] = "Paid"]
 *   /\ orderData' = [orderData EXCEPT
 *        ![order].payment = "completed"]
 *
 * Ship(order) ==
 *   /\ orderState[order] = "Processing"
 *   /\ orderState' = [orderState EXCEPT ![order] = "Shipped"]
 *   /\ orderData' = [orderData EXCEPT
 *        ![order].shipment = "shipped"]
 *
 * (* Properties *)
 * NeverDeliverWithoutPayment ==
 *   \A o \in OrderIds :
 *     orderState[o] = "Delivered" => orderData[o].payment /= NULL
 *
 * EventuallyFinal ==
 *   \A o \in OrderIds :
 *     <>(orderState[o] \in FinalStates)
 *
 * THEOREM Spec => []NeverDeliverWithoutPayment
 * THEOREM Spec => []<>EventuallyFinal
 * ====
 * ```
 */

/**
 * Example Test Cases:
 *
 * Test 1: Happy Path
 * - Events: [submit, payment_success, start_processing, ship, confirm_delivery]
 * - Expected: Created -> PaymentPending -> Paid -> Processing -> Shipped -> Delivered
 *
 * Test 2: Payment Failure
 * - Events: [submit, payment_failed]
 * - Expected: Created -> PaymentPending -> Failed
 *
 * Test 3: Early Cancellation
 * - Events: [submit, cancel]
 * - Expected: Created -> PaymentPending -> Cancelled
 *
 * Test 4: Late Cancellation
 * - Events: [submit, payment_success, cancel]
 * - Expected: Created -> PaymentPending -> Paid -> Cancelled
 * - Action: Refund payment
 *
 * Test 5: Invalid Transition (violates safety)
 * - Events: [submit, ship]
 * - Expected: Error (cannot ship from PaymentPending)
 */
