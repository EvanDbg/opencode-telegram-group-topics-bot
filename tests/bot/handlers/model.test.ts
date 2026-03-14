import { describe, expect, it } from "vitest";
import { buildModelSelectionMenu } from "../../../src/bot/handlers/model.js";

describe("bot/handlers/model", () => {
  it("truncates long inline model labels for readability", async () => {
    const keyboard = await buildModelSelectionMenu(
      {
        providerID: "provider-with-a-very-long-name",
        modelID: "model-with-an-even-longer-name-that-keeps-going-and-going",
        variant: "default",
      },
      {
        favorites: [
          {
            providerID: "provider-with-a-very-long-name",
            modelID: "model-with-an-even-longer-name-that-keeps-going-and-going",
          },
        ],
        recent: [],
      },
    );

    const button = keyboard.inline_keyboard[0]?.[0];
    expect(button?.text).toBeDefined();
    expect(button?.text.length).toBeLessThanOrEqual(64);
    expect(button?.text.endsWith("...")).toBe(true);
    expect(button?.text.startsWith("✅ ⭐ ")).toBe(true);
  });
});
