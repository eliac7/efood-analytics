import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Services/UserContext/UserContext";
import { FiRefreshCcw } from "react-icons/fi";

import { Button, Tooltip } from "@mantine/core";

function TimeStampChecker({ refetch }: { refetch: () => Promise<unknown> }) {
  const { state, dispatch } = useContext(UserContext);
  const [timeLeft, setTimeLeft] = useState<number>();
  const [isRefreshAllowed, setRefreshAllowed] = useState(true);
  const TimestampState = state?.orders?.timestamp || 0;

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date();
      const timestampState = new Date(TimestampState);
      const differenceInMilliseconds =
        currentDate.getTime() - timestampState.getTime();
      const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);

      if (differenceInHours >= 1) {
        setRefreshAllowed(true);
        setTimeLeft(0);
      } else {
        setRefreshAllowed(false);
        setTimeLeft(
          Math.floor(60 - ((differenceInMilliseconds / (1000 * 60)) % 60))
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [TimestampState]);

  return (
    <>
      <Tooltip
        label={
          isRefreshAllowed ? (
            <span className="text-white text-center">
              Ανανέωση παραγγελιών{" "}
            </span>
          ) : (
            <span className="text-white text-center">
              Μπορείτε να ανανεώσετε τις παραγγελίες σας σε{" "}
              <span className="text-red-500">{timeLeft}</span> λεπτά
            </span>
          )
        }
        position="top"
        withArrow
        transition="fade"
        transitionDuration={200}
        disabled={isRefreshAllowed}
      >
        <button>
          <Button
            onClick={() => {
              refetch();
              dispatch({
                type: "SET_ORDERS_TIMESTAMP",
                payload: new Date(),
              });
            }}
            disabled={!isRefreshAllowed}
            color="blue"
            variant="outline"
            size="sm"
            style={{ zIndex: 401 }}
          >
            <FiRefreshCcw size={20} />
          </Button>
        </button>
      </Tooltip>
    </>
  );
}

export default TimeStampChecker;
