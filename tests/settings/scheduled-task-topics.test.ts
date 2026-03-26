import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetSettingsForTests,
  getScheduledTaskTopics,
  getScheduledTasks,
  setScheduledTaskTopics,
  setScheduledTasks,
} from "../../src/settings/manager.js";

describe("settings scheduled task persistence", () => {
  beforeEach(() => {
    __resetSettingsForTests();
  });

  it("stores scheduled task topics and task delivery metadata", async () => {
    await setScheduledTaskTopics([
      {
        chatId: -100123,
        projectId: "project-1",
        projectWorktree: "/repo/app",
        threadId: 555,
        topicName: "Scheduled - App",
        createdAt: "2026-03-25T00:00:00.000Z",
        updatedAt: "2026-03-25T00:00:00.000Z",
      },
    ]);
    await setScheduledTasks([
      {
        id: "task-1",
        kind: "cron",
        projectId: "project-1",
        projectWorktree: "/repo/app",
        createdFromScopeKey: "-100123:77",
        agent: "review",
        model: { providerID: "openai", modelID: "gpt-5", variant: null },
        delivery: { chatId: -100123, threadId: 555 },
        scheduleText: "every weekday at 09:00",
        scheduleSummary: "weekdays 09:00",
        timezone: "UTC",
        prompt: "Review PRs",
        createdAt: "2026-03-25T00:00:00.000Z",
        nextRunAt: "2026-03-26T09:00:00.000Z",
        lastRunAt: null,
        runCount: 0,
        lastStatus: "idle",
        lastError: null,
        cron: "0 9 * * 1-5",
      },
    ]);

    expect(getScheduledTaskTopics()).toEqual([
      expect.objectContaining({ chatId: -100123, projectId: "project-1", threadId: 555 }),
    ]);
    expect(getScheduledTasks()).toEqual([
      expect.objectContaining({
        id: "task-1",
        createdFromScopeKey: "-100123:77",
        delivery: { chatId: -100123, threadId: 555 },
        agent: "review",
      }),
    ]);
  });
});
