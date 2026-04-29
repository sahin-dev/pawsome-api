import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class SocketRegistryService {
  private redis: Redis;
  private readonly USER_SOCKET_KEY_PREFIX = 'user_socket:';
  private readonly SOCKET_USER_KEY_PREFIX = 'socket_user:';
  private readonly ROOM_SUBSCRIPTION_KEY_PREFIX = 'room_subscribers:';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Store the mapping of userId to socketId
   */
  async setUserSocket(userId: string, socketId: string): Promise<void> {
    const userKey = `${this.USER_SOCKET_KEY_PREFIX}${userId}`;
    const socketKey = `${this.SOCKET_USER_KEY_PREFIX}${socketId}`;

    // Store bidirectional mapping
    await Promise.all([
      this.redis.set(userKey, socketId, 'EX', 86400), // 24 hours expiry
      this.redis.set(socketKey, userId, 'EX', 86400),
    ]);
  }

  /**
   * Get the socketId for a given userId
   */
  async getUserSocket(userId: string): Promise<string | null> {
    const userKey = `${this.USER_SOCKET_KEY_PREFIX}${userId}`;
    return await this.redis.get(userKey);
  }

  /**
   * Get the userId for a given socketId
   */
  async getSocketUser(socketId: string): Promise<string | null> {
    const socketKey = `${this.SOCKET_USER_KEY_PREFIX}${socketId}`;
    return await this.redis.get(socketKey);
  }

  /**
   * Remove user socket mapping on disconnect
   */
  async removeUserSocket(socketId: string): Promise<void> {
    const socketKey = `${this.SOCKET_USER_KEY_PREFIX}${socketId}`;
    const userId = await this.redis.get(socketKey);

    if (userId) {
      const userKey = `${this.USER_SOCKET_KEY_PREFIX}${userId}`;
      await Promise.all([
        this.redis.del(userKey),
        this.redis.del(socketKey),
      ]);
    }
  }

  /**
   * Add user to room subscription
   */
  async subscribeToRoom(roomId: number, userId: string): Promise<void> {
    const roomKey = `${this.ROOM_SUBSCRIPTION_KEY_PREFIX}${roomId}`;
    await this.redis.sadd(roomKey, userId);
  }

  /**
   * Remove user from room subscription
   */
  async unsubscribeFromRoom(roomId: number, userId: string): Promise<void> {
    const roomKey = `${this.ROOM_SUBSCRIPTION_KEY_PREFIX}${roomId}`;
    await this.redis.srem(roomKey, userId);
  }

  /**
   * Get all subscribers for a room
   */
  async getRoomSubscribers(roomId: number): Promise<string[]> {
    const roomKey = `${this.ROOM_SUBSCRIPTION_KEY_PREFIX}${roomId}`;
    return await this.redis.smembers(roomKey);
  }

  /**
   * Check if user is subscribed to room
   */
  async isSubscribedToRoom(roomId: number, userId: string): Promise<boolean> {
    const roomKey = `${this.ROOM_SUBSCRIPTION_KEY_PREFIX}${roomId}`;
    return (await this.redis.sismember(roomKey, userId)) === 1;
  }

  /**
   * Clean up room subscriptions when no subscribers left
   */
  async cleanupEmptyRooms(): Promise<void> {
    const pattern = `${this.ROOM_SUBSCRIPTION_KEY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const size = await this.redis.scard(key);
      if (size === 0) {
        await this.redis.del(key);
      }
    }
  }

  /**
   * Get multiple user sockets by array of user IDs
   */
  async getUserSockets(userIds: string[]): Promise<Map<string, string | null>> {
    const keys = userIds.map(id => `${this.USER_SOCKET_KEY_PREFIX}${id}`);
    const socketIds = await this.redis.mget(...keys);

    const result = new Map<string, string | null>();
    userIds.forEach((userId, index) => {
      result.set(userId, socketIds[index]);
    });

    return result;
  }

  async closeConnection(): Promise<void> {
    await this.redis.quit();
  }
}
