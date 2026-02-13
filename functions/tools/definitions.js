const SERVER_TOOLS = [
  {
    type: "function",
    name: "get_nominee_info",
    description:
      "Look up Oscar nominee information by search query or category. Returns categories, nominees, and film details.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Free-text search for a film, person, or category name (e.g. 'Sinners', 'Best Picture', 'Timothee Chalamet')",
        },
        category_id: {
          type: "string",
          description:
            "Exact category ID to look up (e.g. 'best-picture', 'best-actor')",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_ceremony_status",
    description:
      "Get the current ceremony status including lock state, whether the ceremony has started, and how many winners have been announced.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_leaderboard",
    description:
      "Get the current leaderboard rankings with user names and scores.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of entries to return (default 10)",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "search_users",
    description:
      "Search for users by display name. Returns profile info and optionally their picks (only if ceremony has started).",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or partial name to search for",
        },
        include_picks: {
          type: "boolean",
          description:
            "Whether to include the user's picks in the results (only works after ceremony starts)",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_user_score",
    description:
      "Get the current user's score with optional per-category breakdown.",
    parameters: {
      type: "object",
      properties: {
        include_breakdown: {
          type: "boolean",
          description: "Whether to include per-category breakdown",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_winners",
    description: "Get all announced Oscar winners so far.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
];

const CLIENT_TOOLS = [
  {
    type: "function",
    name: "save_pick",
    description:
      "Save a ballot pick for a specific category. The user must confirm before this is called.",
    parameters: {
      type: "object",
      properties: {
        category_id: {
          type: "string",
          description: "The category ID (e.g. 'best-picture', 'best-actor')",
        },
        nominee_id: {
          type: "string",
          description: "The nominee ID to pick",
        },
      },
      required: ["category_id", "nominee_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "navigate",
    description: "Navigate the user to a different page in the app.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "The route path (e.g. '/ballot', '/leaderboard', '/films', '/')",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "navigate_to_category",
    description:
      "Navigate the user directly to a specific award category on the ballot page. Use this when the user asks to go to a specific category like 'Best Picture' or 'Best Director'.",
    parameters: {
      type: "object",
      properties: {
        category_id: {
          type: "string",
          description:
            "The category ID to navigate to (e.g. 'best-picture', 'best-director', 'best-actor')",
        },
      },
      required: ["category_id"],
      additionalProperties: false,
    },
  },
];

const SERVER_TOOL_NAMES = new Set(SERVER_TOOLS.map((t) => t.name));
const CLIENT_TOOL_NAMES = new Set(CLIENT_TOOLS.map((t) => t.name));

module.exports = {
  SERVER_TOOLS,
  CLIENT_TOOLS,
  SERVER_TOOL_NAMES,
  CLIENT_TOOL_NAMES,
  ALL_TOOLS: [...SERVER_TOOLS, ...CLIENT_TOOLS],
};
