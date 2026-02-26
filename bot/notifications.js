// This module is used by the server-side notification service.
// The bot itself handles incoming messages.
// Server pushes notifications through the Telegram Bot API directly.
// See server/services/notifications.js for the implementation.

module.exports = {
  // Re-export for reference
  NOTIFICATION_TYPES: {
    MATCH_REMINDER: "match_reminder",
    NEW_MATCH: "new_match",
    SCORE_CONFIRMATION: "score_confirmation",
    RATING_UPDATE: "rating_update",
    ACHIEVEMENT: "achievement",
    TOURNAMENT: "tournament",
  },
};
