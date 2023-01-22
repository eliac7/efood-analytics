import { Flex } from "@mantine/core/";
import { useAuth } from "../../Hooks/Auth/useAuth";
import AlreadyLoggedIn from "./AlreadyLoggedIn";
import Login from "./Login";
import logo from "../../Assets/Images/efood-analytics-logo.png";
import { Link } from "react-router-dom";
import FormBackground from "./FormBackground";

function Form() {
  const { user } = useAuth();

  return (
    <>
      <Flex
        justify="center"
        direction="column"
        align="center"
        gap={20}
        className="h-full w-full md:p-5 bg-ebony-clay-900 rounded-xl relative overflow-hidden shadow-2xl"
      >
        <FormBackground />
        <Flex justify="center" align="start" className="w-full h-full z-10">
          <Link to="/">
            <img
              src={logo}
              alt="logo"
              className="h-full xs: max-w-[12rem] md:max-w-[15rem] mr-2 object-contain shadow-[_-10px_10px_0px_0px_#ff4c4c,_-15px_15px_0px_0px_#ff7f7f,_-20px_20px_0px_0px_#ff9999,_-25px_25px_0px_0px_#ffcccc] bg-white rounded-xl"
            />
          </Link>
        </Flex>
        <Flex
          justify="center"
          align="center"
          className="w-[95%] md:w-1/2 h-1/2 bg-mid-gray-700 rounded-xl shadow-2xl p-5"
        >
          {user ? <AlreadyLoggedIn /> : <Login />}
        </Flex>
        <Flex
          justify="center"
          align="center"
          className="w-full h-full z-10 p-5"
        >
          <h6 className="text-gray-500 text-center">
            Efood Analytics is a separate service from e-food.gr. We don't save
            or store any personal information. We're not endorsed or supported
            by e-food.gr.
          </h6>
        </Flex>
      </Flex>
    </>
  );
}

export default Form;
