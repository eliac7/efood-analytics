import { AiFillGithub } from "react-icons/ai";

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="h-20 flex flex-col-reverse gap-2 md:flex-row justify-center items-center text-dark bg-transparent py-2">
      <div className="flex-1"></div>
      <div className="flex-1 bg-white max-w-max	 rounded select-none p-2 shadow-[_5px_5px_0px_0px_#289fed,_10px_10px_0px_0px_#5fb8ff,_15px_15px_0px_0px_#a1d8ff,_20px_20px_0px_0px_#cae6ff,_25px_25px_0px_0px_#e1eeff,_5px_5px_15px_5px_rgb(0_0_0_/_0%)]">
        <a
          href="https://www.iliasdev.com"
          target="_blank"
          rel="noreferrer"
          className="
            flex justify-center items-center
            w-full h-full
           text-center
            text-gray-900
            font-bold
            hover:text-gray-500 
            transition-all
            duration-300
            
        "
        >
          <span>
            Ilias Thalassochoritis © <span className="year">{currentYear}</span>
          </span>
        </a>
      </div>

      <div className="flex-1">
        <div className="flex justify-end mr-2">
          <a
            href="https://github.com/eliac7/efood-analytics"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center select-none p-2 bg-gray-400 rounded-full hover:bg-gray-500 transition-all duration-300 hover:text-white group "
          >
            <AiFillGithub size="30" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
