// src/handlers/messageHandler.ts
import { Message, TextChannel } from "discord.js";
import { coderChatbotHandler } from "../commands/coder";
import { handleGrammarFix2 } from "./grammarHandlers";
import { handleImageGeneration } from "../services/imageGeneration";
import {
  currentTestPrompt,
  setCurrentTestPrompt,
} from "../prompts/systemMessage";

// Import shared state and functions
import { fixGrammarUsers, aiCodeAssistChannels } from "../config";
import {
  handleHello,
  handleGpt,
  handleMessageWithEmiliaMention,
  gpt,
} from "../services/messageServices";
import { checkUserRateLimit } from "../services/rateLimit";

async function checkIfLimitExceeded(msg: Message) {
  const rateLimitResult = await checkUserRateLimit(msg.author.id);
  if (rateLimitResult) {
    const { limit, remaining, resetTime, key } = rateLimitResult;
    const timeUnit = key;
    console.log(
      `Rate limit exceeded for user ${msg.author.id}:`,
      rateLimitResult
    );
    await msg.reply(
      `Rate limit exceeded. You can send ${limit} messages per ${timeUnit}. ${remaining} messages remaining. Try again in ${Math.ceil(
        (resetTime - Date.now() / 1000) / 60
      )} minutes.`
    );
    return true;
  }
  return false;
}

const messagesIds = new Set<string>();
export function setupMessageHandler(client: any) {
  return async function messageHandler(msg: Message) {
    if (messagesIds.has(msg.id)) {
      console.log("Duplicate message", msg.id);
      return;
    }
    messagesIds.add(msg.id);
    console.log("on messageCreate", msg.content, {
      id: msg.id,
      author: msg.author.username,
      authorId: msg.author.id,
      channel: (msg.channel as TextChannel).name,
      time: new Date().toISOString(),
      attachments: msg.attachments,
      parentName: (msg.channel as TextChannel).parent?.name,
    });

    try {
      if (msg.author.bot) return;

      if (msg.content === "!hello") {
        await handleHello(msg);
      } else if (
        msg.content.startsWith("!gpt") ||
        msg.content.startsWith("!гпт")
      ) {
        if (await checkIfLimitExceeded(msg)) return;
        if (aiCodeAssistChannels.includes((msg.channel as TextChannel).name)) {
          await coderChatbotHandler(msg);
        } else {
          await handleGpt(client, msg);
        }
      } else if (
        msg.content.startsWith("!img") ||
        msg.content.startsWith("!image")
      ) {
        if (await checkIfLimitExceeded(msg)) return;
        await handleImageGeneration(msg);
      } else if (isBotMentioned(msg)) {
        if (msg.author.id === "1085479521240743946") return;
        if (await checkIfLimitExceeded(msg)) return;
        if (aiCodeAssistChannels.includes((msg.channel as TextChannel).name)) {
          await coderChatbotHandler(msg);
        } else {
          await handleMessageWithEmiliaMention(client, msg);
        }
      } else if (msg.content.startsWith("!prompt")) {
        msg.reply(`Current prompt:\n\n${currentTestPrompt}`);
      } else if (msg.content.startsWith("!setprompt")) {
        const prompt = msg.content.replace("!setprompt", "").trim();
        setCurrentTestPrompt(prompt);
        await msg.reply(`New prompt: "${currentTestPrompt}"`);
      } else if (fixGrammarUsers.includes(msg.author.id)) {
        await handleGrammarFix2(msg, getUserLastMessage, gpt);
      }
    } catch (e: unknown) {
      console.error(e);
      msg.reply("Error: " + (e as Error).message);
    }
  };
}

function isBotMentioned(msg: Message): boolean {
  const includesArray = ["ботик", "ботяра", "ботан", "botik", "botan"];
  return (
    msg?.mentions?.repliedUser?.id === "1085479521240743946" ||
    includesArray.some((include) => msg.content.toLowerCase().includes(include))
  );
}

// You'll need to implement or import getUserLastMessage function
async function getUserLastMessage(
  msg: Message,
  count: number,
  maxTime: number
): Promise<any[]> {
  // Implementation goes here
  return [];
}
