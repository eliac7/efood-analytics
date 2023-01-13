import { Grid, Stack } from "@mantine/core";
import { useAuth } from "../../Hooks/Auth/useAuth";
import Loading from "../Loading/Loading";
import AlreadyLoggedIn from "./AlreadyLoggedIn";
import Login from "./Login";

function Form() {
  const { user, loading } = useAuth();

  return (
    <>
      <Loading isLoading={loading} />

      <Grid justify="center" align="center" className="h-full p-5">
        <Grid.Col>
          <Stack spacing="md">{user ? <AlreadyLoggedIn /> : <Login />}</Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}

export default Form;
