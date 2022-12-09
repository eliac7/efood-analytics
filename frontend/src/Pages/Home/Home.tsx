import Form from "../../Components/Form/Form.jsx";
import Gallery from "../../Components/Gallery/Gallery";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";

function Home() {
  return (
    <DefaultLayout>
      <div className="container mx-auto rounded-lg overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row justify-center items-center">
          <div className="flex-1 flex justify-center items-center bg-slate-600">
            <Gallery />
          </div>
          <div className="flex-1 self-stretch flex items-center justify-center bg-slate-800 relative">
            <Form />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
export default Home;
