import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Services/UserContext/UserContext";
import { FiRefreshCcw } from "react-icons/fi";

import { Button, Tooltip } from "@mantine/core";
import { dateFormat } from "./helpers";

const isTimestampMoreThanOneHour = (timestamp: number) => {
  const timestampState = new Date(timestamp);
  if (timestampState) {
    const currentDate = new Date();
    const differenceInMilliseconds =
      currentDate.getTime() - timestampState.getTime();
    const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);

    return differenceInHours > 1;
  }
  return true;
};

function TimeStampChecker({ refetch }: { refetch: () => Promise<unknown> }) {
  const { state, dispatch } = useContext(UserContext);
  const [timeLeft, setTimeLeft] = useState<number>();

  const TimestampState = state?.orders?.timestamp || 0;

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date();
      const timestampState = new Date(TimestampState);
      const differenceInMilliseconds =
        currentDate.getTime() - timestampState.getTime();
      const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);
      const differenceInMinutes = differenceInMilliseconds / (1000 * 60);
      const differenceInSeconds = differenceInMilliseconds / 1000;

      setTimeLeft(
        differenceInHours > 1 ? 0 : 60 - (Math.floor(differenceInMinutes) % 60)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [TimestampState]);

  return (
    <>
      <Tooltip
        label={
          isTimestampMoreThanOneHour(TimestampState) ? (
            <span className="text-gray-500 text-center">
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
        disabled={isTimestampMoreThanOneHour(TimestampState)}
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
            disabled={!isTimestampMoreThanOneHour(TimestampState)}
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
