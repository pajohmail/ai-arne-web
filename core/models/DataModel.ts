/**
 * Data Model Specification
 * Provides detailed database schema and ORM mapping specifications
 * to enable AI generation of database structures and ORM entities
 */

export interface DatabaseSchema {
  tables: TableDefinition[];
  relationships: Relationship[];
  indexes: IndexDefinition[];
  migrations?: Migration[];
  ormConfig: ORMConfiguration;
}

export interface TableDefinition {
  name: string;
  schema?: string;               // Database schema (e.g., "public", "dbo")
  columns: ColumnDefinition[];
  primaryKey: string[];
  uniqueConstraints?: UniqueConstraint[];
  checkConstraints?: CheckConstraint[];
  comment?: string;
}

export interface ColumnDefinition {
  name: string;
  type: SQLDataType;             // VARCHAR, INTEGER, TIMESTAMP, etc.
  length?: number;               // For VARCHAR(255), etc.
  precision?: number;            // For DECIMAL(10,2), etc.
  scale?: number;
  nullable: boolean;
  defaultValue?: any;
  autoIncrement?: boolean;
  unique?: boolean;
  foreignKey?: ForeignKeyConstraint;
  comment?: string;
}

export type SQLDataType =
  // String types
  | 'VARCHAR' | 'CHAR' | 'TEXT' | 'LONGTEXT'
  // Numeric types
  | 'INTEGER' | 'BIGINT' | 'SMALLINT' | 'DECIMAL' | 'NUMERIC' | 'FLOAT' | 'DOUBLE'
  // Date/Time types
  | 'DATE' | 'TIME' | 'DATETIME' | 'TIMESTAMP'
  // Boolean
  | 'BOOLEAN'
  // JSON
  | 'JSON' | 'JSONB'
  // Binary
  | 'BLOB' | 'BYTEA'
  // UUID
  | 'UUID';

export interface ForeignKeyConstraint {
  table: string;
  column: string;
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
}

export interface UniqueConstraint {
  name: string;
  columns: string[];
}

export interface CheckConstraint {
  name: string;
  expression: string;            // SQL expression (e.g., "age >= 18")
}

export interface Relationship {
  name: string;
  type: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  sourceTable: string;
  targetTable: string;
  sourceColumn?: string;
  targetColumn?: string;
  junctionTable?: string;        // For ManyToMany relationships
}

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type?: 'BTREE' | 'HASH' | 'GIN' | 'GIST' | 'BRIN';
  partial?: string;              // Partial index condition
}

export interface Migration {
  version: string;
  description: string;
  upSql: string;                 // SQL to apply migration
  downSql: string;               // SQL to rollback migration
}

// ORM Configuration
export interface ORMConfiguration {
  framework: 'TypeORM' | 'Prisma' | 'Sequelize' | 'SQLAlchemy' | 'Hibernate' | 'Entity Framework';
  entities: EntityMapping[];
  connectionConfig: {
    database: string;
    host?: string;
    port?: number;
    ssl?: boolean;
    poolSize?: number;
  };
}

export interface EntityMapping {
  className: string;             // From domain model
  tableName: string;
  properties: PropertyMapping[];
  methods?: string[];            // Entity methods
}

export interface PropertyMapping {
  propertyName: string;
  columnName: string;
  type: string;
  nullable: boolean;
  relation?: {
    type: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
    targetEntity: string;
    inverseProperty?: string;
    cascadeActions?: ('persist' | 'remove' | 'update' | 'merge')[];
    eager?: boolean;             // Load relation eagerly
  };
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

/**
 * Example TypeORM Entity:
 * ```typescript
 * @Entity('users')
 * export class User {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *
 *   @Column({ type: 'varchar', length: 255, unique: true })
 *   email: string;
 *
 *   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
 *   createdAt: Date;
 *
 *   @OneToMany(() => Order, order => order.user, { cascade: ['insert', 'update'] })
 *   orders: Order[];
 * }
 * ```
 */

export interface DataModelSpecification {
  databaseSchema: DatabaseSchema;
  erDiagram?: string;            // Mermaid ER diagram
  ddlScript?: string;            // Generated DDL SQL
  completed: boolean;
}
