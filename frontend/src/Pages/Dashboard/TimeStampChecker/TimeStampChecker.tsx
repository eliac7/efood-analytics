import { useContext, useEffect, useState } from "react";
import { Button, Tooltip, useMantineColorScheme } from "@mantine/core";
import { UserContext } from "../../../Services/UserContext/UserContext";
import { FiRefreshCcw } from "react-icons/fi";
import { useMediaQuery } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

const REFRESH_COOLDOWN_MS = 60 * 60 * 1000;

function TimeStampChecker({ refetch }: { refetch: () => Promise<unknown> }) {
  const { state } = useContext(UserContext);
  const [now, setNow] = useState(Date.now);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timestamp = state.orders?.timestamp;
  const timestampMs = timestamp ? new Date(timestamp).getTime() : 0;
  const remainingMs = Number.isFinite(timestampMs)
    ? Math.max(0, timestampMs + REFRESH_COOLDOWN_MS - now)
    : 0;
  const isRefreshAllowed = remainingMs === 0;
  const timeLeft = Math.ceil(remainingMs / (60 * 1000));
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const mediaQuery = useMediaQuery("(max-width: 430px)");

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch {
      showNotification({
        title: "Η ανανέωση απέτυχε",
        message: "Τα δεδομένα δεν ενημερώθηκαν. Δοκιμάστε ξανά.",
        color: "red",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
            aria-label="Ανανέωση παραγγελιών"
            onClick={handleRefresh}
            disabled={!isRefreshAllowed || isRefreshing}
            loading={isRefreshing}
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
