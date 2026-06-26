var request = require("request");
const { readdirSync, readFileSync, writeFileSync, existsSync, copySync, createWriteStream, createReadStream } = require("fs-extra");

module.exports.config = {
	name: "0admin",
	version: "1.0.5",
	hasPermssion: 3,
	credits: "🔰𝐑𝐀𝐇𝐀𝐓 𝐈𝐒𝐋𝐀𝐌🔰",
	description: "Admin Config",
	commandCategory: "Admin",
	usages: "Admin [command] [@mention/reply/UID/link/name]",
	cooldowns: 2,
	dependencies: {
		"fs-extra": ""
	}
};

module.exports.languages = {
	"vi": {
		"listAdmin": `===「 𝗗𝗔𝗡𝗛 𝗦𝗔́𝗖𝗛 𝗔𝗗𝗠𝗜𝗡 」===\n━━━━━━━━━━━━━━━\n%1\n\n==「 𝗡𝗚𝗨̛𝗢̛̀𝗜 𝗛𝗢̂̃ 𝗧𝗥𝗢̛̣ 𝗕𝗢𝗧 」==\n━━━━━━━━━━━━━━━\n%2`,
		"notHavePermssion": '𝗠𝗢𝗗𝗘 - Bạn không đủ quyền hạn để có thể sử dụng chức năng "%1"',
		"addedNewAdmin": '𝗠𝗢𝗗𝗘 - Đã thêm thành công %1 người dùng trở thành Admin Bot\n\n%2',
		"addedNewNDH": '𝗠𝗢𝗗𝗘 - Đã thêm thành công %1 người dùng trở thành Người hỗ trợ\n\n%2',
		"removedAdmin": '𝗠𝗢𝗗𝗘 - Đã gỡ thành công vai trò Admin %1 người dùng trở lại làm thành viên\n\n%2',
		"removedNDH": '𝗠𝗢𝗗𝗘 - Đã gỡ thành công vai trò Người hỗ trợ %1 người dùng trở lại làm thành viên\n\n%2'
	},
	"en": {
		"listAdmin": '[Admin] Admin list: \n\n%1',
		"notHavePermssion": '[Admin] You have no permission to use "%1"',
		"addedNewAdmin": '[Admin] Added %1 Admin :\n\n%2',
		"removedAdmin": '[Admin] Remove %1 Admin:\n\n%2'
	}
};

// ===== Helper: Full Name Mention Detection =====
async function getUIDByFullName(api, threadID, body) {
	if (!body.includes("@")) return null;
	const match = body.match(/@(.+)/);
	if (!match) return null;
	const targetName = match[1].trim().toLowerCase().replace(/\s+/g, " ");
	const threadInfo = await api.getThreadInfo(threadID);
	const users = threadInfo.userInfo || [];
	const user = users.find(u => {
		if (!u.name) return false;
		const fullName = u.name.trim().toLowerCase().replace(/\s+/g, " ");
		return fullName === targetName;
	});
	return user ? user.id : null;
}

// ===== Helper: Get Target User =====
async function getTargetUser(api, event, args, Users) {
	let targetID;
	let targetName;
	
	// ===== Determine targetID in three ways =====
	if (event.type === "message_reply") {
		// Way 1: Reply to a message
		targetID = event.messageReply.senderID;
		targetName = (await Users.getData(targetID)).name;
	} else if (args[0]) {
		if (args[0].indexOf(".com/") !== -1) {
			// Way 2: Facebook profile link
			targetID = await api.getUID(args[0]);
			targetName = (await Users.getData(targetID)).name;
		} else if (args.join().includes("@")) {
			// Way 3: Mention or full name
			// 3a: Direct Facebook mention
			targetID = Object.keys(event.mentions || {})[0];
			if (targetID) {
				targetName = event.mentions[targetID];
			} else {
				// 3b: Full name detection
				targetID = await getUIDByFullName(api, event.threadID, args.join(" "));
				if (targetID) {
					targetName = (await Users.getData(targetID)).name;
				}
			}
		} else {
			// Direct UID
			targetID = args[0];
			targetName = (await Users.getData(targetID)).name;
		}
	}
	
	return { targetID, targetName };
}

