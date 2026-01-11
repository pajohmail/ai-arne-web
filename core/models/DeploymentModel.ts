/**
 * Deployment & Infrastructure Model
 * Provides containerization, orchestration, and CI/CD specifications
 * to enable AI generation of deployment descriptors and infrastructure code
 */

export interface DeploymentSpecification {
  containerization: ContainerConfiguration;
  orchestration?: OrchestrationConfiguration;
  cicd: CICDPipeline;
  environments: Environment[];
  infrastructure?: InfrastructureAsCode;
  completed: boolean;
}

// Containerization (Docker)
export interface ContainerConfiguration {
  enabled: boolean;
  platform: 'Docker' | 'Podman' | 'containerd';
  services: ContainerService[];
  networks?: NetworkConfiguration[];
  volumes?: VolumeConfiguration[];
  dockerCompose?: string;        // Docker Compose YAML
}

export interface ContainerService {
  name: string;
  baseImage: string;             // e.g., "node:20-alpine", "python:3.11-slim"
  dockerfile: string;            // Generated Dockerfile content
  buildContext: string;          // Path to build context
  buildArgs?: Record<string, string>;
  exposedPorts: number[];
  environmentVariables: EnvVar[];
  volumes: VolumeMount[];
  healthCheck?: HealthCheck;
  resources?: ResourceRequirements;
  dependencies?: string[];       // Service names this depends on
}

export interface EnvVar {
  name: string;
  value?: string;                // Direct value (for non-sensitive)
  valueFrom?: 'secret' | 'configmap' | 'env';  // Source type
  secretName?: string;           // If valueFrom is 'secret'
  configMapName?: string;        // If valueFrom is 'configmap'
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly: boolean;
  type?: 'bind' | 'volume' | 'tmpfs';
}

export interface HealthCheck {
  type: 'http' | 'tcp' | 'exec';
  endpoint?: string;             // For HTTP checks
  port?: number;                 // For TCP checks
  command?: string[];            // For exec checks
  interval: number;              // Seconds
  timeout: number;               // Seconds
  retries: number;
  startPeriod: number;           // Seconds
}

export interface ResourceRequirements {
  requests: {
    cpu: string;                 // e.g., "100m", "0.5"
    memory: string;              // e.g., "128Mi", "1Gi"
  };
  limits: {
    cpu: string;
    memory: string;
  };
}

export interface NetworkConfiguration {
  name: string;
  driver: 'bridge' | 'host' | 'overlay' | 'macvlan';
  internal: boolean;
  attachable: boolean;
}

export interface VolumeConfiguration {
  name: string;
  driver: 'local' | 'nfs' | 'cifs';
  labels?: Record<string, string>;
}

// Orchestration (Kubernetes)
export interface OrchestrationConfiguration {
  platform: 'Kubernetes' | 'Docker Swarm' | 'Nomad' | 'ECS' | 'Cloud Run';
  version?: string;
  deployments: K8sDeployment[];
  services: K8sService[];
  ingress?: K8sIngress[];
  configMaps: K8sConfigMap[];
  secrets: K8sSecret[];
  namespaces: string[];
  rbac?: K8sRBAC;
  helm?: HelmChart;
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  replicas: number;
  selector: Record<string, string>;
  template: PodTemplate;
  strategy: DeploymentStrategy;
  autoscaling?: AutoscalingConfig;
  yaml?: string;                 // Generated K8s YAML
}

export interface PodTemplate {
  labels: Record<string, string>;
  annotations?: Record<string, string>;
  containers: K8sContainer[];
  initContainers?: K8sContainer[];
  volumes?: K8sVolume[];
  restartPolicy: 'Always' | 'OnFailure' | 'Never';
  serviceAccountName?: string;
}

export interface K8sContainer {
  name: string;
  image: string;
  imagePullPolicy: 'Always' | 'IfNotPresent' | 'Never';
  ports: ContainerPort[];
  env: EnvVar[];
  volumeMounts: VolumeMount[];
  resources: ResourceRequirements;
  livenessProbe?: K8sProbe;
  readinessProbe?: K8sProbe;
  securityContext?: SecurityContext;
}

export interface ContainerPort {
  name: string;
  containerPort: number;
  protocol: 'TCP' | 'UDP';
}

export interface K8sProbe {
  httpGet?: {
    path: string;
    port: number;
    scheme: 'HTTP' | 'HTTPS';
  };
  tcpSocket?: {
    port: number;
  };
  exec?: {
    command: string[];
  };
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  successThreshold: number;
  failureThreshold: number;
}

export interface SecurityContext {
  runAsUser?: number;
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  readOnlyRootFilesystem?: boolean;
  allowPrivilegeEscalation?: boolean;
  capabilities?: {
    add?: string[];
    drop?: string[];
  };
}

export interface K8sVolume {
  name: string;
  type: 'emptyDir' | 'configMap' | 'secret' | 'persistentVolumeClaim' | 'hostPath';
  configMapName?: string;
  secretName?: string;
  pvcName?: string;
}

export interface DeploymentStrategy {
  type: 'RollingUpdate' | 'Recreate' | 'BlueGreen' | 'Canary';
  rollingUpdate?: {
    maxSurge: string;            // e.g., "25%", "1"
    maxUnavailable: string;      // e.g., "25%", "0"
  };
}

export interface AutoscalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  metrics: AutoscalingMetric[];
}

