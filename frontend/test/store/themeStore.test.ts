import { describe, expect, it } from "vitest";
import { useThemeStore } from "@/store/themeStore";

describe("themeStore", () => {
  it("defaults to dark and toggles between dark and light", () => {
    useThemeStore.setState({ theme: "dark" });

    expect(useThemeStore.getState().theme).toBe("dark");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });
});
