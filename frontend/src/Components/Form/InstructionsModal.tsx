import { useState, useCallback, useEffect } from "react";
import { Modal, Group, Image, Progress, createStyles } from "@mantine/core";
import { Carousel, Embla } from "@mantine/carousel";
import step1 from "../../Assets/Images/Instructions/step_1.webp";
import step2 from "../../Assets/Images/Instructions/step_2.webp";
import step3 from "../../Assets/Images/Instructions/step_3.webp";

const useStyles = createStyles((_theme, _params, getRef) => ({
  controls: {
    ref: getRef("controls"),
    transition: "opacity 150ms ease",
    opacity: 0,
  },

  root: {
    "&:hover": {
      [`& .${getRef("controls")}`]: {
        opacity: 1,
      },
    },
  },
}));

export default function InstructionsMoal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [embla, setEmbla] = useState<Embla | null>(null);
  const { classes } = useStyles();

  const handleScroll = useCallback(() => {
    if (!embla) return;
    const progress = Math.max(0, Math.min(1, embla.scrollProgress()));
    setScrollProgress(progress * 100);
  }, [embla, setScrollProgress]);

  useEffect(() => {
    if (embla) {
      embla.on("scroll", handleScroll);
      handleScroll();
    }
  }, [embla]);

  return (
    <>
      <Modal
        opened={open}
        onClose={onClose}
        title="Οδηγίες εύρεσης ID"
        size="lg"
        centered
      >
        <Carousel mx="auto" getEmblaApi={setEmbla} classNames={classes}>
          <Carousel.Slide className="flex items-center justify-center">
            <Group position="center">
              <Image src={step1} alt="Βήμα 1" height="100%" width="100%" />
              <p className="text-center">
                Επισκεφθείτε την ιστοσελίδα του{" "}
                <a
                  href="https://www.e-food.gr"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-500 hover:text-red-600"
                >
                  E-food
                </a>{" "}
                και συνδεθείτε με τον λογαριασμό σας.
              </p>
            </Group>
          </Carousel.Slide>
          <Carousel.Slide>
            <Group position="center">
              <Image
                src={step2}
                alt="Βήμα 2"
                fit="contain"
                height="400px"
                width="100%"
              />

              <p>
                Συνδεθείτε με οποιαδήποτε διαθέσιμη υπηρεσία (Facebook, Apple,
                Google). Αν έχετε λογαριασμό με e-mail και κωδικό, κλείστε αυτό
                το παράθυρο και επιλέξτε ως τρόπο σύνδεσης το "E-mail".
              </p>
            </Group>
          </Carousel.Slide>
          <Carousel.Slide>
            <Group position="center">
              <Image src={step3} alt="Βήμα 3" height="100%" width="100%" />
              <p>
                Αφού συνδεθείτε επιτυχώς, ανοίξτε τον Dev Tools του περιηγητή
                σας (F12) και γράψτε την εξής εντολή στο Console:
              </p>
              <div className="select-none">
                <code
                  className="
                    bg-gray-800
                    text-white
                    p-2
                    rounded
                    my-2
                    select-auto
                    "
                >
                  window.app.userSid
                </code>
              </div>

              <p>Αντιγράψτε το αποτέλεσμα και επικολλήστε το στο πεδίο ID.</p>
            </Group>
          </Carousel.Slide>
        </Carousel>
        <Progress
          value={scrollProgress}
          styles={{
            bar: { transitionDuration: "0ms" },
            root: { maxWidth: 320 },
          }}
          size="sm"
          mt="xl"
          mx="auto"
        />
      </Modal>
    </>
  );
}
