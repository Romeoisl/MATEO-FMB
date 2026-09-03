function createUserObject(userID, name = 'User') {
  return {
    id: userID,
    name,
    coins: 0,
    level: 1,
    xp: 0,
    messagesCount: 0,
    commandsUsed: 0,
    lastMessage: new Date(),
    firstSeen: new Date(),
    avatar: null,
    stats: {
      messagesByGroup: {},
      commandsByType: {},
      achievements: [],
    },
  };
}

function createGroupObject(groupID, name = 'Group') {
  return {
    id: groupID,
    name,
    enabled: true,
    prefix: '/',
    language: 'en',
    features: {
      economy: true,
      ai: true,
      antiSpam: false,
      welcome: true,
      logging: true,
    },
    admins: [],
    moderation: {
      antiLink: false,
      antiSpam: { enabled: false, threshold: 5 },
      mutedUsers: [],
    },
    settings: {},
    createdAt: new Date(),
  };
}

module.exports = { createUserObject, createGroupObject };
