import { Keyboard } from "@maxhub/max-bot-api";

export async function startCommand(ctx, miniAppUrl, apiUrl) {
  const name = ctx.user?.name || "Игрок";
  const payload = ctx.startPayload;

  // Deep link: /start match_5
  const matchParam = payload?.match?.(/match_(\d+)/);
  if (matchParam) {
    const matchId = matchParam[1];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${apiUrl}/api/matches/${matchId}/info`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const match = await res.json();
        const date = new Date(match.date);
        const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
        const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const playerNames = match.players?.map((p) => p.user.firstName).join(", ") || "—";
        const spots = 4 - (match.players?.length || 0);

        const keyboard = Keyboard.inlineKeyboard([
          [Keyboard.button.link("🎾 Открыть матч", `${miniAppUrl}?match=${matchId}`)],
        ]);

        await ctx.reply(
          `🎾 <b>Матч #${matchId}</b>\n\n` +
            `📍 ${match.venue?.name || "—"}\n` +
            `📅 ${dateStr} в ${timeStr}\n` +
            `⏱ ${match.durationMin} мин\n` +
            `👥 Игроки: ${playerNames}\n` +
            `${spots > 0 ? `🟢 Свободных мест: ${spots}` : "🔴 Матч укомплектован"}\n\n` +
            `Нажмите кнопку, чтобы открыть матч в приложении.`,
          { format: "html", attachments: [keyboard] }
        );
      } else {
        await ctx.reply("❌ Матч не найден или был удалён.");
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error("Deep link match error:", err);
      await ctx.reply("❌ Не удалось загрузить информацию о матче.");
    }
    return;
  }

  // Default /start
  const keyboard = Keyboard.inlineKeyboard([
    [Keyboard.button.link("🎾 Открыть Padel GO", miniAppUrl)],
  ]);

  await ctx.reply(
    `👋 Привет, ${name}!\n\n` +
      `🎾 <b>Padel GO</b> — приложение для падел-сообщества.\n\n` +
      `Здесь вы сможете:\n` +
      `🎾 Находить матчи и партнёров\n` +
      `📊 Отслеживать рейтинг\n` +
      `🏆 Участвовать в турнирах\n` +
      `🏅 Получать достижения\n\n` +
      `Нажмите кнопку ниже, чтобы начать!`,
    { format: "html", attachments: [keyboard] }
  );
}
