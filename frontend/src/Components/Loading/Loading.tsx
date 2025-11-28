import React from "react";
import { LoadingOverlay } from "@mantine/core";

interface LoadingProps {
  isLoading: boolean;
}

const Loading: React.FC<LoadingProps> = ({ isLoading }) => {
  return (
    <LoadingOverlay
      visible={isLoading}
      overlayProps={{ blur: 2, color: "rgba(0, 0, 0, 0.5)" }}
      transitionProps={{ duration: 200 }}
      loaderProps={{
        color: "red",
        size: 50,
      }}
    />
  );
};

export default Loading;
