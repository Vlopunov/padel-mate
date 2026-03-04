const fetch = require("node-fetch");

module.exports = async function startCommand(bot, msg, miniAppUrl, apiUrl) {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "Игрок";
  const text = msg.text || "";

  // Deep link: /start match_5
  const matchParam = text.match(/\/start\s+match_(\d+)/);
  if (matchParam) {
    const matchId = matchParam[1];
    try {
      const res = await fetch(`${apiUrl}/api/matches/${matchId}/info`);
      if (res.ok) {
        const match = await res.json();
        const date = new Date(match.date);
        const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
        const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const playerNames = match.players?.map((p) => p.user.firstName).join(", ") || "—";
        const spots = 4 - (match.players?.length || 0);

        await bot.sendMessage(
          chatId,
          `🎾 <b>Матч #${matchId}</b>\n\n` +
            `📍 ${match.venue?.name || "—"}\n` +
            `📅 ${dateStr} в ${timeStr}\n` +
            `⏱ ${match.durationMin} мин\n` +
            `👥 Игроки: ${playerNames}\n` +
            `${spots > 0 ? `🟢 Свободных мест: ${spots}` : "🔴 Матч укомплектован"}\n\n` +
            `Нажмите кнопку, чтобы открыть матч в приложении.`,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎾 Открыть матч", web_app: { url: `${miniAppUrl}?match=${matchId}` } }],
              ],
            },
          }
        );
      } else {
        await bot.sendMessage(chatId, "❌ Матч не найден или был удалён.");
      }
    } catch (err) {
      console.error("Deep link match error:", err);
      await bot.sendMessage(chatId, "❌ Не удалось загрузить информацию о матче.");
    }
    return;
  }

  // Default /start
  await bot.sendMessage(
    chatId,
    `👋 Привет, ${name}!\n\n` +
      `🎾 <b>Padel GO</b> — приложение для падел-сообщества Беларуси.\n\n` +
      `Здесь вы сможете:\n` +
      `🎾 Находить матчи и партнёров\n` +
      `📊 Отслеживать рейтинг\n` +
      `🏆 Участвовать в турнирах\n` +
      `🏅 Получать достижения\n\n` +
      `Нажмите кнопку ниже, чтобы начать!`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎾 Открыть Padel GO", web_app: { url: miniAppUrl } }],
        ],
      },
    }
  );
};
