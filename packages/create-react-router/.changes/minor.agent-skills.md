Add a default-on CLI option to include the official React Router agent skill in generated projects

- New projects include `.agents/skills/react-router` by default when running with `--yes` or in non-interactive shells
- Interactive runs prompt to include the skill, defaulting to yes
- Use `--no-agent-skills` to skip copying the skill
