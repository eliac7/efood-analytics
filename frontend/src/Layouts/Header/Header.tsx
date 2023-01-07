import logo from "../../Assets/Images/efood-analytics-logo.png";
import ToggleDarkMode from "../../Components/ToggleDarkMode/ToggleDarkMode";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../Hooks/Auth/useAuth";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="flex flex-col md:flex-row justify-center items-center px-4 bg-transparent text-white md:pb-10">
      <div className="flex-1"></div>
      <div className="flex-1 h-20 mb-10 md:mb-0 bg-white rounded-b-xl max-w-[200px] select-none shadow-[_-10px_10px_0px_0px_#ff4c4c,_-15px_15px_0px_0px_#ff7f7f,_-20px_20px_0px_0px_#ff9999,_-25px_25px_0px_0px_#ffcccc]">
        <Link to="/">
          <img src={logo} alt="logo" className="w-full" />
        </Link>
      </div>

      <div className="flex flex-1 gap-4 justify-end">
        {user && isDashboard ? (
          <div className="flex-1 flex justify-end items-center">
            <button
              type="button"
              className="inline-block px-4 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight  rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Αποσύνδεση
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-end">
          <ToggleDarkMode />
        </div>
      </div>
    </header>
  );
}

export default Header;
