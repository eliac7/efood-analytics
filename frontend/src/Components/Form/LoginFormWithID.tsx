import { useState } from "react";
import { useForm } from "@mantine/form";
import { TextInput, Button, Stack, Tooltip } from "@mantine/core";
import { useAuth } from "../../Hooks/Auth/useAuth";
import { RiInformationLine } from "react-icons/ri";
import InstructionsMoal from "./InstructionsModal";

function LoginFormWithID() {
  const { loginWithSessionId, loading } = useAuth();
  const [openModal, setOpenModal] = useState(false);

  const form = useForm({
    initialValues: {
      id: "",
    },
    validate: {
      id: (value) => {
        value = value.replace(/\s/g, "").replace(/['"]+/g, "");

        if (!value) return "Το ID είναι υποχρεωτικό";
        if (
          !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
            value
          )
        ) {
          return "Το ID πρέπει να έχει τη μορφή XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
        }
        return null;
      },
    },
  });

  return (
    <>
      <form
        className="w-full"
        onSubmit={form.onSubmit((values) => {
          loginWithSessionId(values.id.replace(/\s/g, "").replace(/['"]+/g, ""));
        })}
      >
        <Stack>
          <TextInput
            label="ID"
            labelProps={{ style: { color: "white" } }}
            description="Το ID πρέπει να έχει τη μορφή XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
            placeholder="Εισάγετε το ID σας"
            required
            {...form.getInputProps("id")}
            error={form.errors.id}
            rightSection={
              <Tooltip
                label="Πληροφορίες για το πως να αποκτήσετε το ID σας"
                multiline
                w={200}
                withArrow
                position="right"
              >
                <div className="animate-pulse flex items-center justify-center cursor-pointer">
                  <RiInformationLine
                    size="20"
                    fill="currentColor"
                    onClick={() => setOpenModal(true)}
                  />
                </div>
              </Tooltip>
            }
          />

          <Button
            loading={loading}
            disabled={loading}
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

      <InstructionsMoal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
}

export default LoginFormWithID;
