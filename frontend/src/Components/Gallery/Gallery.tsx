import { Carousel } from "@mantine/carousel";
import general from "../../Assets/Images/general.png";
import map from "../../Assets/Images/map.png";
import bar from "../../Assets/Images/bar.png";

function Gallery() {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <Carousel>
        <Carousel.Slide>
          <div className="flex flex-col items-center justify-center flex-1 w-full h-full">
            <img
              src={general}
              alt="general"
              className="w-full h-full object-contain"
            />
            <p>ΓΡΑΦΗΜΑΤΑ ΜΕ ΤΙΣ ΠΑΡΑΓΓΕΛΙΕΣ ΣΑΣ ΚΑΙ ΤΑ ΕΞΟΔΑ ΣΑΣ ΑΝΑ ΧΡΟΝΟ</p>
          </div>
        </Carousel.Slide>
        <Carousel.Slide>
          <div className="flex flex-col items-center justify-center flex-1 w-full h-full">
            <img src={map} alt="map" className="w-full h-full" />
          </div>
        </Carousel.Slide>
        <Carousel.Slide>
          <div className="flex flex-col items-center justify-center flex-1 w-full h-full">
            <img src={bar} alt="bar" className="w-full h-full" />
          </div>
        </Carousel.Slide>
      </Carousel>
    </div>
  );
}

export default Gallery;
