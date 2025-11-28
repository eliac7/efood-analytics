import { useContext, useEffect, useState } from "react";
import { Button, Tooltip, useMantineColorScheme } from "@mantine/core";
import { UserContext } from "../../../Services/UserContext/UserContext";
import { FiRefreshCcw } from "react-icons/fi";
import { useMediaQuery } from "@mantine/hooks";

function TimeStampChecker({ refetch }: { refetch: () => Promise<unknown> }) {
  const { state, dispatch } = useContext(UserContext);
  const [timeLeft, setTimeLeft] = useState<number>();
  const [isRefreshAllowed, setRefreshAllowed] = useState(true);
  const TimestampState = state?.orders?.timestamp || 0;
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const mediaQuery = useMediaQuery("(max-width: 430px)");

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
            <span className={`${!isDark ? 'text-white' : 'text-gray-900'} text-center`}>
              Ανανέωση παραγγελιών{" "}
            </span>
          ) : (
            <span className={`${!isDark ? 'text-white' : 'text-gray-900'} text-center`}>
              Μπορείτε να ανανεώσετε τις παραγγελίες σας σε{" "}
              <span className="text-red-500">{timeLeft}</span> λεπτά
            </span>
          )
        }
        position="top"
        withArrow
        transitionProps={{ duration: 200 }}
        multiline={mediaQuery ? true : false}
      >
        <div>
          <Button
            onClick={() => {
              refetch();
              dispatch({
                type: "SET_ORDERS_TIMESTAMP",
                payload: new Date().getTime(),
              });
            }}
            disabled={!isRefreshAllowed}
            color="orange"
            variant="outline"
            size="md"
            style={{
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)"
            }}
          >
            <FiRefreshCcw size={20} />
          </Button>
        </div>
      </Tooltip>
    </>
  );
}

export default TimeStampChecker;
