const mongoDBStore = require("connect-mongo");

const sessionStoreConfig = mongoDBStore.create({
  mongoUrl:
    process.env.SESSION_STORE ||
    "mongodb://0.0.0.1/opticast-sessions-store",
  collectionName: "opticast-sessions",
  ttl: 7 * 24 * 60 * 60,
});

module.exports = sessionStoreConfig;