import Background from "../../Components/Background/Background";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import { useContext } from "react";
import { ThemeContext } from "../../Services/Context/ThemeContext";

function DefaultLayout({ children }: { children: any }) {
  const { theme } = useContext(ThemeContext);
  return (
    <>
      <Background dark={theme === "dark"} />
      <Header />
      <main className="flex-1 flex items-center">{children}</main>
      <Footer />
    </>
  );
}

export default DefaultLayout;
