import React from "react";
import Lottie from "react-lottie";
import * as animationData from "./file/circleLottie.json";
import "./LottieLoadingCircle.css";

const LottieLoadingCircle = () => {
  return (
    <div className="lottie-circle">
      <Lottie
        options={{
          animationData,
        }}
      />
    </div>
  );
};

export default LottieLoadingCircle;