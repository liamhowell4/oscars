const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const OpenAI = require("openai");

const { buildSystemPrompt } = require("./lib/systemPrompt");
const { ALL_TOOLS, SERVER_TOOL_NAMES, CLIENT_TOOL_NAMES } = require("./tools/definitions");
const { executeServerTool } = require("./tools/serverTools");

initializeApp();
const db = getFirestore();
const openaiApiKey = defineSecret("OPENAI_API_KEY");

const MAX_TOOL_ITERATIONS = 5; // v2

exports.chat = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    secrets: [openaiApiKey],
  },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to use chat.");
    }
    const uid = request.auth.uid;

    const { messages, userContext, conversationState, toolResults } =
      request.data;

    const openai = new OpenAI({ apiKey: openaiApiKey.value() });

    // Build input array
    let input;

    if (conversationState && toolResults) {
      // Resuming after client-side tool execution
      input = [...conversationState];
      for (const result of toolResults) {
        input.push({
          type: "function_call_output",
          call_id: result.call_id,
          output: typeof result.output === "string"
            ? result.output
            : JSON.stringify(result.output),
        });
      }
    } else if (messages && userContext) {
      // New conversation turn
      const systemPrompt = buildSystemPrompt(userContext);

      input = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
    } else {
      throw new HttpsError(
        "invalid-argument",
        "Must provide either { messages, userContext } or { conversationState, toolResults }."
      );
    }

    // Get ceremony status for context
    const ceremonyDoc = await db.collection("config").doc("ceremony").get();
    const ceremonyStarted = ceremonyDoc.exists
      ? ceremonyDoc.data().ceremonyStarted || false
      : false;

    const toolContext = { db, uid, ceremonyStarted };

    // Loop: call OpenAI, handle server tools, repeat
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await openai.responses.create({
        model: "gpt-5.2",
        input,
        tools: ALL_TOOLS,
      });

      // Collect function calls and message outputs
      const functionCalls = response.output.filter(
        (item) => item.type === "function_call"
      );
      const messageItems = response.output.filter(
        (item) => item.type === "message"
      );

      // No tool calls — return the text response
      if (functionCalls.length === 0) {
        const text = messageItems
          .map((m) => m.content.map((c) => c.text).join(""))
          .join("");
        return { status: "complete", message: text };
      }

      // Check if any are client-side tools
      const clientCalls = functionCalls.filter((fc) =>
        CLIENT_TOOL_NAMES.has(fc.name)
      );
      const serverCalls = functionCalls.filter((fc) =>
        SERVER_TOOL_NAMES.has(fc.name)
      );

      // If there are client-side tool calls, return them to the client
      if (clientCalls.length > 0) {
        // First execute any server calls that came with them
        for (const call of serverCalls) {
          const args = JSON.parse(call.arguments);
          const result = await executeServerTool(call.name, args, toolContext);
          input.push(call);
          input.push({
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify(result),
          });
        }

        // Return client tool calls with conversation state for resumption
        const pendingToolCalls = clientCalls.map((fc) => ({
          call_id: fc.call_id,
          name: fc.name,
          arguments: JSON.parse(fc.arguments),
        }));

        // Add the client function_call items to the state so the client
        // can append function_call_output entries alongside them
        const stateForClient = [...input, ...clientCalls];

        return {
          status: "tool_call_pending",
          toolCalls: pendingToolCalls,
          conversationState: stateForClient,
        };
      }

      // All calls are server-side — execute and continue the loop
      for (const call of serverCalls) {
        const args = JSON.parse(call.arguments);
        const result = await executeServerTool(call.name, args, toolContext);
        input.push(call);
        input.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      }
      // Loop continues — OpenAI will be called again with the tool results
    }

    // Exceeded max iterations — return whatever we have
    return {
      status: "complete",
      message:
        "I ran into an issue processing your request. Please try again.",
    };
  }
);
