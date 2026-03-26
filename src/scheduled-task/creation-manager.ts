import { logger } from "../utils/logger.js";
import type { ParsedTaskSchedule, ScheduledTaskModel, TaskCreationState } from "./types.js";
import { cloneParsedTaskSchedule, cloneScheduledTaskModel } from "./types.js";

const DEFAULT_SCOPE_KEY = "__global__";

function cloneState(state: TaskCreationState): TaskCreationState {
  return {
    ...state,
    model: cloneScheduledTaskModel(state.model),
    parsedSchedule: state.parsedSchedule ? cloneParsedTaskSchedule(state.parsedSchedule) : null,
  };
}

class TaskCreationManager {
  private readonly states = new Map<string, TaskCreationState>();

  start(
    projectId: string,
    projectWorktree: string,
    createdFromScopeKey: string,
    agent: string | null,
    model: ScheduledTaskModel,
    scopeKey: string = DEFAULT_SCOPE_KEY,
  ): TaskCreationState {
    const state: TaskCreationState = {
      stage: "awaiting_schedule",
      projectId,
      projectWorktree,
      createdFromScopeKey,
      agent,
      model: cloneScheduledTaskModel(model),
      scheduleText: null,
      parsedSchedule: null,
      scheduleRequestMessageId: null,
      previewMessageId: null,
      promptRequestMessageId: null,
    };

    this.states.set(scopeKey, state);
    logger.info(
      `[TaskCreationManager] Started task creation flow: scope=${scopeKey}, project=${projectWorktree}`,
    );

    return cloneState(state);
  }

  isActive(scopeKey: string = DEFAULT_SCOPE_KEY): boolean {
    return this.states.has(scopeKey);
  }

  isWaitingForSchedule(scopeKey: string = DEFAULT_SCOPE_KEY): boolean {
    return this.states.get(scopeKey)?.stage === "awaiting_schedule";
  }

  isParsingSchedule(scopeKey: string = DEFAULT_SCOPE_KEY): boolean {
    return this.states.get(scopeKey)?.stage === "parsing_schedule";
  }

  isWaitingForPrompt(scopeKey: string = DEFAULT_SCOPE_KEY): boolean {
    return this.states.get(scopeKey)?.stage === "awaiting_prompt";
  }

  getState(scopeKey: string = DEFAULT_SCOPE_KEY): TaskCreationState | null {
    const state = this.states.get(scopeKey);
    return state ? cloneState(state) : null;
  }

  setParsedSchedule(
    scheduleText: string,
    parsedSchedule: ParsedTaskSchedule,
    previewMessageId: number,
    scopeKey: string = DEFAULT_SCOPE_KEY,
  ): TaskCreationState | null {
    const state = this.states.get(scopeKey);
    if (!state) {
      return null;
    }

    const nextState: TaskCreationState = {
      ...state,
      stage: "awaiting_prompt",
      scheduleText,
      parsedSchedule: cloneParsedTaskSchedule(parsedSchedule),
      scheduleRequestMessageId: null,
      previewMessageId,
      promptRequestMessageId: null,
    };

    this.states.set(scopeKey, nextState);
    logger.info(`[TaskCreationManager] Parsed schedule: scope=${scopeKey}`);

    return cloneState(nextState);
  }

  markScheduleParsing(scopeKey: string = DEFAULT_SCOPE_KEY): TaskCreationState | null {
    const state = this.states.get(scopeKey);
    if (!state) {
      return null;
    }

    const nextState: TaskCreationState = {
      ...state,
      stage: "parsing_schedule",
    };

    this.states.set(scopeKey, nextState);
    logger.info(`[TaskCreationManager] Schedule parsing started: scope=${scopeKey}`);

    return cloneState(nextState);
  }

  setPromptRequestMessageId(
    messageId: number,
    scopeKey: string = DEFAULT_SCOPE_KEY,
  ): TaskCreationState | null {
    const state = this.states.get(scopeKey);
    if (!state) {
      return null;
    }

    const nextState: TaskCreationState = {
      ...state,
      promptRequestMessageId: messageId,
    };

    this.states.set(scopeKey, nextState);
    return cloneState(nextState);
  }

  setScheduleRequestMessageId(
    messageId: number,
    scopeKey: string = DEFAULT_SCOPE_KEY,
  ): TaskCreationState | null {
    const state = this.states.get(scopeKey);
    if (!state) {
      return null;
    }

    const nextState: TaskCreationState = {
      ...state,
      scheduleRequestMessageId: messageId,
    };

    this.states.set(scopeKey, nextState);
    return cloneState(nextState);
  }

  resetSchedule(scopeKey: string = DEFAULT_SCOPE_KEY): TaskCreationState | null {
    const state = this.states.get(scopeKey);
    if (!state) {
      return null;
    }

    const nextState: TaskCreationState = {
      ...state,
      stage: "awaiting_schedule",
      scheduleText: null,
      parsedSchedule: null,
      scheduleRequestMessageId: null,
      previewMessageId: null,
      promptRequestMessageId: null,
    };

    this.states.set(scopeKey, nextState);
    logger.info(`[TaskCreationManager] Reset flow to schedule input: scope=${scopeKey}`);

    return cloneState(nextState);
  }

  clear(scopeKey: string = DEFAULT_SCOPE_KEY): void {
    if (!this.states.has(scopeKey)) {
      return;
    }

    logger.debug(`[TaskCreationManager] Clearing task creation state: scope=${scopeKey}`);
    this.states.delete(scopeKey);
  }

  clearAll(): void {
    if (this.states.size === 0) {
      return;
    }

    logger.debug("[TaskCreationManager] Clearing all task creation states");
    this.states.clear();
  }
}

export const taskCreationManager = new TaskCreationManager();
