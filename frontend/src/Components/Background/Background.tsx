import { useMantineColorScheme } from "@mantine/core";
import pattern from "../../Assets/Images/pattern.jpg";

function Background() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      <div
        className="absolute top-0 left-0 w-full h-full z-[-1] bg-x-repeat bg-center bg-size-[300px] transition-[filter] duration-300 ease-out"
        style={{
          backgroundImage: "url(" + pattern + ")",
          filter: isDark ? "brightness(0.5)" : "brightness(1)",
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full z-0 hidden firefox:block transition-[background-color,opacity] duration-300 ease-out"
          style={{
            backgroundColor: isDark ? "rgb(31 41 55 / 0.5)" : "transparent",
          }}
        ></div>
      </div>
    </>
  );
}

export default Background;
