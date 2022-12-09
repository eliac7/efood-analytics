import { useState, useContext } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Group,
  LoadingOverlay,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { UserContext } from "../../Services/UserContext/UserContext";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { User } from "../../types/app_types";
import { InputLabel } from "@mantine/core/lib/Input/InputLabel/InputLabel";

function Login() {
  const [loading, setLoading] = useState(false);

  const { state, dispatch } = useContext(UserContext);

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

  const setData = ({ data }: { data: User }) => {
    dispatch({ type: "SET_USER", payload: data });
  };

  const onSubmit = async () => {
    setLoading(true);
    const { email, password } = form.values;
    try {
      const { data } = await EfoodAxios.post("login", {
        email,
        password,
      });
      showNotification({
        title: "Επιτυχής σύνδεση",
        message: `Καλώς ήρθες ${data.name}`,
        color: "green",
      });
      setData({ data });
    } catch (error: any) {
      showNotification({
        title: "Αποτυχία σύνδεσης",
        message: error.response.data.message || error.message,
        color: "red",
      });
    }
    setLoading(false);
    form.reset();
  };

  return (
    <>
      <LoadingOverlay
        visible={loading}
        overlayBlur={2}
        transitionDuration={0.2}
        overlayColor={"rgba(0, 0, 0, 0.5)"}
        loaderProps={{
          color: "red",
          size: 50,
        }}
      />

      <form onSubmit={form.onSubmit(onSubmit)} className="min-w-[500px]">
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
