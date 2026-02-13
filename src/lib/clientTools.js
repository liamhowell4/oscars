import nominees from '../data/nominees2026.json';

const VALID_PATHS = ['/', '/ballot', '/leaderboard', '/films', '/groups', '/admin'];

export async function executeClientTools(toolCalls, { savePick, navigate, categories }) {
  const results = [];

  for (const toolCall of toolCalls) {
    const args = typeof toolCall.arguments === 'string'
      ? JSON.parse(toolCall.arguments)
      : toolCall.arguments;

    let output;

    try {
      switch (toolCall.name) {
        case 'save_pick': {
          const { category_id, nominee_id } = args;
          const category = categories.find((c) => c.id === category_id);
          if (!category) {
            output = { success: false, error: `Unknown category: ${category_id}` };
            break;
          }
          const nominee = category.nominees.find((n) => n.id === nominee_id);
          if (!nominee) {
            output = { success: false, error: `Unknown nominee "${nominee_id}" in category "${category.name}"` };
            break;
          }
          await savePick(category_id, nominee_id);
          output = { success: true, message: `Picked ${nominee.title} for ${category.name}` };
          break;
        }

        case 'navigate': {
          const { path } = args;
          if (!VALID_PATHS.includes(path)) {
            output = { success: false, error: `Invalid path: ${path}. Valid paths: ${VALID_PATHS.join(', ')}` };
            break;
          }
          navigate(path);
          output = { success: true, message: `Navigated to ${path}` };
          break;
        }

        case 'navigate_to_category': {
          const { category_id } = args;
          const category = categories.find((c) => c.id === category_id);
          if (!category) {
            output = { success: false, error: `Unknown category: ${category_id}` };
            break;
          }
          navigate(`/ballot?category=${category_id}`);
          output = { success: true, message: `Navigated to ${category.name}` };
          break;
        }

        default:
          output = { success: false, error: `Unknown tool: ${toolCall.name}` };
      }
    } catch (err) {
      output = { success: false, error: err.message };
    }

    results.push({ call_id: toolCall.call_id, output });
  }

  return results;
}
