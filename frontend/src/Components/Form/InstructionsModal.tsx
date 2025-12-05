import { useState, useCallback, useEffect } from "react";
import {
  Modal,
  Image,
  Progress,
  ActionIcon,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { FiCopy, FiCheck } from "react-icons/fi";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import step1 from "../../Assets/Images/Instructions/step_1.webp";
import step2 from "../../Assets/Images/Instructions/step_2.webp";
import step3 from "../../Assets/Images/Instructions/step_3.webp";

export default function InstructionsMoal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [embla, setEmbla] = useState<UseEmblaCarouselType[1] | null>(null);
  const imageHeight = 280;

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
    <Modal
      opened={open}
      onClose={onClose}
      title="Οδηγίες εύρεσης ID"
      size="lg"
      centered
    >
      <div className="flex flex-col items-center w-full">
        <Carousel
          getEmblaApi={setEmbla}
          classNames={{
            controls: "opacity-0 transition-opacity duration-150 ease-in-out",
            root: "w-full hover:[&_.mantine-Carousel-controls]:opacity-100",
            viewport: "w-full",
          }}
        >
          <Carousel.Slide>
            <div className="flex flex-col items-center justify-start gap-4 text-center px-4 h-[440px]">
              <div className="flex items-center justify-center w-full h-[280px] shrink-0">
                <Image
                  src={step1}
                  alt="Βήμα 1"
                  fit="contain"
                  h={imageHeight}
                  className="max-w-full"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-sm leading-relaxed">
                  Επισκεφθείτε την ιστοσελίδα του{" "}
                  <a
                    href="https://www.e-food.gr"
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-500 hover:text-red-600 font-medium"
                  >
                    E-food
                  </a>{" "}
                  και συνδεθείτε με τον λογαριασμό σας.
                </p>
              </div>
            </div>
          </Carousel.Slide>

          {/* Slide 2 */}
          <Carousel.Slide>
            <div className="flex flex-col items-center justify-start gap-4 text-center px-4 h-[440px]">
              <div className="flex items-center justify-center w-full h-[280px] shrink-0">
                <Image
                  src={step2}
                  alt="Βήμα 2"
                  fit="contain"
                  h={imageHeight}
                  className="max-w-full"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-sm leading-relaxed">
                  Συνδεθείτε με οποιαδήποτε διαθέσιμη υπηρεσία (Facebook, Apple,
                  Google). Αν έχετε λογαριασμό με e-mail και κωδικό, κλείστε αυτό
                  το παράθυρο και επιλέξτε ως τρόπο σύνδεσης το "E-mail".
                </p>
              </div>
            </div>
          </Carousel.Slide>

          <Carousel.Slide>
            <div className="flex flex-col items-center justify-start gap-4 text-center px-4 h-[440px]">
              <div className="flex items-center justify-center w-full h-[280px] shrink-0">
                <Image
                  src={step3}
                  alt="Βήμα 3"
                  fit="contain"
                  h={imageHeight}
                  className="max-w-full"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center gap-3">
                <p className="text-sm leading-relaxed">
                  Αφού συνδεθείτε επιτυχώς, ανοίξτε τον Dev Tools του περιηγητή
                  σας (F12) και γράψτε την εξής εντολή στο Console:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-gray-800 text-emerald-400 px-3 py-2 rounded-md font-mono text-sm select-all">
                    window.app.userSid
                  </code>
                  <CopyButton value="window.app.userSid" timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip
                        label={copied ? "Αντιγράφηκε!" : "Αντιγραφή"}
                        withArrow
                        position="right"
                      >
                        <ActionIcon
                          color={copied ? "teal" : "gray"}
                          variant={copied ? "filled" : "light"}
                          onClick={copy}
                          aria-label="Αντιγραφή εντολής"
                          size="lg"
                        >
                          {copied ? (
                            <FiCheck size={18} />
                          ) : (
                            <FiCopy size={18} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </div>
                <p className="text-sm leading-relaxed">
                  Αντιγράψτε το αποτέλεσμα και επικολλήστε το στο πεδίο ID.
                </p>
              </div>
            </div>
          </Carousel.Slide>
        </Carousel>

        <Progress
          value={scrollProgress}
          styles={{
            section: { transitionDuration: "0ms" },
          }}
          size="sm"
          mt="lg"
          w="60%"
          maw={320}
        />
      </div>
    </Modal>
  );
}
