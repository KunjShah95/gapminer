import { render, screen } from "@testing-library/react";
import Badge from "../Badge";

describe("Badge", () => {
  it("renders with text", () => {
    render(<Badge>Pro</Badge>);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("applies tone variant classes", () => {
    const { container } = render(<Badge tone="primary">Admin</Badge>);
    expect(container.firstChild).toHaveClass("bg-primary/15");
  });

  it("renders with title attribute", () => {
    render(<Badge title="Premium badge">Gold</Badge>);
    expect(screen.getByTitle("Premium badge")).toBeInTheDocument();
  });
});
