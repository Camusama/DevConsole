'use server'
import { drizzle } from 'drizzle-orm/postgres-js'
import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { sql, eq } from 'drizzle-orm'
import postgres from 'postgres'
import { CollectionItem } from '@/components/collection-manager/types'
import clientPromise from '@/lib/mongodb'

// Create PostgreSQL client connection
const connectionString = process.env.PG_DATABASE_URL || ''
const client = postgres(connectionString)
const db = drizzle(client)

// Define backup table structure
const backupsTable = pgTable('collection_backups', {
  id: serial('id').primaryKey(),
  collectionName: text('collection_name').notNull(),
  items: jsonb('items').notNull(),
  categoryOrder: jsonb('category_order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Initialize database - create table if not exists
export async function initializeDatabase() {
  try {
    // Check if table exists
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'collection_backups'
      );
    `

    // Create table if it doesn't exist
    if (!tableExists[0].exists) {
      await client`
        CREATE TABLE collection_backups (
          id SERIAL PRIMARY KEY,
          collection_name TEXT NOT NULL,
          items JSONB NOT NULL,
          category_order JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `
      console.log('Created collection_backups table')
    }

    return true
  } catch (error) {
    console.error('Failed to initialize database:', error)
    return false
  }
}

// Get the latest backup record
export async function getLatestBackup(collectionName: string) {
  try {
    // Ensure table exists
    await initializeDatabase()

    const backups = await db
      .select()
      .from(backupsTable)
      .where(eq(backupsTable.collectionName, collectionName))
      .orderBy(sql`${backupsTable.createdAt} DESC`)
      .limit(1)

    return backups[0] || null
  } catch (error) {
    console.error('Failed to get backup record:', error)
    return null
  }
}

// Create new backup
export async function createBackup(
  collectionName: string,
  items: CollectionItem[],
  categoryOrder: string[]
) {
  try {
    const result = await db
      .insert(backupsTable)
      .values({
        collectionName,
        items,
        categoryOrder,
      })
      .returning()

    return result[0]
  } catch (error) {
    console.error('Failed to create backup:', error)
    throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Restore data from backup
export async function restoreFromBackup(backupId: number) {
  try {
    const backup = await db
      .select()
      .from(backupsTable)
      .where(eq(backupsTable.id, backupId))
      .limit(1)

    if (!backup || backup.length === 0) {
      throw new Error('Backup record does not exist')
    }

    return {
      items: backup[0].items as CollectionItem[],
      categoryOrder: backup[0].categoryOrder as string[],
    }
  } catch (error) {
    console.error('Failed to restore from backup:', error)
    throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Restore latest backup to MongoDB
export async function restoreLatestBackupToMongoDB(collectionName: string) {
  try {
    // Get latest backup
    const backup = await getLatestBackup(collectionName)

    if (!backup) {
      throw new Error('No backup found to restore')
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db('dev-console')

    // Start a session for transaction
    const session = client.startSession()

    try {
      // Start transaction
      await session.withTransaction(async () => {
        // 1. Clear existing collection data
        await db.collection(collectionName).deleteMany({}, { session })

        // 2. Insert backup items
        if (backup.items && Array.isArray(backup.items) && backup.items.length > 0) {
          // Prepare items for insertion (remove _id to let MongoDB generate new ones)
          const itemsToInsert = (backup.items as CollectionItem[]).map(item => {
            const { _id, ...rest } = item as any
            return {
              ...rest,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          })

          await db.collection(collectionName).insertMany(itemsToInsert, { session })
        }

        // 3. Update category order
        if (backup.categoryOrder && Array.isArray(backup.categoryOrder)) {
          await db
            .collection('category_orders')
            .updateOne(
              { collectionName },
              { $set: { order: backup.categoryOrder, updatedAt: new Date() } },
              { upsert: true, session }
            )
        }
      })

      // Return success with backup info
      return {
        success: true,
        backupDate: backup.createdAt,
        itemCount: Array.isArray(backup.items) ? backup.items.length : 0,
      }
    } finally {
      // End session
      await session.endSession()
    }
  } catch (error) {
    console.error('Failed to restore backup to MongoDB:', error)
    throw new Error(
      `Restore to MongoDB failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Restore data from specific backup ID to MongoDB
export async function restoreBackupToMongoDB(backupId: number) {
  try {
    // Get backup by ID
    const backup = await restoreFromBackup(backupId)

    if (!backup) {
      throw new Error('No backup found with the specified ID')
    }

    // Connect to MongoDB
    const client = await clientPromise
    const mongoDb = client.db('dev-console')

    // Get collection name from the backup record
    // 使用 drizzle 实例查询 PostgreSQL
    const backupRecord = await db
      .select()
      .from(backupsTable)
      .where(eq(backupsTable.id, backupId))
      .limit(1)

    if (!backupRecord || backupRecord.length === 0) {
      throw new Error('Backup record does not exist')
    }

    const collectionName = backupRecord[0].collectionName

    // Start a session for transaction
    const session = client.startSession()

    try {
      // Start transaction
      await session.withTransaction(async () => {
        // 1. Clear existing collection data
        await mongoDb.collection(collectionName).deleteMany({}, { session })

        // 2. Insert backup items
        if (backup.items && Array.isArray(backup.items) && backup.items.length > 0) {
          // Prepare items for insertion (remove _id to let MongoDB generate new ones)
          const itemsToInsert = backup.items.map(item => {
            const { _id, ...rest } = item as any
            return {
              ...rest,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          })

          await mongoDb.collection(collectionName).insertMany(itemsToInsert, { session })
        }

        // 3. Update category order
        if (backup.categoryOrder && Array.isArray(backup.categoryOrder)) {
          await mongoDb
            .collection('category_orders')
            .updateOne(
              { collectionName },
              { $set: { order: backup.categoryOrder, updatedAt: new Date() } },
              { upsert: true, session }
            )
        }
      })

      // Return success with backup info
      return {
        success: true,
        backupDate: backupRecord[0].createdAt,
        itemCount: Array.isArray(backup.items) ? backup.items.length : 0,
      }
    } finally {
      // End session
      await session.endSession()
    }
  } catch (error) {
    console.error('Failed to restore backup to MongoDB:', error)
    throw new Error(
      `Restore to MongoDB failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Define BackupRecord type
export interface BackupRecord {
  id: number
  collectionName: string
  items: CollectionItem[]
  categoryOrder: string[]
  createdAt: Date
}

// Get all backups for a collection
export async function getAllBackups(collectionName: string): Promise<BackupRecord[]> {
  try {
    // Ensure table exists
    await initializeDatabase()

    const backups = await db
      .select()
      .from(backupsTable)
      .where(eq(backupsTable.collectionName, collectionName))
      .orderBy(sql`${backupsTable.createdAt} DESC`)

    return backups as BackupRecord[]
  } catch (error) {
    console.error('Failed to get all backup records:', error)
    return []
  }
}

// Delete a backup by ID
export async function deleteBackup(backupId: number): Promise<boolean> {
  try {
    const result = await db.delete(backupsTable).where(eq(backupsTable.id, backupId)).returning()

    return result.length > 0
  } catch (error) {
    console.error('Failed to delete backup:', error)
    return false
  }
}
