import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { makeMemory } from "@/test/fixtures";

describe("MemoryCard", () => {
  it("shows the memory description and status", () => {
    render(<MemoryCard memory={makeMemory()} />);
    expect(screen.getByText("You tend to choose earth tones")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("shows confidence and signal count", () => {
    render(<MemoryCard memory={makeMemory()} />);
    expect(screen.getByText("confidence 82%")).toBeInTheDocument();
    expect(screen.getByText("23 signals")).toBeInTheDocument();
  });
});
