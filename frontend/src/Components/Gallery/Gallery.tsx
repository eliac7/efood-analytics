import { Carousel } from "@mantine/carousel";
import general from "../../Assets/Images/general.png";
import map from "../../Assets/Images/map.png";
import bar from "../../Assets/Images/bar.png";

function Gallery() {
  return (
    <Carousel height={500} slideGap={0} withIndicators withControls>
      <Carousel.Slide>
        <img
          src={general}
          alt="general"
          className="w-full h-full object-cover"
        />
      </Carousel.Slide>
      <Carousel.Slide></Carousel.Slide>
      <Carousel.Slide></Carousel.Slide>
    </Carousel>
  );
}

export default Gallery;
