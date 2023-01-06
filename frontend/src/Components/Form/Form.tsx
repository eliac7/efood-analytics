import { Stack } from "@mantine/core";
import { useAuth } from "../../Hooks/Auth/useAuth";
import Loading from "../Loading/Loading";
import AlreadyLoggedIn from "./AlreadyLoggedIn";
import Login from "./Login";

function Form() {
  const { user, loading } = useAuth();

  return (
    <Stack>
      {loading ? (
        <Loading isLoading={loading} />
      ) : user ? (
        <AlreadyLoggedIn />
      ) : (
        <Login />
      )}
    </Stack>
  );
}

export default Form;
