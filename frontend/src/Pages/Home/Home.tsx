import Form from "../../Components/Form/Form.jsx";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Container } from "@mantine/core";

function Home() {
  return (
    <DefaultLayout>
      <Container size="xl" h={650} w="100%" className="flex justify-center">
        <Form />
      </Container>
    </DefaultLayout>
  );
}
export default Home;
