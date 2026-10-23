@AGENTS.md

# Notas específicas de Claude Code

- Responde al usuario en español; código y commits en inglés.
- Subagentes en `.claude/agents/` (code-reviewer, db-architect, qa-tester, security-auditor):
  úsalos para revisiones especializadas.
- Comandos en `.claude/commands/`: `/new-feature`, `/open-pr`, `/db-migrate`.
- Permisos compartidos en `.claude/settings.json`; los personales van en
  `.claude/settings.local.json` (ignorado por Git).
- El usuario trabaja en Windows con PowerShell 5.1: al darle comandos, indica las diferencias
  con macOS/Linux cuando existan.
