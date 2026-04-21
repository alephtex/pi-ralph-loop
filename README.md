# pi-ralph-loop

A looping command for [pi](https://github.com/badlogic/pi-mono) that keeps sending "continue" to the LLM until it writes the special marker `>system-promise-done<`.

![pi](https://img.shields.io/badge/pi-coding--agent-v1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Use Case

This extension is useful when you want the LLM to keep working on a task until it explicitly signals completion. Just tell the LLM to end its response with `>system-promise-done<` when finished.

## Commands

| Command | Description |
|---------|-------------|
| `/ralph-loop` | Start the loop - sends "continue" repeatedly until the done marker is found |
| `/ralph-stop` | Stop the loop manually |

## How It Works

1. `/ralph-loop` sends an initial "continue" message
2. After each LLM turn completes (no more tool calls)
3. Checks if the response contains `>system-promise-done<`
4. If found: stops the loop and shows completion notification
5. If not found: sends another "continue" and increments iteration counter

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

## Usage Example

```
You: Write a comprehensive test suite for my auth module. End your response with >system-promise-done< when complete.

/ralph-loop

pi: (starts sending "continue" after each LLM turn)

... LLM works on tests, writes tests, writes more tests ...

pi: Great, continue
    (LLM writes more tests)

pi: All tests are written. Here's the summary:
    - Unit tests for login/logout
    - Integration tests for token refresh
    - Edge case coverage
    >system-promise-done<

pi: Ralph loop complete after 5 iteration(s)!
```

## Status Bar

While running, the iteration count is shown in the status bar:
```
Ralph loop: iteration 3...
```

## Requirements

- [pi coding agent](https://www.npmjs.com/package/@mariozechner/pi-coding-agent)

## License

MIT
