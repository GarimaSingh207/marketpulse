import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 5000,
});

redis.on("connect", () => {
  console.log("[redis] Connected");
});

redis.on("error", (err: Error) => {
  // Log the error type without leaking connection details
  console.warn(`[redis] Connection error: ${err.message.split("\n")[0]}`);
});

redis.on("close", () => {
  console.warn("[redis] Connection closed");
});

export default redis;
