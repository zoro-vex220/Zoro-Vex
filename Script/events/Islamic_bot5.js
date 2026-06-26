const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "joinNotify", //⚠️ 𝗗𝗼𝗻'𝘁 𝗖𝗵𝗮𝗻𝗴𝗲 𝗡𝗮𝗺𝗲 — 𝗖𝗺𝗱 𝗪𝗶𝗹𝗹 𝗡𝗼𝘁 𝗪𝗼𝗿𝗸✅
  eventType: ["log:subscribe"],
  version: "3.1.0",
  credits: "🔰𝐑𝐀𝐇𝐀𝐓 𝐈𝐒𝐋𝐀𝐌🔰", //⚠️ 𝗗𝗼𝗻'𝘁 𝗖𝗵𝗮𝗻𝗴𝗲 𝗖𝗿𝗲𝗱𝗶𝘁 — 𝗖𝗺𝗱 𝗪𝗼𝗻'𝘁 𝗪𝗼𝗿𝗸✅
  description: "Welcome image + caption"
};

const API_JSON_URL = "https://raw.githubusercontent.com/Rahat-Islam10/-Rahat-Boss-/refs/heads/main/api.json";

const boldMap = {
  " ": " ",
  'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴',
  'h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻',
  'o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂',
  'v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇',
  'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚',
  'H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡',
  'O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨',
  'V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭',
  '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲',
  '7':'𝟳','8':'𝟴','9':'𝟵'
};
function toBold(text) {
  return text.split("").map(c => boldMap[c] || c).join("");
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = current + " " + words[i];
    if (ctx.measureText(test).width < maxWidth) current = test;
    else { lines.push(current); current = words[i]; }
  }
  lines.push(current);
  return lines;
}

async function getApiList(commandName) {
  const res = await axios.get(API_JSON_URL, { timeout: 15000 });
  const data = res.data || {};
  const cmdData = data[commandName];
  if (!cmdData || !cmdData.api) throw new Error(`API not found for "${commandName}"`);
  return [cmdData.api, ...(cmdData.backupApis || [])].filter(Boolean);
}

module.exports.run = async function ({ api, event }) {
  if (!event.logMessageData || !event.logMessageData.addedParticipants) return;
  
  if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
    const botPrefix = global.config.PREFIX || "/";
    const botName = global.config.BOTNAME || "🔰𝐑𝐀𝐇𝐀𝐓 𝐈𝐒𝐋𝐀𝐌";
    api.changeNickname(`[ ${botPrefix} ] • ${botName}`, event.threadID, api.getCurrentUserID());
    api.sendMessage("গ্রুপে এড দেওয়ার জন্য ধন্যবাদ তোমাকে 🙃🫣", event.threadID);
    return;
  }

  const threadID = event.threadID;
  const threadInfo = await api.getThreadInfo(threadID);
  const groupName = threadInfo.threadName || "এই গ্রুপ";
  const memberCount = threadInfo.participantIDs.length;
  const addedUsers = event.logMessageData.addedParticipants;

  let apiList;
  try {
    apiList = await getApiList("welcome");
  } catch (e) {
    return api.sendMessage(`⚠️ ${e.message}`, threadID);
  }

  const attachments = [];
  const mentions = addedUsers.map(u => ({ tag: u.fullName, id: u.userFbId }));
  let finalCaption = ""; 

  for (const user of addedUsers) {
    const uid = user.userFbId;
    const name = user.fullName;
    let baseImage, caption;
    try {
      const result = await fetchFromAPI(uid, name, groupName, memberCount, module.exports.config.credits, apiList);
      baseImage = result.image;
      caption = result.caption;
      if (!finalCaption) finalCaption = caption; 
    } catch (err) {
      console.error(`API error for ${name}:`, err.message);
      continue;
    }

    const outPath = path.join(__dirname, `welcome_${uid}.png`);
    try {
      const img = await loadImage(baseImage);
      const canvas = createCanvas(1000, 600);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      let displayName = name;
      if (name.length > 20) displayName = name.substring(0, 20) + "...";
      ctx.font = "bold 52px Arial";
      ctx.fillStyle = "#ff9acb";
      ctx.fillText(toBold(displayName.toUpperCase()), 500, 280);
      ctx.font = "bold 34px Arial";
      ctx.fillStyle = "#00ffff";
      ctx.shadowColor = "rgba(0,255,255,0.5)";
      ctx.shadowBlur = 15;
      const maxWidth = 900;
      let groupLines;
      if (ctx.measureText(groupName).width > maxWidth) {
        groupLines = wrapText(ctx, groupName, maxWidth);
      } else {
        groupLines = [groupName];
      }
      let startY = 330;
      for (let i = 0; i < groupLines.length; i++) {
        ctx.fillText(groupLines[i], 500, startY + i * 42);
      }

      const ownerY = startY + groupLines.length * 42 + 20;
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 5;
      ctx.fillText("👑Owner👉 Rahat Islam", 500, ownerY);
      fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
      attachments.push(fs.createReadStream(outPath));
    } catch (e) {
      console.error("Text render error:", e);
    }
  }

  if (attachments.length === 0) return;
  try {
    await api.sendMessage({
      body: finalCaption,
      mentions,
      attachment: attachments
    }, threadID);
  } catch (e) {
    await api.sendMessage({ body: finalCaption, mentions }, threadID);
  }
  setTimeout(() => {
    for (const user of addedUsers) {
      const fp = path.join(__dirname, `welcome_${user.userFbId}.png`);
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch(e) {}
    }
  }, 120000);
};

async function fetchFromAPI(uid, name, groupName, memberCount, credit, apiList) {
  for (const base of apiList) {
    const cleanBase = base.replace(/\/+$/, "");
    const url = `${cleanBase}/api/frame?uid=${uid}&name=${encodeURIComponent(name)}&groupName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&credit=${encodeURIComponent(credit)}`;
    try {
      const res = await axios.get(url, { timeout: 30000, responseType: 'json' });
      if (res.data.image && res.data.caption) {
        return {
          image: Buffer.from(res.data.image, 'base64'),
          caption: res.data.caption
        };
      }
    } catch (err) {
      if (err.response?.status === 401) throw new Error(err.response.data.error);
      continue;
    }
  }
  throw new Error("No working API found");
}