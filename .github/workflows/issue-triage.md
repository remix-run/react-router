---
description: Adds the pkg:react-router label to issues opened by brophdawg11.
emoji: 🤖

on:
  issues:
    types: [opened]
  reaction: eyes

if: github.event.issue.user.login == 'brophdawg11'

permissions: read-all

network:
  allowed:
    - defaults
    - proxy.shopify.ai

model: gpt-5.6-luna
engine:
  id: codex
  env:
    OPENAI_BASE_URL: https://proxy.shopify.ai/v1
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

safe-outputs:
  add-labels:
    allowed: ["pkg:react-router"]
    max: 1

tools:
  bash: false

timeout-minutes: 5
---

# Label issues opened by brophdawg11

Add the `pkg:react-router` label to the triggering issue. Do not take any other action.
