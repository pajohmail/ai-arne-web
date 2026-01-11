/**
 * Security Model & Threat Analysis
 * Provides authentication/authorization specifications and threat modeling
 * to enable AI generation of secure implementation code
 */

export interface SecuritySpecification {
  authenticationStrategy: AuthenticationStrategy;
  authorizationModel: AuthorizationModel;
  threatModel: ThreatModel;
  securityControls: SecurityControl[];
  dataProtection: DataProtection;
  completed: boolean;
}

// Authentication Strategy
export interface AuthenticationStrategy {
  type: AuthType;
  provider?: string;              // "Auth0", "Firebase", "Okta", "Custom"
  tokenStorage: 'Cookie' | 'LocalStorage' | 'SessionStorage' | 'Memory';
  sessionDuration: number;        // Minutes
  refreshStrategy: 'Sliding' | 'Absolute' | 'None';
  mfaRequired: boolean;
  mfaMethod?: 'TOTP' | 'SMS' | 'Email' | 'Biometric';
  passwordPolicy?: PasswordPolicy;
  ssoEnabled?: boolean;
}

export type AuthType =
  | 'JWT'                         // JSON Web Tokens
  | 'Session'                     // Server-side sessions
  | 'OAuth2'                      // OAuth 2.0 flow
  | 'SAML'                        // SAML 2.0
  | 'OpenIDConnect'               // OIDC
  | 'APIKey'                      // API key authentication
  | 'Certificate';                // Mutual TLS / client certificates

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays?: number;
  preventReuse?: number;          // Number of previous passwords to check
}

// Authorization Model
export interface AuthorizationModel {
  type: 'RBAC' | 'ABAC' | 'ReBAC' | 'ACL';
  roles?: Role[];
  permissions?: Permission[];
  policies?: Policy[];
  resourceHierarchy?: ResourceHierarchy;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];          // Permission IDs
  inheritsFrom?: string[];        // Role IDs to inherit from
}

export interface Permission {
  id: string;
  resource: string;               // Resource type (e.g., "user", "document")
  action: string;                 // Action (e.g., "read", "write", "delete")
  conditions?: PolicyCondition[]; // Conditional permissions (ABAC)
  description: string;
}

export interface Policy {
  id: string;
  name: string;
  effect: 'Allow' | 'Deny';
  subjects: string[];             // Role IDs or user IDs
  resources: string[];            // Resource patterns
  actions: string[];              // Action names
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  attribute: string;              // e.g., "time", "location", "userAttribute"
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'contains';
  value: any;
}

export interface ResourceHierarchy {
  resources: ResourceType[];
  relationships: ResourceRelationship[];
}

export interface ResourceType {
  name: string;
  parent?: string;
  attributes: string[];
}

export interface ResourceRelationship {
  from: string;
  to: string;
  type: 'owns' | 'manages' | 'member_of' | 'parent_of';
}

// Threat Model (STRIDE)
export interface ThreatModel {
  methodology: 'STRIDE' | 'PASTA' | 'OCTAVE' | 'DREAD';
  assetInventory: Asset[];
  threats: Threat[];
  mitigations: Mitigation[];
  attackSurface: AttackSurface;
  riskMatrix?: RiskMatrix;
}

export interface Asset {
  id: string;
  name: string;
  type: 'Data' | 'Service' | 'Infrastructure' | 'User';
  sensitivity: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  description: string;
}

export interface Threat {
  id: string;
  category: ThreatCategory;
  name: string;
  description: string;
  likelihood: 'Low' | 'Medium' | 'High' | 'Critical';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';  // likelihood * impact
  affectedAssets: string[];      // Asset IDs
  affectedComponents: string[];  // Component/service names
  attackVector?: string;
  cweId?: string;                // CWE identifier (e.g., "CWE-89" for SQL injection)
  cvssScore?: number;            // CVSS 3.1 score (0-10)
}

export type ThreatCategory =
  | 'Spoofing'                    // Identity spoofing
  | 'Tampering'                   // Data tampering
  | 'Repudiation'                 // Deny actions
  | 'InformationDisclosure'       // Data leakage
  | 'DenialOfService'             // Service disruption
  | 'ElevationOfPrivilege';       // Unauthorized access

export interface Mitigation {
  id: string;
  name: string;
  description: string;
  implementationType: 'Preventive' | 'Detective' | 'Corrective' | 'Compensating';
  status: 'Planned' | 'Implemented' | 'Testing' | 'Verified';
  mitigatesThreats: string[];    // Threat IDs
  cost: 'Low' | 'Medium' | 'High';
  effectiveness: 'Low' | 'Medium' | 'High';
}

