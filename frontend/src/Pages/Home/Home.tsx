import Form from "../../Components/Form/Form";
import Gallery from "../../Components/Gallery/Gallery";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";

function Home() {
  return (
    <DefaultLayout>
      <div className="container mx-auto rounded-lg overflow-hidden shadow-xl">
        <div className="h-4/6 flex justify-center items-center">
          <div className="flex-1 flex justify-center items-center bg-slate-600">
            <Gallery />
          </div>
          <div className="flex-1 self-stretch">
            <Form />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
export default Home;
