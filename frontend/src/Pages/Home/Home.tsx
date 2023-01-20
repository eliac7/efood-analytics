import Form from "../../Components/Form/Form.jsx";
import Gallery from "../../Components/Gallery/Gallery";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Container, Grid } from "@mantine/core";

function Home() {
  return (
    <DefaultLayout>
      <Container size="lg">
        <Grid
          justify="center"
          align="stretch"
          gutter="sm"
          sx={{
            minHeight: "500px",
            minWidth: "500px",
          }}
        >
          <Grid.Col sm={12} md={6} className="bg-slate-600">
            <Gallery />
          </Grid.Col>
          <Grid.Col sm={12} md={6} className="bg-slate-900">
            <Form />
          </Grid.Col>
        </Grid>
      </Container>
    </DefaultLayout>
  );
}
export default Home;
