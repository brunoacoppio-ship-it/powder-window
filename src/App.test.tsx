import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the outlook with ranked Andes resorts", () => {
    render(<App />);
    expect(screen.getByText("Powder Window")).toBeTruthy();
    expect(screen.getByText("Valle Nevado")).toBeTruthy();
    expect(screen.getByText("Cerro Castor")).toBeTruthy();
  });
});
