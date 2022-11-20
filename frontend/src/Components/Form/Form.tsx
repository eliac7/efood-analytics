import { useForm } from "@mantine/form";
import { TextInput, PasswordInput, Button, Group } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

function Form() {
  interface FormValues {
    email: string;
    password: string;
  }

  const form = useForm<FormValues>({
    initialValues: { email: "", password: "" },
    validate: {
      email: (value: string) =>
        /^\S+@\S+$/.test(value) ? null : "Invalid email",
    },
  });

  const onSubmit = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/login",
        form.values
      );
      showNotification({
        title: "Success",
        message: "Επιτυχής σύνδεση",
        color: "green",
      });
    } catch (error: any) {
      showNotification({
        title: "Error",
        message: error.response.data.message,
        color: "red",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full h-full bg-slate-700 p-5">
      <form
        className="flex flex-col items-center justify-center flex-1 w-full h-full"
        onSubmit={form.onSubmit(onSubmit)}
      >
        <TextInput
          label="Email"
          placeholder="Εισάγετε το email σας"
          required
          className="w-full"
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label="Password"
          placeholder="Εισάγετε τον κωδικό σας"
          required
          className="w-full"
          {...form.getInputProps("password")}
        />

        <Group position="right" mt="md">
          <Button type="submit" variant="outline" color="teal">
            Είσοδος
          </Button>
        </Group>
      </form>
    </div>
  );
}

export default Form;