module.exports.onLoad = function() {
	const { writeFileSync, existsSync } = require('fs-extra');
	const { resolve } = require("path");
	const path = resolve(__dirname, 'cache', 'data.json');
	if (!existsSync(path)) {
		const obj = {
			adminbox: {}
		};
		writeFileSync(path, JSON.stringify(obj, null, 4));
	} else {
		const data = require(path);
		if (!data.hasOwnProperty('adminbox')) data.adminbox = {};
		writeFileSync(path, JSON.stringify(data, null, 4));
	}
}

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
	const content = args.slice(1, args.length);
	if (args.length == 0) return api.sendMessage({body:`==== [ 𝗔𝗗𝗠𝗜𝗡 𝗦𝗘𝗧𝗧𝗜𝗡𝗚 ] ====\n━━━━━━━━━━━━━━━\n𝗠𝗢𝗗𝗘 - 𝗮𝗱𝗺𝗶𝗻 𝗹𝗶𝘀𝘁 => 𝗩𝗶𝗲𝘄 𝗹𝗶𝘀𝘁 𝗼𝗳 𝗔𝗱𝗺𝗶𝗻 𝗮𝗻𝗱 𝗦𝘂𝗽𝗽𝗼𝗿𝘁\n𝗠𝗢𝗗𝗘 -𝗮𝗱𝗺𝗶𝗻 𝗮𝗱𝗱 => 𝗔𝗱𝗱 𝘂𝘀𝗲𝗿 𝗮𝘀 𝗔𝗱𝗺𝗶𝗻\n𝗠𝗢𝗗𝗘 -𝗮𝗱𝗺𝗶𝗻 𝗿𝗲𝗺𝗼𝘃𝗲=> 𝗥𝗲𝗮𝗱𝘆 𝗿𝗼𝗹𝗲 𝗔𝗱𝗺𝗶𝗻\n𝗠𝗢𝗗𝗘 -𝗮𝗱𝗺𝗶𝗻 𝗮𝗱𝗱𝗻𝗱𝗵 => 𝗔𝗱𝗱 𝘂𝘀𝗲𝗿 𝗮𝘀 𝗦𝘂𝗽𝗽𝗼𝗿𝘁\n𝗠𝗢𝗗𝗘 -𝗮𝗱𝗺𝗶𝗻 𝗿𝗲𝗺𝗼𝘃𝗲𝗻𝗱𝗵=> 𝗥𝗲𝗮𝗱𝘆 𝗿𝗼𝗹𝗲 𝗦𝘂𝗽𝗽𝗼𝗿𝘁\n𝗠𝗢𝗗𝗘 -𝗮𝗱𝗺𝗶𝗻 𝗾𝘁𝘃𝗼𝗻𝗹𝘆=> 𝘁𝗼𝗴𝗴𝗹𝗲  𝗺𝗼𝗱𝗲 𝗼𝗻𝗹𝘆 𝗮𝗱𝗺𝗶𝗻𝘀 𝘂𝘀𝗲 𝗯𝗼𝘁\n𝗠𝗢𝗗𝗘 - 𝗮𝗱𝗺𝗶𝗻 𝗻𝗱𝗵𝗼𝗻𝗹𝘆=> 𝘁𝗼𝗴𝗴𝗹𝗲 𝗺𝗼𝗱𝗲 𝗼𝗻𝗹𝘆 𝘀𝘂𝗽𝗽𝗼𝗿𝘁 𝗯𝗼𝘁 𝘂𝘀𝗶𝗻𝗴 𝗯𝗼𝘁\n𝗠𝗢𝗗𝗘 - 𝗮𝗱𝗺𝗶𝗻 𝗼𝗻𝗹𝘆 => 𝘁𝗼𝗴𝗴𝗹𝗲 𝗺𝗼𝗱𝗲 𝗼𝗻𝗹𝘆 𝗮𝗱𝗺𝗶𝗻𝘀 𝗰𝗮𝗻 𝘂𝘀𝗲 𝗯𝗼𝘁\n𝗠𝗢𝗗𝗘 - 𝗮𝗱𝗺𝗶𝗻 𝗶𝗯𝗼𝗻𝗹𝘆 => 𝘁𝗼𝗴𝗴𝗹𝗲 𝗺𝗼𝗱 𝗼𝗻𝗹𝘆 𝗮𝗱𝗺𝗶𝗻𝘀 𝗰𝗮𝗻 𝘂𝘀𝗲 𝗯𝗼𝘁𝘀 𝗶𝗻 𝗶𝗯 𝘀𝗲𝗽𝗮𝗿𝗮𝘁𝗲𝗹𝘆 𝗳𝗿𝗼𝗺 𝗯𝗼𝘁𝘀\n━━━━━━━━━━━━━━━\n𝗛𝗗𝗦𝗗 => ${global.config.PREFIX}𝗮𝗱𝗺𝗶𝗻 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀 𝘁𝗼 𝘂𝘀𝗲`}, event.threadID, event.messageID);
	
	const { threadID, messageID, mentions } = event;
	const { configPath } = global.client;
	const { ADMINBOT } = global.config;
	const { NDH } = global.config;
	const { userName } = global.data;
	const { writeFileSync } = global.nodemodule["fs-extra"];
	const mention = Object.keys(mentions);

	delete require.cache[require.resolve(configPath)];
	var config = require(configPath);
	
	switch (args[0]) {
		case "list":
		case "all":
		case "-a": {
			listAdmin = ADMINBOT || config.ADMINBOT || [];
			var msg = [];
			for (const idAdmin of listAdmin) {
				if (parseInt(idAdmin)) {
					const name = (await Users.getData(idAdmin)).name
					msg.push(`🔰 ${name}\n»𝗟𝗶𝗻𝗸 𝗙𝗕: https://www.facebook.com/${idAdmin} 💌`);
				}
			}
			listNDH = NDH || config.NDH || [];
			var msg1 = [];
			for (const idNDH of listNDH) {
				if (parseInt(idNDH)) {
					const name1 = (await Users.getData(idNDH)).name
					msg1.push(`🔰 ${name1}\n»𝗟𝗶𝗻𝗸 𝗙𝗕: https://www.facebook.com/${idNDH} 🤖`);
				}
			}

			return api.sendMessage(getText("listAdmin", msg.join("\n\n"), msg1.join("\n\n")), threadID, messageID);
		}

		case "add": {
			if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);
			
			// Use the three-way mention detection system
			const { targetID, targetName } = await getTargetUser(api, event, content, Users);
			
			if (!targetID) {
				return api.sendMessage("❌রাহাদ বসকে ডাক দে🫩\nকীভাবে কমান্ড ব্যবহার করতে হয় শিখায় দিবো🥴", threadID, messageID);
			}
			
			// Check if already admin
			if (ADMINBOT.includes(targetID) || config.ADMINBOT.includes(targetID)) {
				return api.sendMessage(`❌ ${targetName} is already an admin!`, threadID, messageID);
			}
			
			// Add to admin list
			ADMINBOT.push(targetID);
			config.ADMINBOT.push(targetID);
			
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(getText("addedNewAdmin", 1, `🔰𝗔𝗱𝗺𝗶𝗻 - ${targetName}`), threadID, messageID);
		}
		
		case "addndh": {
			if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "addndh"), threadID, messageID);
			
			// Use the three-way mention detection system
			const { targetID, targetName } = await getTargetUser(api, event, content, Users);
			
			if (!targetID) {
				return api.sendMessage("❌রাহাদ বসকে ডাক দে🫩\nকীভাবে কমান্ড ব্যবহার করতে হয় শিখায় দিবো🥴", threadID, messageID);
			}
			
			// Check if already supporter
			if (NDH.includes(targetID) || config.NDH.includes(targetID)) {
				return api.sendMessage(`❌ ${targetName} is already a supporter!`, threadID, messageID);
			}
			
			// Add to supporter list
			NDH.push(targetID);
			config.NDH.push(targetID);
			
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(getText("addedNewNDH", 1, `𝗦𝘂𝗽𝗽𝗼𝗿𝘁𝗲𝗿𝘀 - ${targetName}`), threadID, messageID);
		}
		
		case "remove":
		case "rm":
		case "delete": {
			if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);
			
			// Use the three-way mention detection system
			const { targetID, targetName } = await getTargetUser(api, event, content, Users);
			
			if (!targetID) {
				return api.sendMessage("❌রাহাদ বসকে ডাক দে🫩\nকীভাবে কমান্ড ব্যবহার করতে হয় শিখায় দিবো🥴", threadID, messageID);
			}
			
			// Check if user is admin
			const adminIndex = config.ADMINBOT.findIndex(item => item == targetID);
			if (adminIndex === -1) {
				return api.sendMessage(`❌ ${targetName} is not an admin!`, threadID, messageID);
			}
			
			// Remove from admin list
			ADMINBOT.splice(adminIndex, 1);
			config.ADMINBOT.splice(adminIndex, 1);
			
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(getText("removedAdmin", 1, `${targetID} - ${targetName}`), threadID, messageID);
		}
		
		case "removendh": {
			if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "removendh"), threadID, messageID);
			
			// Use the three-way mention detection system
			const { targetID, targetName } = await getTargetUser(api, event, content, Users);
			
			if (!targetID) {
				return api.sendMessage("❌রাহাদ বসকে ডাক দে🫩\nকীভাবে কমান্ড ব্যবহার করতে হয় শিখায় দিবো🥴", threadID, messageID);
			}
			
			// Check if user is supporter
			const supporterIndex = config.NDH.findIndex(item => item == targetID);
			if (supporterIndex === -1) {
				return api.sendMessage(`❌ ${targetName} is not a supporter!`, threadID, messageID);
			}
			
			// Remove from supporter list
			NDH.splice(supporterIndex, 1);
			config.NDH.splice(supporterIndex, 1);
			
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(getText("removedNDH", 1, `${targetID} - ${targetName}`), threadID, messageID);
		}
		
		case 'qtvonly': {
			const { resolve } = require("path");
			const pathData = resolve(__dirname, 'cache', 'data.json');
			const database = require(pathData);
			const { adminbox } = database;
			if (permssion < 1) return api.sendMessage("𝗠𝗢𝗗𝗘 - 𝗕𝗼𝗿𝗱𝗲𝗿 𝗰𝗮𝗻𝗴𝗹𝗲 𝗿𝗶𝗴𝗵𝘁𝘀 🎀 ", threadID, messageID);
			if (adminbox[threadID] == true) {
				adminbox[threadID] = false;
				api.sendMessage("𝗠𝗢𝗗𝗘 » 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗱𝗶𝘀𝗮𝗯𝗹𝗲 𝗤𝗧𝗩 𝗺𝗼𝗱𝗲 𝗼𝗻𝗹𝘆 𝗲𝘃𝗲𝗿𝘆𝗼𝗻𝗲 𝗰𝗮𝗻 𝘂𝘀𝗲 𝘁𝗵𝗲 𝗯𝗼𝘁 👀", threadID, messageID);
			} else {
				adminbox[threadID] = true;
				api.sendMessage("𝗠𝗢𝗗𝗘 » 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗲𝗻𝗮𝗯𝗹𝗲 𝗤𝗧𝗩 𝗼𝗻𝗹𝘆 𝗺𝗼𝗱𝗲, 𝗼𝗻𝗹𝘆 𝗮𝗱𝗺𝗶𝗻𝗶𝘀𝘁𝗿𝗮𝘁𝗼𝗿𝘀 𝗰𝗮𝗻 𝘂𝘀𝗲 𝗯𝗼𝘁𝘀 👀", threadID, messageID);
			}
			writeFileSync(pathData, JSON.stringify(database, null, 4));
			break;
		}
		
		case 'ndhonly':
		case '-ndh': {
			if (permssion < 2) return api.sendMessage("𝗠𝗢𝗗𝗘 - 𝗕𝗼𝗿𝗱𝗲𝗿 𝗰𝗮𝗻𝗴𝗹𝗲 𝗿𝗶𝗴𝗵𝘁𝘀 🎀 ", threadID, messageID);
			if (config.ndhOnly == false) {
				config.ndhOnly = true;
				api.sendMessage(`𝗠𝗢𝗗𝗘 » 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗲𝗻𝗮𝗯𝗹𝗲 𝗡𝗗𝗛 𝗢𝗻𝗹𝘆 𝗺𝗼𝗱𝗲, 𝗼𝗻𝗹𝘆 𝗯𝗼𝘁 𝘀𝘂𝗽𝗽𝗼𝗿𝘁 𝗰𝗮𝗻 𝘂𝘀𝗲 𝗯𝗼𝘁 👾`, threadID, messageID);
			} else {
				config.ndhOnly = false;
				api.sendMessage(`𝗠𝗢𝗗𝗘 » 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗱𝗶𝘀𝗮𝗯𝗹𝗲 𝗡𝗗𝗛 𝗢𝗻𝗹𝘆 𝗺𝗼𝗱𝗲, 𝗲𝘃𝗲𝗿𝘆𝗼𝗻𝗲 𝗰𝗮𝗻 𝘂𝘀𝗲 𝘁𝗵𝗲 𝗯𝗼𝘁 👾`, threadID, messageID);
			}
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			break;
		}
		
		case 'ibonly': {
			if (permssion != 3) return api.sendMessage("𝗠𝗢𝗗𝗘 - 𝗕𝗼𝗿𝗱𝗲𝗿 𝗰𝗮𝗻𝗴𝗹𝗲 𝗿𝗶𝗴𝗵𝘁𝘀 🎀", threadID, messageID);
			if (config.adminPaOnly == false) {
				config.adminPaOnly = true;
				api.sendMessage("𝗠𝗢𝗗𝗘 » 𝗜𝗯 𝗢𝗻𝗹𝘆 𝗺𝗼𝗱𝗲 𝗶𝘀 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗲𝗻𝗮𝗯𝗹𝗲𝗱, 𝗼𝗻𝗹𝘆 𝗮𝗱𝗺𝗶𝗻𝘀 𝗰𝗮𝗻 𝘂𝘀𝗲 𝗯𝗼𝘁𝘀 𝗶𝗻 𝘁𝗵𝗲𝗶𝗿 𝗼𝘄𝗻 𝗶𝗻𝗯𝗼𝘅 💬", threadID, messageID);
			} else {
				config.adminPaOnly = false;
				api.sendMessage("[ 𝐌𝐎𝐃𝐄 ] » 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗱𝗶𝘀𝗮𝗯𝗹𝗲 𝗜𝗯 𝗢𝗻𝗹𝘆 𝗺𝗼𝗱𝗲, 𝗲𝘃𝗲𝗿𝘆𝗼𝗻𝗲 𝗰𝗮𝗻 𝘂𝘀𝗲 𝘁𝗵𝗲 𝗯𝗼𝘁 𝗶𝗻 𝘁𝗵𝗲𝗶𝗿 𝗼𝘄𝗻 𝗶𝗻𝗯𝗼𝘅 💬", threadID, messageID);
			}
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			break;
		}
		
		case 'only':
		case '-o': {
			if (permssion != 3) return api.sendMessage("𝗠𝗢𝗗𝗘 - 𝗕𝗼𝗿𝗱𝗲𝗿 𝗰𝗮𝗻𝗴𝗹𝗲 𝗿𝗶𝗴𝗵𝘁𝘀 🎀 ", threadID, messageID);
			if (config.adminOnly == false) {
				config.adminOnly = true;
				api.sendMessage(`𝗠𝗢𝗗𝗘 - 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗲𝗻𝗮𝗯𝗹𝗲 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗺𝗼𝗱𝗲, 𝗼𝗻𝗹𝘆 𝗮𝗱𝗺𝗶𝗻𝘀 𝗰𝗮𝗻 𝘂𝘀𝗲 𝗯𝗼𝘁𝘀 👑`, threadID, messageID);
			} else {
				config.adminOnly = false;
				api.sendMessage(`𝗠𝗢𝗗𝗘 - 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗱𝗶𝘀𝗮𝗯𝗹𝗲 𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗺𝗼𝗱𝗲, 𝗲𝘃𝗲𝗿𝘆𝗼𝗻𝗲 𝗰𝗮𝗻 𝘂𝘀𝗲 𝘁𝗵𝗲 𝗯𝗼𝘁 👑`, threadID, messageID);
			}
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			break;
		}
		
		default: {
			return global.utils.throwError(this.config.name, threadID, messageID);
		}
	};
}
