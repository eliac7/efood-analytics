import { FaPizzaSlice } from "react-icons/fa";
import { GiHamburger } from "react-icons/gi";

function FormBackground() {
  return (
    <>
      <GiHamburger
        className="
        absolute
        top-8
        left-8
        -rotate-45
        z-10
        m-auto
        text-ebony-clay-700
        text-7xl
        "
      />
      <FaPizzaSlice
        className=" 
        absolute
        bottom-8
        right-8
        z-10
        m-auto
        text-ebony-clay-700
        text-7xl
        "
      />

      <div
        className="
        absolute 
        rounded-full
        right-[-4rem]
       top-[-4rem]
       w-40
       h-40
       bg-gradient-to-br
        from-ebony-clay-900
        to-ebony-clay-700
        "
      ></div>

      <div
        className="
          absolute 
          rounded-full
          left-[-4rem]
          bottom-[-4rem]
          w-40
          h-40
          bg-gradient-to-br
          from-ebony-clay-900
          to-ebony-clay-700
          "
      ></div>
    </>
  );
}

export default FormBackground;
