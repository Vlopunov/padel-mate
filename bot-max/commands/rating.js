import { Keyboard } from "@maxhub/max-bot-api";

export async function ratingCommand(ctx, miniAppUrl) {
  const keyboard = Keyboard.inlineKeyboard([
    [Keyboard.button.link("📊 Мой рейтинг", miniAppUrl)],
  ]);

  await ctx.reply("📊 Чтобы посмотреть ваш рейтинг и статистику, откройте приложение:", {
    attachments: [keyboard],
  });
}
