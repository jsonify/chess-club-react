import { openDB, type IDBPDatabase, deleteDB } from 'idb';
import { supabaseClient } from './supabase';

const DB_NAME = 'ChessClubOfflineDB';
const DB_VERSION = 2; // Increment version number to force upgrade

let db: IDBPDatabase | null = null;

const STORES = {
  STUDENTS: 'students',
  ATTENDANCE_RECORDS: 'attendance_records',
  ATTENDANCE_SESSIONS: 'attendance_sessions',
  MATCHES: 'matches',
  SYNC_QUEUE: 'sync_queue'
} as const;

async function getDb() {
  if (!db) {
    try {
      // Delete existing database to ensure clean upgrade
      await deleteDB(DB_NAME);
      
      db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Create all stores
          Object.values(STORES).forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              const store = db.createObjectStore(storeName, { keyPath: 'id' });
              
              // Add specific indexes based on store type
              switch (storeName) {
                case STORES.ATTENDANCE_RECORDS:
                  store.createIndex('session_id', 'session_id');
                  store.createIndex('student_id', 'student_id');
                  break;
                case STORES.ATTENDANCE_SESSIONS:
                  store.createIndex('session_date', 'session_date');
                  break;
                case STORES.MATCHES:
                  store.createIndex('session_id', 'session_id');
                  break;
              }
            }
          });
        },
        blocked() {
          console.warn('Database upgrade blocked - please close other tabs');
        },
        blocking() {
          console.warn('Database blocking other version - closing');
          db?.close();
          db = null;
        },
        terminated() {
          console.error('Database terminated unexpectedly');
          db = null;
        }
      });

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
  return db;
}

async function saveToStore(storeName: string, data: any) {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  if (Array.isArray(data)) {
    await Promise.all(data.map(item => store.put(item)));
  } else {
    await store.put(data);
  }
  
  await tx.done;
}

async function getAllFromStore(storeName: string) {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  return store.getAll();
}

async function deleteFromStore(storeName: string, key: string) {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.delete(key);
  await tx.done;
}

function createOfflineQuery(data: any[]) {
  let filteredData = [...data];

  const query = {
    data: filteredData,
    error: null,

    select(columns?: string) {
      return this;
    },

    eq(column: string, value: any) {
      filteredData = filteredData.filter(item => item[column] === value);
      return this;
    },

    insert(newData: any) {
      const dataToInsert = Array.isArray(newData) ? newData : [newData];
      const insertedData = dataToInsert.map(item => ({
        ...item,
        id: item.id || `temp_${Date.now()}_${Math.random()}`
      }));

      return {
        select: () => ({
          single: () => ({
            data: insertedData[0],
            error: null
          }),
          data: insertedData,
          error: null
        }),
        data: insertedData,
        error: null
      };
    },

    single() {
      return {
        data: filteredData.length > 0 ? filteredData[0] : null,
        error: null
      };
    },

    async then(resolve: Function) {
      return resolve({ data: filteredData, error: null });
    }
  };

  return query;
}

export const supabase = {
  ...supabaseClient,
  from: (table: string) => ({
    select: async (query?: string) => {
      try {
        if (!navigator.onLine) {
          throw new Error('Offline mode');
        }
        const result = await supabaseClient.from(table).select(query);
        if (result.error) throw result.error;
        
        if (result.data) {
          await saveToStore(table, result.data);
        }
        
        return createOfflineQuery(result.data || []);
      } catch (error) {
        console.log('Falling back to offline data for', table);
        const data = await getAllFromStore(table);
        return createOfflineQuery(data || []);
      }
    },

    insert: async (data: any) => {
      try {
        if (!navigator.onLine) {
          throw new Error('Offline mode');
        }
        const result = await supabaseClient.from(table).insert(data);
        if (result.error) throw result.error;
        
        await saveToStore(table, Array.isArray(data) ? data : [data]);
        return createOfflineQuery(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.log('Storing offline insert for', table);
        const tempData = Array.isArray(data) 
          ? data.map(item => ({ ...item, id: `temp_${Date.now()}_${Math.random()}` }))
          : { ...data, id: `temp_${Date.now()}` };
        
        await saveToStore(table, Array.isArray(tempData) ? tempData : [tempData]);
        return createOfflineQuery(Array.isArray(tempData) ? tempData : [tempData]);
      }
    },

    // ... rest of your CRUD operations ...
  }),

  channel: (channelName: string) => {
    // Return a mock channel when offline
    if (!navigator.onLine) {
      return {
        on: () => ({
          subscribe: (callback: (status: string) => void) => {
            callback('OFFLINE');
            return {
              unsubscribe: () => {}
            };
          }
        })
      };
    }
    return supabaseClient.channel(channelName);
  },

  auth: supabaseClient.auth,
  storage: supabaseClient.storage,
};

// Initialize database when module loads
getDb().catch(console.error);

export type SupabaseOfflineClient = typeof supabase;