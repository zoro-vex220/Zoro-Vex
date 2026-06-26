const fs = require("fs");
const path = require("path");
const axios = require("axios");

const protectFile = path.join(__dirname, "rx", "Islamic_bot.json");
const cacheDir = path.join(__dirname, "rx", "cache");

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

function loadProtect() {
  if (!fs.existsSync(protectFile)) return {};
  return JSON.parse(fs.readFileSync(protectFile, "utf-8"));
}

function saveProtect(data) {
  fs.writeFileSync(protectFile, JSON.stringify(data, null, 2), "utf-8");
}

async function cacheGroupImage(api, threadID) {
  try {
    const info = await api.getThreadInfo(threadID);
    if (!info || !info.imageSrc) return;

    const filePath = path.join(cacheDir, threadID + ".png");

    const response = await axios({
      url: info.imageSrc,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve) => {
      writer.on("finish", () => {
        console.log("📸 Cached:", threadID);
        resolve();
      });
    });

  } catch (err) {
    console.log("Cache error:", err);
  }
}

module.exports.config = {
  name: "protect",
  eventType: ["log:thread-name", "log:thread-icon", "log:thread-image"],
  version: "3.0.0",
  credits: "🔰𝐑𝐀𝐇𝐀𝐓 𝐈𝐒𝐋𝐀𝐌🔰",
  description: "islam"
};

module.exports.run = async function({ api }) {
  try {
    const allThreads = await api.getThreadList(50, null, ["INBOX"]);
    const protect = loadProtect();

    for (let thread of allThreads) {
      if (!thread.isGroup) continue;

      if (!protect[thread.threadID]) {
        protect[thread.threadID] = {
          name: thread.name || null,
          emoji: thread.emoji || null
        };
      }

      cacheGroupImage(api, thread.threadID);
    }

    saveProtect(protect);
    console.log("🛡️ Protect system ready (Safe Mode)");

  } catch (err) {
    console.error("Startup error:", err);
  }
};

module.exports.runEvent = async function({ event, api }) {
  try {
    const protect = loadProtect();
    const threadID = event.threadID;

    if (!protect[threadID]) return;

    const info = protect[threadID];
    const threadInfo = await api.getThreadInfo(threadID);

    const isAdmin = threadInfo.adminIDs.some(
      adm => adm.id == event.author
    );

    if (isAdmin) return;

    if (event.logMessageType === "log:thread-name" && info.name) {
      if (threadInfo.threadName !== info.name) {
        await api.setTitle(info.name, threadID);
        await api.sendMessage(
          "⚠️গ্রুপের এডমিন ছাড়া কেউ নাম পরিবর্তন করতে পারবি না😏\nযা ভাগ😐✋",
          threadID
        );
      }
    }

    // -------- EMOJI PROTECT -------- //
    else if (event.logMessageType === "log:thread-icon" && info.emoji) {
      if (threadInfo.emoji !== info.emoji) {
        await api.changeThreadEmoji(info.emoji, threadID);
        await api.sendMessage(
          "⚠️ ইমোজি পরিবর্তন করা যাবে না 🐸",
          threadID
        );
      }
    }

    // -------- IMAGE PROTECT -------- //
    else if (event.logMessageType === "log:thread-image") {
      const filePath = path.join(cacheDir, threadID + ".png");

      if (fs.existsSync(filePath)) {
        await api.changeGroupImage(
          fs.createReadStream(filePath),
          threadID
        );
      }

      await api.sendMessage(
        "⚠️ গ্রুপের ছবি পরিবর্তন করা যাবে না 🛡️",
        threadID
      );
    }

  } catch (err) {
    console.error("[Protect Error]", err);
  }
};