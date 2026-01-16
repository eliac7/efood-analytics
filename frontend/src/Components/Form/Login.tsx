import { useState } from "react";
import { Radio, Flex, Group, CheckIcon } from "@mantine/core";
import { useAuth } from "../../Hooks/Auth/useAuth";
import Loading from "../Loading/Loading";
import LoginFormWithEmail from "./LoginFormWithEmail";
import LoginFormWithID from "./LoginFormWithID";

function Login() {
  const { loading } = useAuth();
  const [selectedLoginOption, setSelectedLoginOption] = useState<
    "email" | "userid"
  >("userid");

  const handleLoginOptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedLoginOption(event.target.value as "email" | "userid");
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
          className="w-full"
        >
          <Group justify="center" mt="xs">
            <Radio
              value="email"
              label="E-mail"
              checked={selectedLoginOption === "email"}
              className="text-white"
              icon={CheckIcon}
            />
            <Radio
              value="userid"
              checked={selectedLoginOption === "userid"}
              label="ID"
              className="text-white"
              icon={CheckIcon}
            />
          </Group>
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
