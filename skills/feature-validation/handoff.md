# Recursive Learning & Self-Retrospective Implementation

**Date:** January 20, 2026
**Topic:** Implementation of Recursive Learning/Self-Retrospective Pattern in Agent Skills

## Overview

We have enhanced the `feature-validation` skill by implementing a **Recursive Learning** (or "Self-Retrospective") pattern. This mechanism transforms the skill from a linear execution script into a self-improving feedback loop.

## The Problem

Standard agent skills are static. They execute a set of instructions A -> B -> C. If the agent takes a suboptimal path or misses a nuance, the skill definition itself doesn't "learn" or prompt the agent to recognize this for next time unless a human manually updates the instructions.

## The Solution: Phase 10 - Retrospective & Learning

We added a new final phase to the `SKILL.md` workflow.

### Key Components:

1.  **Trigger Capture (Phase 1):**
    *   The agent is now instructed to explicitly note the **Trigger Context** (the specific user prompt and project state) at the very beginning of the task. This serves as the "baseline" for evaluation.

2.  **Execution (Phases 2-9):**
    *   The standard validation workflow proceeds as normal (planning, server setup, navigation, testing, reporting).

3.  **Self-Assessment (Phase 10):**
    *   At the end of the workflow, instead of just stopping, the agent enters a "Retrospective" mode.
    *   It reviews its own session logs and compares the *result* against the *trigger*.
    *   It asks itself: "HOW DID I DO?"

4.  **Structured Feedback:**
    *   The agent is required to output a specific reflection block:
        ```markdown
        **Retrospective:**
        - **I DID THIS:** [Summary of actions taken]
        - **BUT IF I WOULDVE DONE IT THIS WAY:** [Alternative approach or optimization identified during execution]
        - **WE COULDVE DONE THIS BETTER:** [The concrete benefit of the alternative approach]
        - **Suggestion for Next Run:** [Actionable tip for the next time this skill is used]
        ```

## Benefits

*   **Continuous Improvement:** Every run generates "lessons learned" that can be immediately applied or used to update the skill definition later.
*   **Context Awareness:** By forcing a comparison between the *trigger* and the *outcome*, the agent validates that it actually solved the user's specific problem, not just a generic version of it.
*   **Reduced Over-Engineering:** Instead of trying to write a perfect prompt upfront, we allow the agent to iterate and find optimizations dynamically.

## Future Application

This pattern is designed to be **universal**. It can be applied to any skill (`refactoring`, `planning`, `debugging`) to create a system of agents that not only work but also think about *how* they work.
