import logo from "../../Assets/Images/efood-analytics-logo.png";
import ToggleDarkMode from "../../Components/ToggleDarkMode/ToggleDarkMode";

function Header() {
  return (
    <header className="flex justify-center items-center px-4 bg-transparent text-white">
      <div className="flex-1"></div>
      <div className="flex-1 bg-white rounded-b-xl max-w-[200px] select-none shadow-[_-10px_10px_0px_0px_#ff4c4c,_-15px_15px_0px_0px_#ff7f7f,_-20px_20px_0px_0px_#ff9999,_-25px_25px_0px_0px_#ffcccc]">
        <img src={logo} alt="logo" className="w-full" />
      </div>

      <div className="flex-1">
        <div className="flex justify-end">
          <ToggleDarkMode />
        </div>
      </div>
    </header>
  );
}

export default Header;
