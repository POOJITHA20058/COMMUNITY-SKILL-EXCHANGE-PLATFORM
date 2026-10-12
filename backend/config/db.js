const mongoose = require("mongoose");

/**
 * Build a direct-connection URI from an Atlas SRV URI (avoids SRV DNS lookup).
 * Atlas host pattern: cluster0.xxx.mongodb.net → cluster0-shard-00-00.xxx.mongodb.net
 */
function buildDirectUri(srvUri) {
  const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)/);
  if (!match) return null;
  const [, user, password, host] = match;
  const parts = host.split(".");
  if (parts.length < 2) return null;
  const directHost = `${parts[0]}-shard-00-00.${parts.slice(1).join(".")}`;
  const encodedUser = encodeURIComponent(user);
  const encodedPass = encodeURIComponent(password);
  return `mongodb://${encodedUser}:${encodedPass}@${directHost}:27017/?directConnection=true&ssl=true&authSource=admin`;
}

const connectDB = async () => {
  const standardUri = process.env.MONGO_URI_STANDARD;
  let uri = process.env.MONGO_URI;

  if (!standardUri && !uri) {
    console.error("MongoDB Connection Failed: MONGO_URI is not defined in .env");
    process.exit(1);
  }

  // Use database from URI (e.g. mongodb://localhost:27017/communitySkillDB) when present; else use env or default
  const getDbName = (connectUri) => {
    if (process.env.MONGO_DB_NAME) return process.env.MONGO_DB_NAME;
    try {
      const url = new URL(connectUri);
      const name = url.pathname?.replace(/^\//, "").trim();
      if (name) return name;
    } catch (_) {}
    return "community_skill_exchange";
  };

  const tryConnect = async (connectUri, label) => {
    const options = {
      dbName: getDbName(connectUri),
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    };
    const conn = await mongoose.connect(connectUri, options);
    const dbName = conn.connection.db?.databaseName || options.dbName;
    console.log(`MongoDB Connected: ${conn.connection.host} | Database: ${dbName}${label ? ` (${label})` : ""}`);
    return conn;
  };

  // 1) Use MONGO_URI_STANDARD if set (from Atlas or custom)
  if (standardUri) {
    try {
      await tryConnect(standardUri, "standard URI");
      return;
    } catch (err) {
      console.error("MongoDB Connection Failed (MONGO_URI_STANDARD):", err.message);
      process.exit(1);
    }
  }

  // 2) Local or standard URI (mongodb://) – use as-is, no SRV
  if (uri && uri.startsWith("mongodb://")) {
    try {
      await tryConnect(uri, "local/standard");
      return;
    } catch (err) {
      console.error("MongoDB Connection Failed:", err.message);
      if (uri.includes("localhost") || uri.includes("127.0.0.1")) {
        console.error("\nMake sure MongoDB is running locally (e.g. run: docker compose up -d)");
      }
      process.exit(1);
    }
  }

  // 3) Atlas SRV URI – try SRV then direct fallback
  if (uri && uri.startsWith("mongodb+srv://")) {
    try {
      await tryConnect(uri);
      return;
    } catch (srvError) {
      const isSrvRefused =
        srvError.message && srvError.message.includes("querySrv ECONNREFUSED");
      if (!isSrvRefused) {
        console.error("MongoDB Connection Failed:", srvError.message);
        if (srvError.reason) console.error("Reason:", srvError.reason);
        process.exit(1);
      }
      console.warn("SRV lookup failed (DNS blocked). Trying direct connection...");
    }

    const directUri = buildDirectUri(uri);
    if (directUri) {
      try {
        await tryConnect(directUri, "direct");
        return;
      } catch (directError) {
        console.error("Direct connection also failed:", directError.message);
      }
    }
  }

  // 4) Last resort: try local MongoDB and tell user to use it
  console.error("MongoDB Connection Failed: Could not reach Atlas (network/DNS may be blocking).");
  console.error("\nUse LOCAL MongoDB instead:");
  console.error("  1. Install MongoDB Community for Windows: https://www.mongodb.com/try/download/community");
  console.error("  2. Start the MongoDB service (Services app or: net start MongoDB)");
  console.error("  3. In .env set:  MONGO_URI=mongodb://localhost:27017");
  console.error("  4. Restart the backend.");
  process.exit(1);
};

module.exports = connectDB;