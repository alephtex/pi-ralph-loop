/**
 * Ralph Loop Extension
 * 
 * A looping command that keeps sending "continue" to the LLM until it writes
 * the special marker `>system-promise-done<` in its response.
 * 
 * Usage:
 *   /ralph-loop        - Start the loop (sends initial "continue")
 *   /ralph-stop        - Stop the loop
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const DONE_MARKER = ">system-promise-done<";
const CONTINUE_MESSAGE = "continue";

export default function (pi: ExtensionAPI) {
	let isLooping = false;
	let loopIteration = 0;
	let abortController: AbortController | null = null;

	// Subscribe to message updates to detect the done marker
	pi.on("message_update", async (event, ctx) => {
		if (!isLooping) return;
		if (event.message.role !== "assistant") return;

		// Extract text content from the message
		let fullText = "";
		for (const block of event.message.content) {
			if (block.type === "text") {
				fullText += block.text;
			}
		}

		// Check for the done marker
		if (fullText.includes(DONE_MARKER)) {
			isLooping = false;
			abortController = null;
			ctx.ui.notify(`Ralph loop complete after ${loopIteration} iteration(s)!`, "success");
			return;
		}

		// Check if this turn ended (no more tool calls = turn complete)
		// We need to check if the assistant has finished its turn
		const hasToolCalls = event.message.content.some((block) => block.type === "toolCall");

		// If the message ended without tool calls and we're still looping, send continue
		if (event.assistantMessageEvent?.type === "message_stop" && !hasToolCalls) {
			loopIteration++;
			ctx.ui.setStatus("ralph-loop", `Ralph loop: iteration ${loopIteration}...`);

			// Check once more for the marker after full turn
			if (fullText.includes(DONE_MARKER)) {
				isLooping = false;
				abortController = null;
				ctx.ui.notify(`Ralph loop complete after ${loopIteration} iteration(s)!`, "success");
				ctx.ui.setStatus("ralph-loop", undefined);
				return;
			}

			// Send continue for next iteration
			pi.sendUserMessage(CONTINUE_MESSAGE, { deliverAs: "steer" });
		}
	});

	// Also listen for turn_end to be more reliable
	pi.on("turn_end", async (event, ctx) => {
		if (!isLooping) return;

		// Get the last assistant message from this turn
		const lastAssistant = event.message;
		if (!lastAssistant || lastAssistant.role !== "assistant") return;

		// Extract text content
		let fullText = "";
		for (const block of lastAssistant.content) {
			if (block.type === "text") {
				fullText += block.text;
			}
		}

		// Check for done marker
		if (fullText.includes(DONE_MARKER)) {
			isLooping = false;
			abortController = null;
			ctx.ui.notify(`Ralph loop complete after ${loopIteration} iteration(s)!`, "success");
			ctx.ui.setStatus("ralph-loop", undefined);
			return;
		}

		// If turn ended with no tool calls (pure text response), send continue
		const hasToolCalls = lastAssistant.content.some((block) => block.type === "toolCall");
		if (!hasToolCalls) {
			loopIteration++;
			ctx.ui.setStatus("ralph-loop", `Ralph loop: iteration ${loopIteration}...`);
			pi.sendUserMessage(CONTINUE_MESSAGE, { deliverAs: "steer" });
		}
	});

	// Start the ralph loop
	pi.registerCommand("ralph-loop", {
		description: "Start looping 'continue' until LLM writes >system-promise-done<",
		handler: async (_args, ctx) => {
			if (isLooping) {
				ctx.ui.notify("Ralph loop already running!", "warning");
				return;
			}

			isLooping = true;
			loopIteration = 1;
			abortController = new AbortController();

			ctx.ui.notify("Starting Ralph loop...", "info");
			ctx.ui.setStatus("ralph-loop", "Ralph loop: iteration 1...");

			// Send initial "continue" message
			pi.sendUserMessage(CONTINUE_MESSAGE);
		},
	});

	// Stop the ralph loop
	pi.registerCommand("ralph-stop", {
		description: "Stop the ralph loop",
		handler: async (_args, ctx) => {
			if (!isLooping) {
				ctx.ui.notify("Ralph loop is not running.", "info");
				return;
			}

			isLooping = false;
			if (abortController) {
				abortController.abort();
				abortController = null;
			}
			ctx.ui.setStatus("ralph-loop", undefined);
			ctx.ui.notify(`Ralph loop stopped after ${loopIteration} iteration(s).`, "info");
		},
	});

	// Show loop status in header on session start
	pi.on("session_start", async (_event, ctx) => {
		if (isLooping) {
			ctx.ui.setStatus("ralph-loop", `Ralph loop: iteration ${loopIteration}...`);
		}
	});
}
