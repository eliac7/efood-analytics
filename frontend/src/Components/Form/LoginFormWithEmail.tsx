import { useForm } from "@mantine/form";
import { TextInput, PasswordInput, Button, Stack } from "@mantine/core";
import { useAuth } from "../../Hooks/Auth/useAuth";

function LoginFormWithEmail() {
  const { login } = useAuth();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
          ? null
          : "Παρακαλώ εισάγετε ένα έγκυρο email",
      password: (value) =>
        value.length > 0 ? null : "Παρακαλώ εισάγετε έναν κωδικό",
    },
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        login(values.email, values.password);
      })}
      className="w-full"
    >
      <Stack>
        <TextInput
          required
          label="Email"
          labelProps={{ style: { color: "white" } }}
          placeholder="Εισάγετε το email σας"
          value={form.values.email}
          onChange={(event) =>
            form.setFieldValue("email", event.currentTarget.value)
          }
          error={form.errors.email}
          radius="lg"
        />

        <PasswordInput
          required
          label="Password"
          labelProps={{ style: { color: "white" } }}
          placeholder="Εισάγετε τον κωδικό σας"
          value={form.values.password}
          onChange={(event) =>
            form.setFieldValue("password", event.currentTarget.value)
          }
          error={
            form.errors.password &&
            "Password should include at least 6 characters"
          }
          radius="lg"
        />

        <Button
          type="submit"
          color="blue"
          variant="outline"
          radius="lg"
          className="w-full md:w-1/2 mx-auto my-5"
        >
          Σύνδεση
        </Button>
      </Stack>
    </form>
  );
}

export default LoginFormWithEmail;
