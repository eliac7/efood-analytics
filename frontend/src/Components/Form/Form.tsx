import { Flex } from "@mantine/core/";
import { useAuth } from "../../Hooks/Auth/useAuth";
import Loading from "../Loading/Loading";
import AlreadyLoggedIn from "./AlreadyLoggedIn";
import Login from "./Login";

function Form() {
  const { user, loading } = useAuth();

  return (
    <>
      <Loading isLoading={loading} />

      <Flex justify="center" align="center" className="h-full md:p-5  ">
        {user ? <AlreadyLoggedIn /> : <Login />}
      </Flex>
    </>
  );
}

export default Form;
