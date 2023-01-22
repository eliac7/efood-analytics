import { Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "../../Hooks/Auth/useAuth";

function AlreadyLoggedIn() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full h-full bg-slate-700 p-5 rounded-lg">
      <h1 className="text-2xl text-center font-bold text-white mb-5">
        Καλώς ήρθες {user?.name}
      </h1>

      <Link to="/dashboard" className="w-full text-center">
        <Button color="blue" variant="filled" className="max-w-[15rem]">
          Δες τα στατιστικά σου
        </Button>
      </Link>
    </div>
  );
}

export default AlreadyLoggedIn;
