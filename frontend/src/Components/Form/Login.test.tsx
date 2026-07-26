import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { renderWithProviders } from "../../test/render";
import { testUser } from "../../test/fixtures";
import { useAuth } from "../../Hooks/Auth/useAuth";
import Login from "./Login";
import LoginFormWithEmail from "./LoginFormWithEmail";
import LoginFormWithID from "./LoginFormWithID";
import AlreadyLoggedIn from "./AlreadyLoggedIn";
import ProtectedRoutes from "../../Hooks/ProtectedRoutes/ProtectedRoute";

vi.mock("../../Hooks/Auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("login UI", () => {
  const login = vi.fn();
  const loginWithSessionId = vi.fn();
  const logout = vi.fn();

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: null,
      login,
      loginWithSessionId,
      logout,
      loading: false,
    });
  });

  it("toggles between ID and email login forms", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    expect(screen.getByPlaceholderText("Εισάγετε το ID σας")).toBeInTheDocument();

    await user.click(screen.getByLabelText("E-mail"));

    expect(await screen.findByPlaceholderText("Εισάγετε το email σας")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Εισάγετε τον κωδικό σας")).toBeInTheDocument();
  });

  it("validates email form input and submits valid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginFormWithEmail />);

    await user.type(screen.getByPlaceholderText("Εισάγετε το email σας"), "bad-email");
    await user.type(screen.getByPlaceholderText("Εισάγετε τον κωδικό σας"), "secret");
    await user.click(screen.getByRole("button", { name: "Σύνδεση" }));

    expect(login).not.toHaveBeenCalled();
    expect(await screen.findByText("Παρακαλώ εισάγετε ένα έγκυρο email")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Εισάγετε το email σας"));
    await user.type(screen.getByPlaceholderText("Εισάγετε το email σας"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Σύνδεση" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("user@example.com", "secret");
    });
  });

  it("validates session form input and submits valid session IDs", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginFormWithID />);

    await user.type(screen.getByPlaceholderText("Εισάγετε το ID σας"), "bad");
    await user.click(screen.getByRole("button", { name: "Σύνδεση" }));

    expect(loginWithSessionId).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getAllByText("Το ID πρέπει να έχει τη μορφή XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX")
      ).toHaveLength(2);
    });

    await user.clear(screen.getByPlaceholderText("Εισάγετε το ID σας"));
    await user.type(screen.getByPlaceholderText("Εισάγετε το ID σας"), testUser.session_id);
    await user.click(screen.getByRole("button", { name: "Σύνδεση" }));

    await waitFor(() => {
      expect(loginWithSessionId).toHaveBeenCalledWith(testUser.session_id);
    });
  });

  it("renders logged-in state with dashboard link", () => {
    mockedUseAuth.mockReturnValue({
      user: testUser,
      login,
      loginWithSessionId,
      logout,
      loading: false,
    });

    renderWithProviders(<AlreadyLoggedIn />);

    expect(screen.getByText(`Καλώς ήρθες ${testUser.name}`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Δες τα στατιστικά σου" })).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });
});

describe("protected routes", () => {
  it("redirects anonymous users", async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      login: vi.fn(),
      loginWithSessionId: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route path="/" element={<ProtectedRoutes />}>
          <Route path="dashboard" element={<div>Protected dashboard</div>} />
        </Route>
      </Routes>,
      { route: "/dashboard" }
    );

    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Protected dashboard")).not.toBeInTheDocument();
  });

  it("renders protected content for logged-in users", () => {
    mockedUseAuth.mockReturnValue({
      user: testUser,
      login: vi.fn(),
      loginWithSessionId: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<ProtectedRoutes />}>
          <Route path="dashboard" element={<div>Protected dashboard</div>} />
        </Route>
      </Routes>,
      { route: "/dashboard" }
    );

    expect(screen.getByText("Protected dashboard")).toBeInTheDocument();
  });
});
