/**
 * Ralph Loop Extension
 * 
 * A looping command that keeps sending "continue" to the LLM until it writes
 * the special marker `>system-promise-done<` in its response.
 * 
 * Usage:
 *   /ralph-loop        - Start the loop (captures previous message as task)
 *   /ralph-stop        - Stop the loop
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const DONE_MARKER = ">system-promise-done<";

export default function (pi: ExtensionAPI) {
	let isLooping = false;
	let loopIteration = 0;
	let promise: string = "";

	/**
	 * Extract text from message content
	 */
	function getMessageText(content: any[]): string {
		let text = "";
		for (const block of content) {
			if (block.type === "text") {
				text += block.text;
			}
		}
		return text;
	}

	/**
	 * Get the last user message from the session
	 */
	function getLastUserMessage(ctx: any): string {
		const branch = ctx.sessionManager.getBranch();
		for (let i = branch.length - 1; i >= 0; i--) {
			const entry = branch[i];
			if (entry.type === "message" && entry.message.role === "user") {
				const content = entry.message.content;
				if (typeof content === "string") {
					return content;
				}
				if (Array.isArray(content)) {
					return getMessageText(content);
				}
			}
		}
		return "";
	}

	/**
	 * Build the continue message with task context
	 */
	function buildContinueMessage(): string {
		return `Continue working on your task. Remember to end your response with ${DONE_MARKER} when complete.\n\nTask: ${promise}`;
	}

	/**
	 * Check if message contains the done marker
	 */
	function hasDoneMarker(message: any): boolean {
		if (!message || message.role !== "assistant") return false;
		const text = getMessageText(message.content);
		return text.includes(DONE_MARKER);
	}

	/**
	 * Check if assistant has tool calls
	 */
	function hasToolCalls(message: any): boolean {
		return message.content.some((block: any) => block.type === "toolCall");
	}

	// Listen for turn_end to detect completion
	pi.on("turn_end", async (event, ctx) => {
		if (!isLooping) return;

		const lastAssistant = event.message;
		if (!lastAssistant) return;

		// Check for done marker
		if (hasDoneMarker(lastAssistant)) {
			isLooping = false;
			ctx.ui.notify(`Ralph loop complete after ${loopIteration} iteration(s)!`, "success");
			ctx.ui.setStatus("ralph-loop", undefined);
			return;
		}

		// If turn ended with no tool calls, send continue
		if (!hasToolCalls(lastAssistant)) {
			loopIteration++;
			ctx.ui.setStatus("ralph-loop", `Ralph loop: iteration ${loopIteration}...`);
			pi.sendUserMessage(buildContinueMessage(), { deliverAs: "steer" });
		}
	});

	// Start the ralph loop
	pi.registerCommand("ralph-loop", {
		description: "Start looping 'continue' with task context until >system-promise-done<",
		handler: async (_args, ctx) => {
			if (isLooping) {
				ctx.ui.notify("Ralph loop already running!", "warning");
				return;
			}

			// Capture the user's last message as the task
			promise = getLastUserMessage(ctx);

			if (!promise.trim()) {
				ctx.ui.notify("No user message found to use as task.", "error");
				return;
			}

			// Truncate very long prompts for the continue message
			if (promise.length > 500) {
				promise = promise.slice(0, 500) + "...";
			}

			isLooping = true;
			loopIteration = 1;

			ctx.ui.notify("Starting Ralph loop...", "info");
			ctx.ui.setStatus("ralph-loop", "Ralph loop: iteration 1...");

			// Send initial continue with task
			pi.sendUserMessage(buildContinueMessage());
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
			ctx.ui.setStatus("ralph-loop", undefined);
			ctx.ui.notify(`Ralph loop stopped after ${loopIteration} iteration(s).`, "info");
		},
	});

	// Show loop status on session start
	pi.on("session_start", async (_event, ctx) => {
		if (isLooping) {
			ctx.ui.setStatus("ralph-loop", `Ralph loop: iteration ${loopIteration}...`);
		}
	});
}
