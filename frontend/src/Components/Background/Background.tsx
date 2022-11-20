import pattern from "../../Assets/Images/pattern.jpg";
import { ThemeContext } from "../../Services/Context/ThemeContext";
import { useContext } from "react";

function Background({ dark }: { dark?: boolean }) {
  const { theme } = useContext(ThemeContext);

  return (
    <div
      className="absolute top-0 left-0 w-full h-full z-[-1] bg-x-repeat bg-center bg-[length:300px] transition-all duration-300 ease-out dark:filter dark:brightness-50"
      style={{
        backgroundImage: "url(" + pattern + ")",
      }}
    >
      {dark && (
        <div className="absolute top-0 left-0 w-full h-full z-[-1] bg-black bg-opacity-50"></div>
      )}
    </div>
  );
}

export default Background;
