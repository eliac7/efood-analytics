import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserContextProvider } from "../../Services/UserContext/UserContext";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { useAuth } from "./useAuth";
import { renderWithProviders } from "../../test/render";
import { testUser } from "../../test/fixtures";
import { LOCAL_STORAGE_USER } from "../../utils/constants";

vi.mock("../../Services/EfoodAxios/Efoodaxios", () => ({ default: { post: vi.fn() } }));

function AuthProbe() {
  const { loginWithSessionId, logout, user, loading } = useAuth();
  return <><button onClick={() => loginWithSessionId(testUser.session_id)}>Login</button>
    <button onClick={logout}>Logout</button><span>{user?.name ?? "Anonymous"}</span><span>{loading ? "Busy" : "Ready"}</span></>;
}

describe("authentication request lifecycle", () => {
  beforeEach(() => { localStorage.clear(); });

  it("does not resurrect a session when login completes after logout", async () => {
    let finish!: (response: { data: typeof testUser }) => void;
    vi.mocked(EfoodAxios.post).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    renderWithProviders(<UserContextProvider><AuthProbe /></UserContextProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByText("Login"));
    await waitFor(() => expect(screen.getByText("Busy")).toBeInTheDocument());
    await user.click(screen.getByText("Logout"));
    await act(async () => { finish({ data: testUser }); });
    await waitFor(() => expect(screen.getByText("Ready")).toBeInTheDocument());
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(localStorage.getItem(LOCAL_STORAGE_USER)).toBeNull();
  });

  it("rejects malformed success responses without persisting a user", async () => {
    vi.mocked(EfoodAxios.post).mockResolvedValue({ data: { session_id: "bad", name: "Name" } });
    renderWithProviders(<UserContextProvider><AuthProbe /></UserContextProvider>);
    await userEvent.setup().click(screen.getByText("Login"));
    expect(await screen.findByText("Σφάλμα")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(localStorage.getItem(LOCAL_STORAGE_USER)).toBeNull();
  });
});
