import { useMantineColorScheme } from "@mantine/core";
import { HiSun, HiMoon } from "react-icons/hi";

function ToggleDarkMode() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      toggleColorScheme();
    }
  };

  const handleClick = () => {
    toggleColorScheme();
  };

  return (
    <div
      role="checkbox"
      aria-checked={colorScheme === "dark" ? true : false}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer w-11 h-5  bg-neutral-700
      rounded-full relative px-1.5 flex items-center ${colorScheme === "dark" ? "" : "justify-end"
        }`}
    >
      <div
        className={`w-4 h-4 rounded-full absolute transform duration-200 ease-out bg-white left-0.5 ${colorScheme === "dark" ? "translate-x-6" : "translate-x-0"
          }`}
      />
      {colorScheme === "dark" ? (
        <HiMoon className="h-3 w-3 text-white" />
      ) : (
        <HiSun className="h-3 w-3 text-white" />
      )}
    </div>
  );
}

export default ToggleDarkMode;
