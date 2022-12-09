import Background from "../../Components/Background/Background";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";

function DefaultLayout({ children }: { children: any }) {
  return (
    <>
      <Background />
      <Header />
      <main className="flex-1 flex items-center p-10 md:p-0">{children}</main>
      <Footer />
    </>
  );
}

export default DefaultLayout;
