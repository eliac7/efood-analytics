import { Stack } from "@mantine/core";
import { useContext } from "react";
import { UserContext } from "../../Services/UserContext/UserContext";
import AlreadyLoggedIn from "./AlreadyLoggedIn";
import Login from "./Login";

function Form() {
  const { state } = useContext(UserContext);

  return <Stack>{state.user ? <AlreadyLoggedIn /> : <Login />}</Stack>;
}

export default Form;
