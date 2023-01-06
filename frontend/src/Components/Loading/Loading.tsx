import React from "react";
import { LoadingOverlay } from "@mantine/core";

interface LoadingProps {
  isLoading: boolean;
}

const Loading: React.FC<LoadingProps> = ({ isLoading }) => {
  return (
    <LoadingOverlay
      visible={isLoading}
      overlayBlur={2}
      transitionDuration={0.2}
      overlayColor={"rgba(0, 0, 0, 0.5)"}
      loaderProps={{
        color: "red",
        size: 50,
      }}
    />
  );
};

export default Loading;
