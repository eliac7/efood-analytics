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
    <header className="flex-1 flex flex-col md:flex-row justify-center items-center px-4 bg-transparent text-white md:pb-10 h-28">
      <div className="flex-1"></div>
      <Link to="/">
        <div className="flex-1 h-20 mb-10 md:mb-0 bg-white rounded-b-xl max-w-[200px] select-none shadow-[_-10px_10px_0px_0px_#ff4c4c,_-15px_15px_0px_0px_#ff7f7f,_-20px_20px_0px_0px_#ff9999,_-25px_25px_0px_0px_#ffcccc]">
          <img src={logo} alt="logo" className="w-full" />
        </div>
      </Link>

      <div className="flex flex-1 gap-4 justify-end">
        <div className="flex-1 flex justify-end items-center">
          {user && (
            <Button
              color="red"
              className="select-none p-2 bg-red-800 rounded-full hover:bg-red-900 transition-all duration-300 "
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <FiLogOut size="20" />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-end">
          <ToggleDarkMode />
        </div>
      </div>
    </header>
  );
}

export default Header;
