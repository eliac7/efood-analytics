import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center flex-1 w-full h-full  gap-y-5">
          <h1 className="text-9xl font-bold text-white">404</h1>
          <h2 className="text-3xl font-bold text-white">
            Η σελίδα δεν βρέθηκε
          </h2>
          {/* make a link to back but style it like a button with rounded and bg red and padding */}
          <Link
            to="/"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-300 ease-out"
          >
            Επιστροφή στην αρχική
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
