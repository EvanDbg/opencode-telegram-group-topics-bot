import { describe, expect, it } from "vitest";
import {
  buildModelSelectionMenu,
  buildModelSelectionMenuText,
} from "../../src/bot/handlers/model.js";

describe("bot/model-menu", () => {
  it("keeps inline model labels compact while preserving provider context", async () => {
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
    expect(button?.text.startsWith("✅ ⭐ ")).toBe(true);
    expect(button?.text).toContain("provider-wit...");
    expect(button?.text).toContain("model-with-an-eve...");
  });

  it("keeps same model ids distinguishable across providers", async () => {
    const keyboard = await buildModelSelectionMenu(undefined, {
      favorites: [
        { providerID: "openai", modelID: "gpt-4o" },
        { providerID: "openrouter", modelID: "gpt-4o" },
      ],
      recent: [],
    });

    const firstButton = keyboard.inline_keyboard[0]?.[0];
    const secondButton = keyboard.inline_keyboard[1]?.[0];
    expect(firstButton?.text).not.toBe(secondButton?.text);
    expect(firstButton?.text).toContain("openai");
    expect(secondButton?.text).toContain("openrouter");
  });

  it("lists full model details in the menu text", () => {
    const text = buildModelSelectionMenuText({
      favorites: [
        {
          providerID: "provider-with-a-very-long-name",
          modelID: "model-with-an-even-longer-name-that-keeps-going-and-going",
        },
      ],
      recent: [{ providerID: "recent-provider", modelID: "recent-model" }],
    });

    expect(text).toContain(
      "1. provider-with-a-very-long-name/model-with-an-even-longer-name-that-keeps-going-and-going",
    );
    expect(text).toContain("2. recent-provider/recent-model");
  });
});
