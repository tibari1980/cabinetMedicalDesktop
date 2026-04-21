import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private dbName = 'MedConnectDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {}

  /**
   * Initialize the database and create object stores if they don't exist.
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create store for patients
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        
        // Create store for audit logs
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id' });
        }

        // Create store for invoices
        if (!db.objectStoreNames.contains('invoices')) {
          db.createObjectStore('invoices', { keyPath: 'id' });
        }

        // Create store for medical records
        if (!db.objectStoreNames.contains('medical_records')) {
          db.createObjectStore('medical_records', { keyPath: 'patientId' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Generates a cryptographically secure UUID
   */
  generateSecureId(): string {
    return crypto.randomUUID();
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error getting all from ${storeName}:`, error);
      return [];
    }
  }

  async put<T>(storeName: string, item: T): Promise<void> {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error putting into ${storeName}:`, error);
      throw error;
    }
  }

  async clear(storeName: string): Promise<void> {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error);
    }
  }

  async delete(storeName: string, key: any): Promise<void> {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error deleting from ${storeName}:`, error);
    }
  }
  
  /**
   * Bulk add/update items
   */
  async putAll<T>(storeName: string, items: T[]): Promise<void> {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        items.forEach(item => store.put(item));
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error(`Error bulk putting into ${storeName}:`, error);
    }
  }
}
