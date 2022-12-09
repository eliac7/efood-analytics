import pattern from "../../Assets/Images/pattern.jpg";

function Background() {
  return (
    <div
      className="absolute top-0 left-0 w-full h-full z-[-1] bg-x-repeat bg-center bg-[length:300px] transition-all duration-300 ease-out dark:filter dark:brightness-50"
      style={{
        backgroundImage: "url(" + pattern + ")",
      }}
    ></div>
  );
}

export default Background;
