/**
 * Observability & Monitoring Model
 * Provides logging, metrics, tracing, and alerting specifications
 * to enable AI generation of observability implementation code
 */

export interface ObservabilitySpecification {
  logging: LoggingConfiguration;
  metrics: MetricsConfiguration;
  tracing: TracingConfiguration;
  alerting: AlertingConfiguration;
  dashboards: Dashboard[];
  slos?: ServiceLevelObjectives;
  completed: boolean;
}

// Logging Configuration
export interface LoggingConfiguration {
  framework: LoggingFramework;
  levels: LogLevel[];
  structuredLogging: boolean;
  destinations: LogDestination[];
  contextFields: string[];       // Fields to always include (requestId, userId, etc.)
  sampling?: SamplingConfig;
  retention: RetentionPolicy;
  sensitiveDataHandling: SensitiveDataHandling;
}

export type LoggingFramework =
  | 'Winston'                     // Node.js
  | 'Pino'                        // Node.js (fast)
  | 'Bunyan'                      // Node.js
  | 'Log4j'                       // Java
  | 'Logback'                     // Java
  | 'Serilog'                     // .NET
  | 'Python Logging'              // Python
  | 'Zap'                         // Go
  | 'Logrus';                     // Go

export type LogLevel =
  | 'TRACE'
  | 'DEBUG'
  | 'INFO'
  | 'WARN'
  | 'ERROR'
  | 'FATAL';

export interface LogDestination {
  type: 'Console' | 'File' | 'Syslog' | 'CloudWatch' | 'Elasticsearch' | 'Datadog' | 'Splunk' | 'Loki';
  config: Record<string, any>;
  filter?: LogFilter;
}

export interface LogFilter {
  minLevel: LogLevel;
  includePatterns?: string[];    // Regex patterns
  excludePatterns?: string[];
}

export interface SamplingConfig {
  enabled: boolean;
  rate: number;                  // 0.0 to 1.0
  rules: SamplingRule[];
}

export interface SamplingRule {
  condition: string;             // Expression (e.g., "level === 'DEBUG'")
  rate: number;
}

export interface RetentionPolicy {
  trace: number;                 // Days
  debug: number;
  info: number;
  warn: number;
  error: number;
  fatal: number;
}

export interface SensitiveDataHandling {
  redactFields: string[];        // Field names to redact (password, token, ssn)
  maskFields: string[];          // Field names to mask (email, phone)
  hashFields: string[];          // Field names to hash (userId for anonymization)
  piiDetection: boolean;         // Automatic PII detection
}

// Metrics Configuration
export interface MetricsConfiguration {
  framework: MetricsFramework;
  collectionInterval: number;    // Seconds
  exporters: MetricsExporter[];
  customMetrics: Metric[];
  systemMetrics: SystemMetrics;
  businessMetrics: BusinessMetric[];
}

export type MetricsFramework =
  | 'Prometheus'
  | 'StatsD'
  | 'OpenTelemetry'
  | 'Micrometer'                  // Java/Spring
  | 'App Metrics';                // .NET

export interface MetricsExporter {
  type: 'Prometheus' | 'CloudWatch' | 'Datadog' | 'New Relic' | 'Graphite' | 'InfluxDB';
  endpoint?: string;
  config: Record<string, any>;
}

