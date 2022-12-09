import { useContext } from "react";
import { UserContext } from "../../Services/UserContext/UserContext";
import { Group, Button } from "@mantine/core";
import { Link } from "react-router-dom";

function AlreadyLoggedIn() {
  const { state, dispatch } = useContext(UserContext);
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full h-full bg-slate-700 p-5">
      <h1 className="text-2xl text-center font-bold text-white mb-5">
        Καλώς ήρθες {state.user?.name}
      </h1>
      <Group>
        {/* Button to dashboard */}
        <Link to="/dashboard" className="w-full">
          <Button color="blue" variant="outline" className="w-full">
            Dashboard
          </Button>
        </Link>

        <Button
          color="red"
          variant="outline"
          onClick={() => dispatch({ type: "LOGOUT" })}
          className="w-full max-w-[300px]"
        >
          Αποσύνδεση
        </Button>
      </Group>
    </div>
  );
}

export default AlreadyLoggedIn;
