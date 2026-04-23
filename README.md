[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/steimerbyte)

> ⭐ If you find this useful, consider [supporting me on Ko-fi](https://ko-fi.com/steimerbyte)!

<img src="https://storage.ko-fi.com/cdn/generated/fhfuc7slzawvi/2026-04-23_rest-162bec27f642a562eb8401eb0ceb3940-onjpojl8.jpg" alt="steimerbyte" style="border-radius: 5%; margin: 16px 0; max-width: 100%;"/>

# pi-ralph-loop

A looping command for [pi](https://github.com/badlogic/pi-mono) that keeps sending "continue" to the LLM with your original task context, until it writes the special marker `>system-promise-done<`.

![pi](https://img.shields.io/badge/pi-coding--agent-v1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Use Case

This extension is useful when you want the LLM to keep working on a task until it explicitly signals completion. Just tell the LLM to end its response with `>system-promise-done<` when finished.

## How It Works

1. `/ralph-loop` captures your last user message as the "task"
2. Sends "continue" with the original task context
3. After each LLM turn completes (no more tool calls)
4. Checks if the response contains `>system-promise-done<`
5. If found: stops the loop and shows completion notification
6. If not found: sends another "continue" with task context

## Installation

### Automatic (recommended)

```bash
pi install git:github.com:alephtex/pi-ralph-loop
```

### Manual

1. Clone the repository:
```bash
git clone https://github.com/alephtex/pi-ralph-loop.git
```

2. Copy the extension to your extensions folder:
```bash
cp -r pi-ralph-loop/index.ts ~/.pi/agent/extensions/
```

3. Restart pi or run `/reload`

## Usage

```
You: Write a comprehensive test suite for my auth module.
     Make sure to end with >system-promise-done< when complete.

/ralph-loop

pi: Starting Ralph loop...

pi: (continues automatically with task context)

    continue
    Task: Write a comprehensive test suite for my auth module.
          Make sure to end with >system-promise-done< when complete.

    ... LLM writes tests ...

    All tests are written.
    >system-promise-done<

pi: Ralph loop complete after 3 iteration(s)!
```

## Commands

| Command | Description |
|---------|-------------|
| `/ralph-loop` | Start the loop - captures your last message as task, sends "continue" with context |
| `/ralph-stop` | Stop the loop manually |

## Status Bar

While running, the iteration count is shown in the status bar:
```
Ralph loop: iteration 3...
```

## Tips

- Write a clear initial prompt before running `/ralph-loop`
- Include "end with >system-promise-done<" in your original prompt
- The original task is truncated to 500 chars if too long

## Requirements

- [pi coding agent](https://www.npmjs.com/package/@mariozechner/pi-coding-agent)

## License

MIT
