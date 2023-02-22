import { useState } from "react";
import { Radio, Flex } from "@mantine/core";
import { useAuth } from "../../Hooks/Auth/useAuth";
import Loading from "../Loading/Loading";
import LoginFormWithEmail from "./LoginFormWithEmail";
import LoginFormWithID from "./LoginFormWithID";

function Login() {
  const { loading } = useAuth();
  const [selectedLoginOption, setSelectedLoginOption] = useState<
    "email" | "userid"
  >("email");

  const handleLoginOptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedLoginOption(event as unknown as "email" | "userid");
  };

  return (
    <>
      <Loading isLoading={loading} />
      <Flex justify="center" direction="column" w={"100%"}>
        <Radio.Group
          name="selectedLoginOption"
          label="Επιλέξτε τον τρόπο σύνδεσης"
          labelProps={{ style: { color: "white" } }}
          withAsterisk
          value={selectedLoginOption}
          onChange={handleLoginOptionChange as any}
          className="w-full flex flex-col justify-center items-center"
        >
          <Radio
            value="email"
            label="E-mail"
            sx={{
              ".mantine-Radio-label": {
                color: "white",
              },
            }}
          />
          <Radio
            value="userid"
            label="ID"
            sx={{
              ".mantine-Radio-label": {
                color: "white",
              },
            }}
          />
        </Radio.Group>

        {selectedLoginOption === "email" ? (
          <LoginFormWithEmail />
        ) : (
          <LoginFormWithID />
        )}
      </Flex>
    </>
  );
}

export default Login;
