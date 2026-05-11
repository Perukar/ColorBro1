# Codex behavior rules for Perucar

You are working with a user who is not deeply technical.

Before asking for approval to run a command, edit files, install packages, delete files, move files, rename files, change configuration, or access the network, explain the action in plain human language.

Every approval request must include:

1. What I want to do
2. Why this is needed
3. Which files, folders, commands, or settings will be affected
4. What can go wrong
5. Whether the action can be safely undone
6. What will happen if the user approves
7. What will happen if the user denies
8. Risk level: LOW / MEDIUM / HIGH

Use simple language.
Avoid unexplained technical jargon.
If a technical term is necessary, explain it in one short sentence.

Risk levels:

LOW:
- reading files
- listing folders
- checking versions
- checking project structure

MEDIUM:
- editing source files
- changing configuration
- creating documentation files
- installing packages

HIGH:
- deleting files
- overwriting files
- moving files
- changing Git history
- touching environment variables
- using secrets
- deployment
- network access

Never delete, overwrite, or move important project files without first explaining the exact target path and reason.

When working on this project, prefer small steps and reviewable changes.

## Mandatory two-step approval protocol

Before any action that may trigger an approval dialog, tool call, terminal command, file edit, file creation, file deletion, file move, package installation, network access, configuration change, archive creation, or access outside the current project folder, you must do this:

1. Do not call the tool yet.
2. First write a separate plain-language approval brief to the user.
3. The approval brief must be written before the system approval dialog appears.
4. After writing the approval brief, stop and wait for the user to explicitly answer one of:
   "Разрешаю выполнить"
   "Дозволяю виконати"
5. Only after that explicit text confirmation may you run the command, edit the file, or trigger the approval dialog.
6. If you are about to use a terminal command, show the command in a PowerShell code block and explain it line by line in simple language.
7. If the action is only reading files, still explain what will be read and why.
8. Never combine the explanation and the tool call in the same step.
9. If you accidentally trigger an approval dialog before giving a plain-language explanation, stop and apologize, then explain the action before continuing.

Every approval brief must use this exact structure:

### Подтверждение действия

**Что я хочу сделать:**
...

**Зачем это нужно:**
...

**Что будет затронуто:**
...

**Будут ли изменены файлы:**
Да/Нет. Если да — какие именно.

**Команда, если она будет запускаться:**
Покажи команду в отдельном PowerShell code block.

**Что может пойти не так:**
...

**Можно ли откатить:**
...

**Что будет, если ты разрешишь:**
...

**Что будет, если ты откажешь:**
...

**Уровень риска:**
LOW / MEDIUM / HIGH

After writing this approval brief, stop and wait. Do not run the command. Do not edit the file. Do not trigger the approval dialog until the user explicitly writes one of:

Разрешаю выполнить
Дозволяю виконати

If the user is not a technical specialist, prioritize explanation over speed. It is better to ask one extra confirmation than to silently perform a confusing action.

For Perucar specifically:
- Do not refer to the old project folder as Color.
- The current project root is Perucar.
- The app/project may be called Perucar.
- Use prucar only as an internal/lowercase product slug when appropriate.
- Before changing architecture, formulas, colorist logic, client-card logic, or calculation logic, first explain the reason and expected effect.
- Keep all changes small, reversible, and easy to review.
