import React from "react";

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    // make 3 columns , 1st empty, second logo, 3rd github start
    <footer className="flex flex-col-reverse gap-2 md:flex-row justify-center items-center px-4 text-dark bg-transparent md:pb-2 md:pt-10">
      <div className="flex-1"></div>
      <div className="flex-1 bg-white rounded select-none p-2 max-w-sm shadow-[_5px_5px_0px_0px_#289fed,_10px_10px_0px_0px_#5fb8ff,_15px_15px_0px_0px_#a1d8ff,_20px_20px_0px_0px_#cae6ff,_25px_25px_0px_0px_#e1eeff,_5px_5px_15px_5px_rgb(0_0_0_/_0%)]">
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
        <div className="flex justify-end">
          <a
            href="https://github.com/eliac7/efood-analytics"
            target="_blank"
            rel="noreferrer"
            className="flex items-center select-none p-2 bg-gray-400 rounded-full hover:bg-gray-500 transition-all duration-300 hover:text-white group "
          >
            <svg
              aria-hidden="true"
              height="16"
              viewBox="0 0 16 16"
              version="1.1"
              width="16"
              data-view-component="true"
              className="mr-1 group-hover: transition-color duration-300 group-hover:fill-white "
            >
              <path
                fillRule="evenodd"
                d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
              ></path>
            </svg>
            <p>Star on Github</p>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
