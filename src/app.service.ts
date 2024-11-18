import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';

@Injectable()
export class AppService {
  private cacheKeys: Set<string> = new Set(); // Store keys in memory

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  // async clearSpecificKey(key: string) {
  //   await this.cacheManager.del(key); // Clears a specific key from the cache
  //   this.cacheKeys.delete(key); // Remove from local key tracking
  // }

  // async clearCache() {
  //   for (const key of this.cacheKeys) {
  //     await this.cacheManager.del(key); // Clear all cached keys
  //   }
  //   this.cacheKeys.clear(); // Clear the local key tracking
  // }

  // async cacheData(key: string, value: any, ttl: number) {
  //   await this.cacheManager.set(key, value, { ttl }); // Cache a value with a TTL (in seconds)
  //   this.cacheKeys.add(key); // Add key to local tracking
  // }

  // async getCachedData(key: string) {
  //   return await this.cacheManager.get(key); // Get cached data by key
  // }

  getHello(): string {
    return 'Hello World!';
  }
}
