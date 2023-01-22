import Footer from "../Footer/Footer";
import Header from "../Header/Header";

function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 flex justify-center items-center">
        {children}
      </main>
      <Footer />
    </>
  );
}

export default DefaultLayout;
