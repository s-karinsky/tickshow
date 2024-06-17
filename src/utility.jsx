import React, {useState, useEffect} from "react";
import { generateIcon } from "./generate-fileld";
import { Checkbox, ConfigProvider } from "antd";
import { MdOutlineAccessTime } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { BiLoaderCircle } from "react-icons/bi";
import {CreateOrder, GetCart} from "./tools/Ibronevik_API.jsx";

const CartModal = ({ setOpen, open }) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const t = CalculateTotal(cart, 5);
  const [load, setLoad] = useState(false);
  const [token,setToken] = useState(null)
  const [u_hash,setU_hash] = useState(null)
  let l = window.location.pathname;

  function addPayment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());
    console.log({ ...values, fee: "5 %" });


    var phantom_user_token = localStorage.getItem("phantom_user_token");
    var phantom_user_u_hash = localStorage.getItem("phantom_user_u_hash");

    GetCart(phantom_user_token,phantom_user_u_hash).then((cart_res)=>{
     //console.log(cart_res)
    })

    // group seats by trip_id (t_id)
    var seats = JSON.parse(localStorage?.getItem("cart")) || []
    seats = seats.reduce((acc, seat) => {
      if (!acc[seat.t_id]) {
        acc[seat.t_id] = {};
      }
      var seatFormat = seat.hall_id + ";" + seat.section + ";" + seat.row + ";" + seat.seat
      acc[seat.t_id][seatFormat] = 1;
      return acc;
    }, {});
    console.log("seatsNew",seats)
    CreateOrder(seats, phantom_user_token, phantom_user_u_hash).then((data)=>{
      console.log(data)
      var payment_link = data.data.payment

      var b_id = data.data.b_id
      localStorage?.setItem("active_order",b_id)
      window.location.href = payment_link

    })

    setLoad(true);
    window.parent.postMessage(
      JSON.stringify({
        type: "submit",
        products: JSON.stringify(cart),
        data: { ...values, fee: `5 % = ${t.fee}` },
      }),
      "*"
    );
/*
    setTimeout(() => {
      localStorage.removeItem("cart");
      window.location.reload();
    }, 2000);*/

  };

  useEffect(() => {
    setLoad(false);
  }, [l]);

  //

  //

  return (
    <div className={`w100 df aic jcc modal-container ${open && "open"}`}>
      <div className="df fdc aic gap10 modal-content">
        <p className="w100 df aic jcc gap10 fs12 ticket-time">
          <MdOutlineAccessTime className="fs18" />
          Time left to place your order: <CountdownTimer initialTime={900} />
        </p>
        <div className="w100 df fdc aic gap10 modal-info">
          <div className="w100 df aic jcsb _info-title">
            <p className="fs22">YOUR TICKETS</p>
            <span className="fs18 cp" onClick={() => setOpen(false)}>
              <RxCross2 />
            </span>
          </div>
          <div className="w100 df aic fww gap10 tags">
            {cart?.map((chair, ind) => {
              return (
                <label
                  className="df aic gap10  fs12 tag"
                  key={`${chair?.seat}_${ind}`}>
                  {generateIcon(chair?.type, chair?.color)}
                  {chair?.type === "stand" ? (
                    `Dancefloor × ${chair.quantity}`
                  ) : (
                    <>
                      {chair?.row} {chair?.seat}
                    </>
                  )}
                </label>
              );
            })}
          </div>
          <p className="w100 df aic jcsb" style={{ color: "#f8f5ec80" }}>
            <span className="fs12">fee 5%:</span>
            <i className="fs12">
              <b>{t?.fee || 0} €</b>
            </i>
          </p>
          <p className="w100 df aic jcsb">
            <span className="fs14">Total:</span>
            <i className="fs14">
              <b>{t.total || 0} €</b>
            </i>
          </p>
          <form
            className="w100 df fdc aic gap10  _info-form"
            onSubmit={addPayment}>
            <input
                id={"modal-auth-name"}
              type="text"
              name="Name"
              placeholder="Name"
              autoComplete="off"
              required
            />
            <input
                id={"modal-auth-phone"}
              type="tel"
              name="Phone"
              placeholder="Phone"
              autoComplete="off"
              required
            />
            <input
                id={"modal-auth-email"}
              type="email"
              name="Email"
              placeholder="Email"
              autoComplete="off"
              required
            />
            <label className="w100 df aic gap8 fs12 checkbox">
              <ConfigProvider
                theme={{
                  token: {
                    colorWhite: "#2c2c2b",
                  },
                }}>
                <Checkbox
                  defaultChecked
                  style={{ opacity: 0.3, transform: "scale(0.8)" }}
                />
              </ConfigProvider>
              <p>
                Checkbox txt on one line to <u>show</u> what it will.
              </p>
            </label>
            <button className="w100 df aic jcc gap10 fs16 basket-btn" type={"submit"}>
              <i>BUY TICKET</i>
              {load && <BiLoaderCircle />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CartModal;

export const CalculateTotal = (data, percentage) => {
  const total = data
    ?.reduce(
      (acc, curr) =>
        acc +
        (curr?.type === "stand" ? curr?.price * curr?.quantity : curr?.price),
      0
    )
    ?.toFixed(2);
  const fee = total * (percentage / 100);

  return {
    total: (total * 1 + fee * 1)?.toFixed(2),
    fee: fee?.toFixed(2),
  };
};

export const CountdownTimer = ({ initialTime }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime === 0) {
          clearInterval(interval);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialTime]);

  // Zamanı biçimlendirerek ekrana yazdıralım
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return <span>{formatTime(time)}</span>;
};

export const getSeats = (cart, category) => {
  return cart.reduce((acc, curr) => {
    if (curr.category === category) {
      acc.push(curr);
    }
    return acc;
  }, []);
};

export const getUniqueCategory = (data) => {
  return data.reduce((acc, curr) => {
    if (!acc.includes(curr.category)) {
      acc.push(curr.category);
    }
    return acc;
  }, []);
};

export const findMinMaxPrices = (data = []) => {
  if (data?.length === 0) {
    return { min: 0, max: 0 };
  }

  let min = data[1]?.price;
  let max = data[1]?.price;
  let totalLeft = 0;

  data?.forEach((item) => {
    if (item?.price < min) {
      min = item?.price;
    }
    if (item?.price > max) {
      max = item?.price;
    }
    totalLeft += item?.seats;
  });

  return { min, max, totalLeft };
};
