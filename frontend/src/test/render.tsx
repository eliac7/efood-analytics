import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { UserContext } from "../Services/UserContext/UserContext";
import { Action } from "../Services/Reducers/UserReducer";
import { initialStateType } from "../types";

const defaultState: initialStateType = {
  user: null,
  orders: null,
  loading: false,
};

type AppRenderOptions = RenderOptions & {
  route?: string;
  state?: initialStateType;
  dispatch?: React.Dispatch<Action>;
  queryClient?: QueryClient;
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = "/",
    state = defaultState,
    dispatch = () => null,
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: AppRenderOptions = {}
) {
  return {
    queryClient,
    dispatch,
    ...render(
      <MantineProvider>
        <Notifications />
        <QueryClientProvider client={queryClient}>
          <UserContext.Provider value={{ state, dispatch }}>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
          </UserContext.Provider>
        </QueryClientProvider>
      </MantineProvider>,
      renderOptions
    ),
  };
}
