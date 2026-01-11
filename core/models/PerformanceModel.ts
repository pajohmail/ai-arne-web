/**
 * Performance & Optimization Model
 * Provides caching, indexing, query optimization, and capacity planning specifications
 * to enable AI generation of performance-optimized code
 */

export interface PerformanceSpecification {
  slos: ServiceLevelObjective[];
  cachingStrategy: CachingStrategy;
  databaseOptimization: DatabaseOptimization;
  apiOptimization: APIOptimization;
  loadProfile: LoadProfile;
  scalingStrategy: ScalingStrategy;
  completed: boolean;
}

// Service Level Objectives
export interface ServiceLevelObjective {
  id: string;
  metric: SLOMetric;
  target: number;
  unit: string;                  // "ms", "%", "requests/s", etc.
  percentile?: number;           // p50, p90, p95, p99, p99.9
  window: string;                // "1m", "5m", "1h", "24h", "30d"
  description: string;
}

export type SLOMetric =
  | 'Latency'                     // Response time
  | 'Availability'                // Uptime percentage
  | 'Throughput'                  // Requests per second
  | 'ErrorRate'                   // Error percentage
  | 'Saturation'                  // Resource utilization
  | 'TTFB'                        // Time to first byte
  | 'TimeToInteractive';          // Frontend metric

// Caching Strategy
export interface CachingStrategy {
  enabled: boolean;
  layers: CacheLayer[];
  invalidationStrategy: InvalidationStrategy;
  cacheWarming: CacheWarming;
  coherence: CoherenceStrategy;
}

export interface CacheLayer {
  name: string;
  level: 'Application' | 'Database' | 'CDN' | 'Browser' | 'Proxy';
  type: CacheType;
  ttl: number;                   // Seconds
  maxSize?: string;              // "100MB", "1GB", etc.
  evictionPolicy: EvictionPolicy;
  cachedResources: CachedResource[];
  config?: Record<string, any>;
}

export type CacheType =
  | 'Memory'                      // In-memory (e.g., Node cache)
  | 'Redis'                       // Distributed cache
  | 'Memcached'                   // Distributed cache
  | 'CDN'                         // Content Delivery Network
  | 'HTTP'                        // HTTP caching (browser/proxy)
  | 'Database Query'              // Query result caching
  | 'ORM';                        // ORM-level caching

export type EvictionPolicy =
  | 'LRU'                         // Least Recently Used
  | 'LFU'                         // Least Frequently Used
  | 'FIFO'                        // First In First Out
  | 'TTL'                         // Time-based expiration
  | 'Random';

export interface CachedResource {
  resource: string;              // Resource type (e.g., "user", "product")
  keys: string[];                // Cache key patterns
  ttl?: number;                  // Override layer TTL
  conditions?: string[];         // When to cache (e.g., "status === 'published'")
}

export interface InvalidationStrategy {
  type: 'TTL' | 'Event' | 'Manual' | 'Hybrid';
  events?: InvalidationEvent[];
  patterns?: string[];           // Cache key patterns to invalidate
}

export interface InvalidationEvent {
  eventType: string;             // e.g., "user.updated", "order.created"
  invalidates: string[];         // Cache key patterns to clear
}

export interface CacheWarming {
  enabled: boolean;
  schedule?: string;             // Cron expression
  resources: string[];           // Resources to pre-load
  strategy: 'eager' | 'lazy';
}

export interface CoherenceStrategy {
  type: 'Strong' | 'Eventual' | 'Weak';
  synchronization?: 'Invalidate' | 'Update' | 'Refresh';
}

// Database Optimization
export interface DatabaseOptimization {
  indexing: IndexingStrategy;
  queryOptimization: QueryOptimization[];
  connectionPooling: ConnectionPooling;
  partitioning?: PartitioningStrategy;
  replication?: ReplicationConfig;
  denormalization?: DenormalizationRule[];
}

export interface IndexingStrategy {
  indexes: DatabaseIndex[];
  autoAnalyze: boolean;
  recommendations: string[];     // Generated recommendations
}

export interface DatabaseIndex {
  table: string;
  columns: string[];
  type: IndexType;
  unique: boolean;
  partial?: string;              // Partial index condition
  include?: string[];            // Covering index columns
  rationale: string;             // Why this index exists
}

