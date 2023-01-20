import { Card, Stack, Tooltip } from "@mantine/core";
import { AiFillDollarCircle } from "react-icons/ai";
import { MostOrderedProduct } from "../../../types/app_types";
import { formatAmount } from "../../../utils/helpers";
import noAvatar from "../../../Assets/Images/no-avatar.webp";
import { FaShoppingBasket } from "react-icons/fa";

function OrderCard({ data }: { data: MostOrderedProduct }) {
  return (
    <Card
      shadow="sm"
      className={`h-full w-full  rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm  bg-opacity-25 shadow-xl cursor-auto bg-sky-400`}
    >
      <Stack className="h-full">
        <div className="flex flex-col justify-between items-center md:flex-row h-full">
          <div className="flex flex-row items-center flex-1 flex-wrap gap-2 ">
            <div>
              <img
                src={data.image || noAvatar}
                alt="logo"
                className="rounded-full h-10 w-10"
              />
            </div>

            <div className="flex flex-col items-left">
              <p className="text-2xl">
                {data.name} <br />
              </p>
              <div className="flex items-center"></div>
            </div>
          </div>

          <div className="flex flex-col h-full justify-center items-left">
            <div className="text-2xl font-bold flex items-center">
              <FaShoppingBasket size={20} className="mr-2" />
              {data.quantity}
            </div>
            <div className="text-2xl font-bold flex items-center">
              <AiFillDollarCircle size={20} className="mr-2" />
              {formatAmount(data.totalPrice)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-start">
          <p className="text-sm">Προϊόν με τις περισσότερες παραγγελίες</p>
        </div>
      </Stack>
    </Card>
  );
}

export default OrderCard;
