import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import "./PhotoStudio.css";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";

const filters = [
  "80s",
  "90s",
  "SoftGlow",
  "GoldenHour",
  "MoodyFade",
  "PastelDream",
  "ClassicFilm",
  "RoseTint",
  "SunnyDay",

];


const getCssFilter = (name) => {
  switch ((name || "").toLowerCase()) {
    case "80s":
      return "grayscale(1) blur(2px) contrast(1.1)";
    case "90s":
      return "sepia(0.25) saturate(0.85) contrast(0.95) brightness(1.05)";
    case "softglow":
      return "brightness(1.15) contrast(0.95) saturate(1.05)";
    case "goldenhour":
      return "sepia(0.2) brightness(1.1) contrast(1.05) hue-rotate(-10deg) saturate(1.2)";
    case "moodyfade":
      return "contrast(1.1) brightness(0.9) saturate(0.8)";
    case "pasteldream":
      return "contrast(0.9) saturate(0.85) brightness(1.1)";
    case "classicfilm":
      return "sepia(0.3) contrast(1.05) brightness(0.95) saturate(0.9)";
    case "rosetint":
      return "hue-rotate(-20deg) saturate(1.1) brightness(1.05)";
    case "sunnyday":
      return "brightness(1.3) contrast(1.1) saturate(1.2) hue-rotate(-5deg)";
    default:
      return "none";
  }
};

const getFilterClass = (filter) => {
  switch ((filter || "").toLowerCase()) {
    case "80s":
      return "_80s";
    default:
      return "_80s";
  }
};

const PhotoStudio = () => {
  const [selectedFilter, setSelectedFilter] = useState("80s");
  const [photos, setPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const webcamRef = useRef(null);

  // ✅ Ref to hold latest filter during async capture
  const selectedFilterRef = useRef(selectedFilter);

  useEffect(() => {
    selectedFilterRef.current = selectedFilter;
  }, [selectedFilter]);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // Capture photo using latest filter from ref
  const takePhoto = async () => {
  const filter = selectedFilterRef.current; // always latest filter
  const video = webcamRef.current?.video;
  if (!video || video.readyState < 2) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  ctx.filter = getCssFilter(filter);

  // Mirror fix: flip horizontally while drawing
  ctx.save();
  ctx.scale(-1, 1); // horizontal flip
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  if (filter.toLowerCase() === "80s") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/images/grain.png";
    await new Promise((r) => (img.onload = r));

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  const dataUrl = canvas.toDataURL("image/jpeg");
  setPhotos((prev) => [...prev, { src: dataUrl, filter }]);
};


  const countdownStep = async (value) => {
    setCountdown(value);
    await delay(1000);
  };

  const startPhotoSequence = async () => {
    setIsCapturing(true);
    setPhotos([]);
    setShowResult(false);

    for (let i = 0; i < 3; i++) {
      await countdownStep("3..");
      await countdownStep("2..");
      await countdownStep("1..");
      await countdownStep("Smile!");

      await takePhoto(); // uses latest filter via ref

      setCountdown(null);
      await delay(500);
    }

    setIsCapturing(false);
    setShowResult(true);
  };

  const handleReshoot = () => {
    setPhotos([]);
    setShowResult(false);
  };

  const handleDownload = async () => {
    const frame = document.getElementById("photostrip-canvas-source");
    if (!frame) return;

    const canvas = await html2canvas(frame, { useCORS: true });
    const dataURL = canvas.toDataURL("image/jpeg");

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "Booth-strip.jpg";
    link.click();
  };

  const slideIn = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: "0%",
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="photoStudio"
      variants={slideIn}
      initial="hidden"
      animate="visible"
    >
      {!showResult && (
        <div className="studio-container">
          <div className="studio-webcam-container">
            {countdown && <div className="countdown-overlay">{countdown}</div>}
            <div
              className={`studio-webcam ${getFilterClass(selectedFilter)}`}
              style={{ filter: getCssFilter(selectedFilter), position: "relative" }}
            >
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="webcam-view"
                videoConstraints={{ facingMode: "user" }}
              />
            </div>
          </div>

          <div className="filter-bar">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`filter-btn ${selectedFilter === filter ? "active" : ""}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            className="capture-btn"
            onClick={startPhotoSequence}
            disabled={isCapturing}
          >
           ❤️ 
          </button>
        </div>
      )}

      {showResult && (
        <div className="studio-result slide-in-top">
          <div
            className={`photostrip-frame ${showResult ? "strip-slide-in" : ""}`}
            id="photostrip-canvas-source"
          >
            {photos.map((photo, idx) => (
              <div className="strip-photo-wrapper" key={idx}>
                <img
                  src={photo.src}
                  alt={`snap-${idx}`}
                  className={`strip-photo-img ${getFilterClass(photo.filter)}`}
                />
              </div>
            ))}
            <p className="photostrip-caption">
               {" "}
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="result-controls">
            <button onClick={handleReshoot} className="reshoot">
              Reshoot
            </button>
            <button onClick={handleDownload} className="download">
              Download Strip
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PhotoStudio;