export interface Metric {
  name: string;
  type: MetricType;
  description: string;
  unit?: string;                 // "ms", "bytes", "requests", etc.
  labels: string[];              // Dimension names
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export type MetricType =
  | 'Counter'                     // Monotonically increasing
  | 'Gauge'                       // Can go up or down
  | 'Histogram'                   // Distribution of values
  | 'Summary';                    // Similar to histogram

export interface SystemMetrics {
  cpu: boolean;
  memory: boolean;
  disk: boolean;
  network: boolean;
  processMetrics: boolean;
  runtimeMetrics: boolean;       // GC, threads, etc.
}

export interface BusinessMetric {
  name: string;
  description: string;
  calculation: string;           // Formula or query
  threshold?: number;
  alertOnThreshold: boolean;
  dashboardWidget?: string;      // Widget type for dashboard
}

// Tracing Configuration
export interface TracingConfiguration {
  enabled: boolean;
  framework: TracingFramework;
  samplingRate: number;          // 0.0 to 1.0
  exporters: TracingExporter[];
  propagation: 'W3C' | 'B3' | 'Jaeger' | 'AWS X-Ray';
  spanProcessors: SpanProcessor[];
}

export type TracingFramework =
  | 'OpenTelemetry'
  | 'Jaeger'
  | 'Zipkin'
  | 'AWS X-Ray'
  | 'Datadog APM'
  | 'New Relic';

export interface TracingExporter {
  type: 'Jaeger' | 'Zipkin' | 'OTLP' | 'AWS X-Ray' | 'Datadog' | 'Honeycomb';
  endpoint: string;
  config: Record<string, any>;
}

export interface SpanProcessor {
  type: 'BatchSpanProcessor' | 'SimpleSpanProcessor';
  maxQueueSize?: number;
  maxExportBatchSize?: number;
  exportTimeout?: number;
}

// Alerting Configuration
export interface AlertingConfiguration {
  provider: 'Prometheus Alertmanager' | 'CloudWatch Alarms' | 'Datadog' | 'PagerDuty' | 'Opsgenie';
  rules: AlertRule[];
  notificationChannels: NotificationChannel[];
  escalationPolicies?: EscalationPolicy[];
}

export interface AlertRule {
  id: string;
  name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  condition: string;             // Query or expression
  threshold?: number;
  duration?: number;             // Seconds - how long condition must be true
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
  notificationChannels: string[]; // Channel IDs
  enabled: boolean;
}

export interface NotificationChannel {
  id: string;
  type: 'Email' | 'Slack' | 'PagerDuty' | 'Webhook' | 'SMS' | 'Microsoft Teams';
  target: string;                // Email address, webhook URL, etc.
  config?: Record<string, any>;
}

export interface EscalationPolicy {
  id: string;
  name: string;
  steps: EscalationStep[];
}

export interface EscalationStep {
  delay: number;                 // Minutes
  notificationChannels: string[];
}

// Dashboards
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  provider: 'Grafana' | 'Kibana' | 'CloudWatch' | 'Datadog' | 'Custom';
  panels: DashboardPanel[];
  refreshInterval?: number;      // Seconds
  timeRange?: string;            // e.g., "1h", "24h", "7d"
  variables?: DashboardVariable[];
  json?: string;                 // Generated dashboard JSON
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: PanelType;
  query: string;                 // Query expression (PromQL, etc.)
  visualization: VisualizationType;
  position: PanelPosition;
  thresholds?: Threshold[];
  unit?: string;
}

export type PanelType =
  | 'Graph'
  | 'SingleStat'
  | 'Table'
  | 'Heatmap'
  | 'Logs'
  | 'Traces';

export type VisualizationType =
  | 'Line'
  | 'Bar'
  | 'Pie'
  | 'Gauge'
  | 'Text'
  | 'Stat'
  | 'Timeseries';

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Threshold {
  value: number;
  color: string;
  label?: string;
}

export interface DashboardVariable {
  name: string;
  type: 'query' | 'custom' | 'interval' | 'datasource';
  query?: string;
  options?: string[];
  defaultValue?: string;
}

// Service Level Objectives (SLOs)
export interface ServiceLevelObjectives {
  slis: ServiceLevelIndicator[];
  slos: ServiceLevelObjective[];
  errorBudget?: ErrorBudget;
}

export interface ServiceLevelIndicator {
  id: string;
  name: string;
  description: string;
  query: string;                 // Metric query
  unit: string;
}

export interface ServiceLevelObjective {
  id: string;
  name: string;
  sliId: string;                 // Reference to SLI
  target: number;                // Target percentage (e.g., 99.9)
  window: string;                // Time window (e.g., "30d", "7d")
  threshold?: number;
  alertOnBreach: boolean;
}

export interface ErrorBudget {
  sloId: string;
  budget: number;                // Percentage of allowed errors
  consumed: number;              // Percentage consumed
  remaining: number;             // Percentage remaining
  resetPeriod: string;           // "monthly", "weekly", etc.
}

/**
 * Example Observability Specification:
 *
 * {
 *   "logging": {
 *     "framework": "Winston",
 *     "levels": ["INFO", "WARN", "ERROR"],
 *     "structuredLogging": true,
 *     "destinations": [
 *       {
 *         "type": "Elasticsearch",
 *         "config": {
 *           "node": "https://elasticsearch.example.com",
 *           "index": "app-logs"
 *         }
 *       }
 *     ],
 *     "contextFields": ["requestId", "userId", "environment"]
 *   },
 *   "metrics": {
 *     "framework": "Prometheus",
 *     "customMetrics": [
 *       {
 *         "name": "http_request_duration_seconds",
 *         "type": "Histogram",
 *         "description": "HTTP request latency",
 *         "labels": ["method", "status", "endpoint"]
 *       }
 *     ]
 *   },
 *   "tracing": {
 *     "enabled": true,
 *     "framework": "OpenTelemetry",
 *     "samplingRate": 0.1
 *   },
 *   "alerting": {
 *     "rules": [
 *       {
 *         "name": "High Error Rate",
 *         "severity": "Critical",
 *         "condition": "error_rate > 5%",
 *         "duration": 300
 *       }
 *     ]
 *   }
 * }
 */