export interface AttackSurface {
  entryPoints: EntryPoint[];
  trustBoundaries: TrustBoundary[];
  dataFlows: DataFlow[];
}

export interface EntryPoint {
  id: string;
  name: string;
  type: 'API' | 'WebUI' | 'CLI' | 'Database' | 'FileSystem' | 'Network';
  authentication: boolean;
  encryption: boolean;
  rateLimit: boolean;
  exposedTo: 'Public' | 'Internal' | 'Partner' | 'Admin';
}

export interface TrustBoundary {
  id: string;
  name: string;
  inside: string[];              // Component names inside boundary
  outside: string[];             // Component names outside boundary
  description: string;
}

export interface DataFlow {
  id: string;
  from: string;                  // Component/service name
  to: string;
  data: string;                  // Data type/description
  protocol: string;              // HTTP, gRPC, Message Queue, etc.
  encrypted: boolean;
  authenticated: boolean;
  sensitivity: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
}

export interface RiskMatrix {
  high: Threat[];                // High-priority threats
  medium: Threat[];
  low: Threat[];
  accepted: Threat[];            // Accepted risks
}

// Security Controls
export interface SecurityControl {
  id: string;
  name: string;
  category: SecurityControlCategory;
  type: 'Preventive' | 'Detective' | 'Corrective' | 'Deterrent';
  implementation: string;
  owaspMapping?: string[];       // OWASP Top 10 mappings
  nistrMapping?: string[];       // NIST CSF mappings
  iso27001Mapping?: string[];    // ISO 27001 control IDs
  status: 'Planned' | 'Implemented' | 'Testing' | 'Operational';
}

export type SecurityControlCategory =
  | 'AccessControl'
  | 'DataProtection'
  | 'NetworkSecurity'
  | 'ApplicationSecurity'
  | 'IncidentResponse'
  | 'Monitoring'
  | 'Compliance'
  | 'PhysicalSecurity';

// Data Protection
export interface DataProtection {
  encryptionAtRest: EncryptionConfig;
  encryptionInTransit: EncryptionConfig;
  keyManagement: KeyManagement;
  dataClassification: DataClassification[];
  piiHandling: PIIHandling;
  gdprCompliance?: GDPRCompliance;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;             // "AES-256-GCM", "RSA-4096", "ChaCha20-Poly1305"
  keySize: number;               // bits
  provider?: string;             // "AWS KMS", "Azure Key Vault", "HashiCorp Vault"
}

export interface KeyManagement {
  storage: 'HSM' | 'KMS' | 'Vault' | 'FileSystem' | 'Environment';
  rotationPeriod: number;        // Days
  backupStrategy: string;
}

export interface DataClassification {
  level: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  dataTypes: string[];           // e.g., "userEmail", "creditCard", "medicalRecord"
  retentionPeriod: number;       // Days
  accessRestrictions: string[];
  encryptionRequired: boolean;
  auditLoggingRequired: boolean;
}

export interface PIIHandling {
  identification: string[];      // PII fields identified
  minimization: boolean;         // Collect only necessary PII
  anonymization?: string;        // Anonymization strategy
  pseudonymization?: string;     // Pseudonymization method
  rightToErasure: boolean;       // GDPR Article 17
  dataPortability: boolean;      // GDPR Article 20
}

export interface GDPRCompliance {
  legalBasis: 'Consent' | 'Contract' | 'LegalObligation' | 'VitalInterests' | 'PublicTask' | 'LegitimateInterests';
  dataController: string;
  dataProcessor?: string;
  dpo?: string;                  // Data Protection Officer contact
  privacyPolicy: string;         // URL or document reference
  cookieConsent: boolean;
  dataBreachNotification: boolean;
  dpia?: boolean;                // Data Protection Impact Assessment conducted
}

/**
 * Example Security Specification:
 *
 * {
 *   "authenticationStrategy": {
 *     "type": "JWT",
 *     "provider": "Auth0",
 *     "tokenStorage": "Cookie",
 *     "sessionDuration": 1440,
 *     "mfaRequired": true
 *   },
 *   "authorizationModel": {
 *     "type": "RBAC",
 *     "roles": [
 *       {
 *         "id": "admin",
 *         "name": "Administrator",
 *         "permissions": ["user:read", "user:write", "user:delete"]
 *       }
 *     ]
 *   },
 *   "threatModel": {
 *     "methodology": "STRIDE",
 *     "threats": [
 *       {
 *         "category": "Spoofing",
 *         "name": "Credential theft via phishing",
 *         "likelihood": "Medium",
 *         "impact": "High",
 *         "cweId": "CWE-287"
 *       }
 *     ]
 *   }
 * }
 */
