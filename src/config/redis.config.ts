import Redis from "ioredis";
import { _REDIS_URL } from "../secret";

class RedisClient {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(_REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      RedisClient.instance.on("connect", () => {
        console.log("✅ Redis connected successfully");
      });

      RedisClient.instance.on("error", (error) => {
        console.error("❌ Redis connection error:", error.message);
      });
    }

    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      console.log("Redis disconnected");
    }
  }
}

export const redis = RedisClient.getInstance();
export default RedisClient;