export type IndexType =
  | 'BTREE'                       // Default, good for equality and range
  | 'HASH'                        // Good for equality only
  | 'GIN'                         // Generalized Inverted Index (JSON, arrays)
  | 'GIST'                        // Generalized Search Tree (geo, full-text)
  | 'BRIN'                        // Block Range Index (large tables)
  | 'Fulltext';                   // Full-text search

export interface QueryOptimization {
  queryId: string;
  originalQuery: string;
  optimizedQuery: string;
  technique: OptimizationTechnique;
  expectedImprovement: string;   // "50% faster", "90% less I/O"
  rationale: string;
}

export type OptimizationTechnique =
  | 'Index Hint'
  | 'Query Rewrite'
  | 'Join Order'
  | 'Subquery Elimination'
  | 'Projection Pushdown'
  | 'Predicate Pushdown'
  | 'Batch Fetching'
  | 'Pagination';

export interface ConnectionPooling {
  enabled: boolean;
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number;        // Milliseconds
  idleTimeout: number;           // Milliseconds
  maxLifetime: number;           // Milliseconds
  strategy: 'fixed' | 'dynamic';
}

export interface PartitioningStrategy {
  enabled: boolean;
  tables: PartitionedTable[];
}

export interface PartitionedTable {
  name: string;
  type: 'Range' | 'List' | 'Hash' | 'Key';
  column: string;                // Partitioning column
  partitions: Partition[];
}

export interface Partition {
  name: string;
  condition: string;             // e.g., "date >= '2024-01-01' AND date < '2024-02-01'"
}

export interface ReplicationConfig {
  type: 'Master-Slave' | 'Master-Master' | 'Multi-Master';
  readReplicas: number;
  writeReplicas: number;
  replicationLag: number;        // Acceptable lag in seconds
  failoverStrategy: 'Automatic' | 'Manual';
}

export interface DenormalizationRule {
  table: string;
  addColumns: DenormalizedColumn[];
  rationale: string;
}

export interface DenormalizedColumn {
  name: string;
  sourceTable: string;
  sourceColumn: string;
  updateTrigger: string;         // When to update
}

// API Optimization
export interface APIOptimization {
  rateLimiting: RateLimiting;
  pagination: PaginationStrategy;
  compression: CompressionConfig;
  batchEndpoints: BatchEndpoint[];
  graphqlOptimization?: GraphQLOptimization;
}

export interface RateLimiting {
  enabled: boolean;
  strategy: 'Fixed Window' | 'Sliding Window' | 'Token Bucket' | 'Leaky Bucket';
  limits: RateLimit[];
  storage: 'Memory' | 'Redis' | 'Database';
}

export interface RateLimit {
  endpoint?: string;             // Specific endpoint or "*" for all
  limit: number;                 // Max requests
  window: number;                // Seconds
  scope: 'IP' | 'User' | 'APIKey' | 'Global';
}

export interface PaginationStrategy {
  type: 'Offset' | 'Cursor' | 'Keyset';
  defaultPageSize: number;
  maxPageSize: number;
  cursorEncoding?: 'base64' | 'jwt';
}

export interface CompressionConfig {
  enabled: boolean;
  algorithms: ('gzip' | 'br' | 'deflate')[];
  minSize: number;               // Bytes - don't compress smaller responses
  contentTypes: string[];        // MIME types to compress
}

export interface BatchEndpoint {
  path: string;
  maxBatchSize: number;
  timeout: number;               // Milliseconds
  parallelExecution: boolean;
}

export interface GraphQLOptimization {
  maxDepth: number;
  maxComplexity: number;
  persistedQueries: boolean;
  dataloaderEnabled: boolean;
  batchingEnabled: boolean;
}

// Load Profile
export interface LoadProfile {
  expectedLoad: TrafficPattern;
  peakLoad: TrafficPattern;
  trafficDistribution: TrafficDistribution;
  userBehavior: UserBehavior;
}

export interface TrafficPattern {
  requestsPerSecond: number;
  concurrentUsers: number;
  avgResponseTime: number;       // Milliseconds
  peakTime?: string;             // "09:00-17:00 weekdays"
}