export interface AutoscalingMetric {
  type: 'cpu' | 'memory' | 'custom';
  targetAverageUtilization?: number;  // Percentage
  targetAverageValue?: string;   // Absolute value
}

export interface K8sService {
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  selector: Record<string, string>;
  ports: ServicePort[];
  yaml?: string;
}

export interface ServicePort {
  name: string;
  port: number;
  targetPort: number;
  protocol: 'TCP' | 'UDP';
  nodePort?: number;
}

export interface K8sIngress {
  name: string;
  namespace: string;
  ingressClass?: string;
  tls?: IngressTLS[];
  rules: IngressRule[];
  annotations?: Record<string, string>;
  yaml?: string;
}

export interface IngressTLS {
  hosts: string[];
  secretName: string;
}

export interface IngressRule {
  host: string;
  paths: IngressPath[];
}

export interface IngressPath {
  path: string;
  pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
  backend: {
    serviceName: string;
    servicePort: number;
  };
}

export interface K8sConfigMap {
  name: string;
  namespace: string;
  data: Record<string, string>;
}

export interface K8sSecret {
  name: string;
  namespace: string;
  type: 'Opaque' | 'kubernetes.io/tls' | 'kubernetes.io/dockerconfigjson';
  data: string[];                // Key names only, values managed separately
}

export interface K8sRBAC {
  serviceAccounts: ServiceAccount[];
  roles: Role[];
  roleBindings: RoleBinding[];
}

export interface ServiceAccount {
  name: string;
  namespace: string;
}

export interface Role {
  name: string;
  namespace: string;
  rules: PolicyRule[];
}

export interface PolicyRule {
  apiGroups: string[];
  resources: string[];
  verbs: string[];
}

export interface RoleBinding {
  name: string;
  namespace: string;
  roleRef: string;               // Role name
  subjects: string[];            // ServiceAccount names
}

export interface HelmChart {
  name: string;
  version: string;
  repository?: string;
  values: Record<string, any>;
}

// CI/CD Pipeline
export interface CICDPipeline {
  platform: 'GitHub Actions' | 'GitLab CI' | 'Jenkins' | 'CircleCI' | 'Azure DevOps' | 'Travis CI';
  stages: PipelineStage[];
  triggers: PipelineTrigger[];
  secrets: string[];             // Secret names used in pipeline
  artifacts?: ArtifactConfig[];
  notifications?: NotificationConfig;
  yaml?: string;                 // Generated CI/CD YAML
}

export interface PipelineStage {
  name: string;
  jobs: Job[];
  condition?: string;            // When to run this stage
}

export interface Job {
  name: string;
  runsOn: string;                // e.g., "ubuntu-latest", "self-hosted"
  steps: JobStep[];
  environment?: string;          // Deployment environment
  timeout?: number;              // Minutes
  dependsOn?: string[];          // Job names
}

export interface JobStep {
  name: string;
  type: 'script' | 'action' | 'service';
  script?: string;               // Shell script to execute
  action?: string;               // Action name (e.g., "actions/checkout@v3")
  with?: Record<string, string>; // Action parameters
  env?: Record<string, string>;  // Environment variables
}

export interface PipelineTrigger {
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'tag';
  branches?: string[];
  tags?: string[];
  schedule?: string;             // Cron expression
}

export interface ArtifactConfig {
  name: string;
  path: string[];
  retention: number;             // Days
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  events: ('success' | 'failure' | 'always')[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook';
  target: string;                // Email, Slack webhook, etc.
}

// Environments
export interface Environment {
  name: 'development' | 'staging' | 'production' | 'test' | string;
  url?: string;
  variables: Record<string, string>;
  secrets: string[];             // Secret names (values managed separately)
  resources?: EnvironmentResources;
  approvalRequired?: boolean;
}

export interface EnvironmentResources {
  cpu: string;
  memory: string;
  storage: string;
  replicas: number;
}

// Infrastructure as Code
export interface InfrastructureAsCode {
  tool: 'Terraform' | 'Pulumi' | 'CloudFormation' | 'Ansible' | 'CDK';
  modules: IaCModule[];
  state?: StateManagement;
}

export interface IaCModule {
  name: string;
  provider: 'AWS' | 'Azure' | 'GCP' | 'DigitalOcean' | 'Multi';
  resources: IaCResource[];
  code?: string;                 // Generated Terraform/etc code
}

export interface IaCResource {
  type: string;                  // e.g., "aws_ec2_instance", "azure_vm"
  name: string;
  properties: Record<string, any>;
}

export interface StateManagement {
  backend: 'local' | 's3' | 'azurerm' | 'gcs' | 'terraform_cloud';
  config: Record<string, string>;
}

/**
 * Example Deployment Specification:
 *
 * {
 *   "containerization": {
 *     "enabled": true,
 *     "platform": "Docker",
 *     "services": [
 *       {
 *         "name": "api",
 *         "baseImage": "node:20-alpine",
 *         "exposedPorts": [3000],
 *         "healthCheck": {
 *           "type": "http",
 *           "endpoint": "/health",
 *           "interval": 30
 *         }
 *       }
 *     ]
 *   },
 *   "orchestration": {
 *     "platform": "Kubernetes",
 *     "deployments": [...]
 *   },
 *   "cicd": {
 *     "platform": "GitHub Actions",
 *     "stages": [
 *       {
 *         "name": "Build and Test",
 *         "jobs": [...]
 *       }
 *     ]
 *   }
 * }
 */
