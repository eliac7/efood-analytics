import { Button } from "@mantine/core";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../Hooks/Auth/useAuth";
import ToggleDarkMode from "../../Components/ToggleDarkMode/ToggleDarkMode";
import logo from "../../Assets/Images/efood-analytics-logo.png";
import { FiLogOut } from "react-icons/fi";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="flex flex-col md:flex-row justify-between items-center bg-transparent p-5 pb-10">
      <div className="flex"></div>

      {isDashboard && (
        <Link to="/">
          <img
            src={logo}
            alt="logo"
            className="h-full w-full max-w-[15rem] mr-2 object-contain shadow-[_-10px_10px_0px_0px_#ff4c4c,_-15px_15px_0px_0px_#ff7f7f,_-20px_20px_0px_0px_#ff9999,_-25px_25px_0px_0px_#ffcccc] bg-white rounded-xl"
          />
        </Link>
      )}

      <div className="flex items-center">
        <ToggleDarkMode />
        <Button
          variant="filled"
          color="red"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="ml-4 rounded-full w-25 h-25"
        >
          <FiLogOut />
        </Button>
      </div>
    </header>
  );
}

export default Header;