export interface TrafficDistribution {
  byEndpoint: EndpointTraffic[];
  byRegion?: RegionTraffic[];
  byUserType?: UserTypeTraffic[];
}

export interface EndpointTraffic {
  endpoint: string;
  percentage: number;            // % of total traffic
  avgLatency: number;            // Milliseconds
}

export interface RegionTraffic {
  region: string;
  percentage: number;
}

export interface UserTypeTraffic {
  userType: string;              // "free", "premium", "admin"
  percentage: number;
}

export interface UserBehavior {
  avgSessionDuration: number;    // Minutes
  pagesPerSession: number;
  bounceRate: number;            // Percentage
  conversionRate: number;        // Percentage
}

// Scaling Strategy
export interface ScalingStrategy {
  horizontal: HorizontalScaling;
  vertical: VerticalScaling;
  autoScaling: AutoScalingConfig;
  capacityPlanning: CapacityPlan;
}

export interface HorizontalScaling {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  stateless: boolean;
  loadBalancing: LoadBalancingStrategy;
  sessionAffinity?: 'None' | 'ClientIP' | 'Cookie';
}

export interface LoadBalancingStrategy {
  algorithm: 'RoundRobin' | 'LeastConnections' | 'IPHash' | 'WeightedRoundRobin' | 'Random';
  healthCheck: HealthCheckConfig;
}

export interface HealthCheckConfig {
  enabled: boolean;
  endpoint: string;
  interval: number;              // Seconds
  timeout: number;               // Seconds
  unhealthyThreshold: number;
  healthyThreshold: number;
}

export interface VerticalScaling {
  enabled: boolean;
  resources: ResourceScaling;
}

export interface ResourceScaling {
  cpu: {
    current: string;
    max: string;
  };
  memory: {
    current: string;
    max: string;
  };
  storage?: {
    current: string;
    max: string;
  };
}

export interface AutoScalingConfig {
  enabled: boolean;
  metrics: ScalingMetric[];
  cooldownPeriod: number;        // Seconds
  scaleUpPolicy: ScalingPolicy;
  scaleDownPolicy: ScalingPolicy;
}

export interface ScalingMetric {
  name: string;                  // "cpu", "memory", "request_rate", custom
  threshold: number;
  comparisonOperator: '>' | '<' | '>=' | '<=';
  evaluationPeriods: number;
}

export interface ScalingPolicy {
  adjustment: number;            // Number of instances to add/remove
  adjustmentType: 'Absolute' | 'Percentage' | 'ChangeInCapacity';
  minAdjustment?: number;
}

export interface CapacityPlan {
  currentCapacity: Capacity;
  projectedGrowth: GrowthProjection;
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

export interface Capacity {
  cpu: number;                   // Percentage utilization
  memory: number;
  storage: number;
  network: number;
  database: number;
}

export interface GrowthProjection {
  timeframe: string;             // "6 months", "1 year"
  expectedGrowth: number;        // Percentage
  requiredCapacity: Capacity;
}

export interface Bottleneck {
  component: string;
  metric: string;
  currentValue: number;
  threshold: number;
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

/**
 * Example Performance Specification:
 *
 * {
 *   "slos": [
 *     {
 *       "metric": "Latency",
 *       "target": 200,
 *       "unit": "ms",
 *       "percentile": 95,
 *       "window": "5m"
 *     },
 *     {
 *       "metric": "Availability",
 *       "target": 99.9,
 *       "unit": "%",
 *       "window": "30d"
 *     }
 *   ],
 *   "cachingStrategy": {
 *     "enabled": true,
 *     "layers": [
 *       {
 *         "name": "Redis Cache",
 *         "level": "Application",
 *         "type": "Redis",
 *         "ttl": 300,
 *         "evictionPolicy": "LRU"
 *       }
 *     ]
 *   },
 *   "databaseOptimization": {
 *     "indexing": {
 *       "indexes": [
 *         {
 *           "table": "users",
 *           "columns": ["email"],
 *           "type": "BTREE",
 *           "unique": true
 *         }
 *       ]
 *     }
 *   }
 * }
 */
