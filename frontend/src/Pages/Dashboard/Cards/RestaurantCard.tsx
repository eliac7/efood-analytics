import { Card, Stack, Tooltip } from "@mantine/core";
import { AiFillDollarCircle, AiFillHeart } from "react-icons/ai";
import { FaShoppingBasket } from "react-icons/fa";
import { GiForkKnifeSpoon, GiKnifeFork } from "react-icons/gi";
import { Restaurant } from "../../../types/app_types";
import { formatAmount } from "../../../utils/helpers";

function RestaurantCard({ data }: { data: Restaurant }) {
  return (
    <Card
      shadow="sm"
      className={`h-full w-full  rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm  bg-opacity-25 shadow-xl cursor-auto bg-sky-400`}
    >
      <Stack>
        <div className="flex items-center justify-end">
          <div className="mr-2">
            {data.is_favorite ? (
              <Tooltip
                label="Το κατάστημα είναι στα αγαπημένα σας"
                withArrow
                position="left"
              >
                <div>
                  <AiFillHeart
                    size={30}
                    className="text-red-500  bg-white rounded-full p-1"
                  />
                </div>
              </Tooltip>
            ) : null}
          </div>
          <div>
            {data.is_open ? (
              <Tooltip
                label="Το κατάστημα είναι ανοιχτό"
                withArrow
                position="left"
              >
                <div>
                  <GiForkKnifeSpoon
                    size={30}
                    className="text-green-500 bg-white rounded-full p-1"
                  />
                </div>
              </Tooltip>
            ) : (
              <Tooltip
                label="Το κατάστημα είναι κλειστό"
                withArrow
                position="left"
              >
                <div>
                  <GiKnifeFork
                    size={30}
                    className="text-red-500  bg-white rounded-full p-1"
                  />
                </div>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between items-center md:flex-row">
          <div className="flex flex-row items-center flex-1 flex-wrap  gap-2 ">
            <div>
              <img
                src={data.logo}
                alt="logo"
                className="rounded-full h-20 w-20"
              />
            </div>

            <div className="flex flex-col items-left">
              <p className="text-2xl">
                {data.name} <br />
              </p>
              <div className="flex items-center">
                <a
                  className="text-sm cursor-pointer no-underline hover:underline text-gray-500 dark:text-gray-900"
                  href={`https://maps.google.com/?q=${data.latitude},${data.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.address}
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-2xl font-bold flex items-center">
              <FaShoppingBasket size={20} className="mr-2 " />
              {data.orders}
            </div>
            <div className="text-2xl font-bold flex items-center">
              <AiFillDollarCircle size={20} className="mr-2" />
              {formatAmount(data.totalPrice)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-start">
          <p className="text-sm">
            Το εστιατόριο στο οποίο ξοδεύτηκαν τα περισσότερα χρήματα
          </p>
        </div>
      </Stack>
    </Card>
  );
}

export default RestaurantCard;
