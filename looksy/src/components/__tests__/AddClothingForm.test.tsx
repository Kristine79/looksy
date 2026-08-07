import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddClothingForm } from "@/components/clothing/AddClothingForm";

const { addToWardrobeActionMock, reprocessItemActionMock, readImageFileMock, refreshMock } =
  vi.hoisted(() => ({
    addToWardrobeActionMock: vi.fn(),
    reprocessItemActionMock: vi.fn(),
    readImageFileMock: vi.fn(),
    refreshMock: vi.fn(),
  }));

vi.mock("@/modules/closet/actions", () => ({
  addToWardrobeAction: addToWardrobeActionMock,
  reprocessItemAction: reprocessItemActionMock,
}));

vi.mock("@/lib/image", () => ({
  readImageFile: readImageFileMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function fileFor() {
  return new File(["fake"], "photo.jpg", { type: "image/jpeg" });
}

describe("AddClothingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("walks through upload -> analyzing -> added", async () => {
    readImageFileMock.mockResolvedValue({ dataUrl: "data:image/jpeg;base64,AAAA", width: 10, height: 10 });
    addToWardrobeActionMock.mockResolvedValue({
      item: { id: "00000000-0000-4000-8000-000000000001" },
      analysis: { status: "completed", itemId: "00000000-0000-4000-8000-000000000001" },
    });

    const { container } = render(<AddClothingForm />);
    expect(screen.getByText("Click to choose a photo")).toBeInTheDocument();

    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [fileFor()] } });

    await waitFor(() => {
      expect(screen.getByText("Analyze and add")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Analyze and add"));

    await waitFor(() => {
      expect(addToWardrobeActionMock).toHaveBeenCalledWith({
        imageData: "data:image/jpeg;base64,AAAA",
        notes: null,
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Item added to your wardrobe")).toBeInTheDocument();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("shows an error and retry when the analysis pipeline fails", async () => {
    readImageFileMock.mockResolvedValue({ dataUrl: "data:image/jpeg;base64,AAAA", width: 10, height: 10 });
    addToWardrobeActionMock.mockResolvedValue({
      item: { id: "00000000-0000-4000-8000-000000000001" },
      analysis: { status: "failed", itemId: "00000000-0000-4000-8000-000000000001", error: "vision failed" },
    });
    reprocessItemActionMock.mockResolvedValue({ status: "completed" });

    const { container } = render(<AddClothingForm />);
    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [fileFor()] } });
    await waitFor(() => {
      fireEvent.click(screen.getByText("Analyze and add"));
    });
    await waitFor(() => {
      expect(screen.getByText(/AI analysis failed/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Retry analysis"));
    await waitFor(() => {
      expect(reprocessItemActionMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
      expect(screen.getByText("Item added to your wardrobe")).toBeInTheDocument();
    });
  });

  it("shows a validation error for non-image files", async () => {
    readImageFileMock.mockRejectedValue(new Error("Please choose an image file"));
    const { container } = render(<AddClothingForm />);
    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [fileFor()] } });

    await waitFor(() => {
      expect(screen.getByText("Please choose an image file")).toBeInTheDocument();
    });
  });
});
