import { TextInput, PasswordInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAuth } from "../../Hooks/Auth/useAuth";
import Loading from "../Loading/Loading";

function Login() {
  const { login, loading } = useAuth();

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
    <>
      <Loading isLoading={loading} />

      <form
        onSubmit={form.onSubmit((values) => {
          login(values.email, values.password);
        })}
        className="min-w-[500px]"
      >
        <Stack>
          <TextInput
            required
            label="Email"
            labelProps={{ style: { color: "white" } }}
            placeholder="Your email"
            value={form.values.email}
            onChange={(event) =>
              form.setFieldValue("email", event.currentTarget.value)
            }
            error={form.errors.email}
          />

          <PasswordInput
            required
            label="Password"
            labelProps={{ style: { color: "white" } }}
            placeholder="Your password"
            value={form.values.password}
            onChange={(event) =>
              form.setFieldValue("password", event.currentTarget.value)
            }
            error={
              form.errors.password &&
              "Password should include at least 6 characters"
            }
          />
          <Button type="submit" color="blue" variant="outline">
            Σύνδεση
          </Button>
        </Stack>
      </form>
    </>
  );
}

export default Login;
