A finished run reports its outcome separately from the model’s reply. After a change, GoHarness records recognized checks such as tests, builds, linters, type checks, and explicit assertions. Add a project-specific verification command if you want GoHarness to run a particular check after changes. [Verification details](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#headless-cli)

## Run outcomes

| Outcome | What it means |
| --- | --- |
| Verified | GoHarness recorded a passing check for the change. Open the evidence to see the command and scope. |
| Unverified | GoHarness recorded file changes or incomplete change tracking without a qualifying passing check. |
| No changes | GoHarness ended the run without detecting file changes. |
| Failed verification | The configured check still failed after the allowed repair attempts. |

## Evidence and budgets

The run record identifies the check’s source, command, kind, scope, exit code, revision, and change-tracking coverage when available. A passing check covers the work it exercised. Set wall time, tool-call, and token limits for a run and its children. For a Go project, put the following in your user configuration to run the suite after a change and allow one repair attempt. [Run outcomes and evidence](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#headless-cli) · [Verification and budgets](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#verification-and-budgets)

```json
{
  "verify": {
    "command": "go test ./...",
    "repair_attempts": 1
  }
}
```

## Access settings

| Access setting | What it allows |
| --- | --- |
| Ask | Reads and searches run automatically. Edits, commands, web requests, and MCP actions ask for approval. |
| Auto-edit | In-scope edits and read-only project commands can proceed automatically where the read-only sandbox is available. |
| Auto | In-scope commands can run automatically with filesystem confinement where the OS can enforce it. Stricter rules and an unavailable boundary can require approval. |
| Full access | Tool execution proceeds without the automatic shell sandbox. Explicit ask and deny rules and the loop guard still apply. |

## Review and enforcement

Approve an action once or grant similar actions for a session. Use command and file rules or folder-specific access settings for recurring decisions. Folder trust lets you reopen a workspace directly. Tool approval controls whether an action can run. Shell confinement controls what a running command can reach. Web approvals can be scoped to an origin. Child processes receive a filtered environment. The shell sandbox uses sandbox-exec on macOS and Landlock on supported Linux kernels. Its network and file protections vary by OS and configuration. On Windows and on Linux without Landlock, access levels that depend on automatic confinement ask first. A command that explicitly requires an unavailable sandbox is refused. Shell confinement covers commands, jobs, and formatters. MCP, LSP, and hooks have separate controls. [Access levels](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#access-levels) · [Sandbox boundaries](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#shell-sandbox) · [Platform coverage](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/development/STATUS.md#platform-coverage)

## File protections

The built-in file tools operate inside the selected project. Editing an existing file checks the SHA-256 from the read, exact edits check the requested match, and generated files are protected by default. File deny rules hide matching files from built-in reads, searches, and attachments. Built-in edits protect `.git`. Shell commands follow the protections supported by the selected sandbox. [File rules and generated files](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#file-rules) · [Editing and patching](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#file-editing)

## What stays on your machine

The GoHarness process, session journals, and tool execution run locally. A configured provider receives prompts and the relevant context assembled for a request, which can include attached files, tool output, and conversation history. A local Ollama route supplies local inference. Configured web tools and remote integrations contact their respective services. API keys are scoped to their routes, and saved credentials can be sealed using the OS credential store. Project content can appear in transcripts and exports, so review them before sharing. [Architecture and provider requests](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/ARCHITECTURE.md#one-prompt-end-to-end) · [Credentials](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#credentials) · [Sessions and exports](https://github.com/Sanidhya14321/goh/blob/v1.1.0/docs/USER_GUIDE.md#sessions-and-recovery)
