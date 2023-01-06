import { Group, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "../../Hooks/Auth/useAuth";

function AlreadyLoggedIn() {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full h-full bg-slate-700 p-5">
      <h1 className="text-2xl text-center font-bold text-white mb-5">
        Καλώς ήρθες {user?.name}
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
          onClick={() => logout()}
          className="w-full max-w-[300px]"
        >
          Αποσύνδεση
        </Button>
      </Group>
    </div>
  );
}

export default AlreadyLoggedIn;
