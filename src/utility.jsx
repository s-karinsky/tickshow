import React, { useState, useEffect } from "react";
import { generateIcon } from "./generate-fileld";
import { Checkbox, ConfigProvider } from "antd";
import { MdOutlineAccessTime } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { BiLoaderCircle } from "react-icons/bi";
import {
  AuthUser,
  ChangeUser,
  CreateOrder,
  GetCart,
  MoveCart,
} from "./tools/Ibronevik_API.jsx";
import { useDispatch, useSelector } from "react-redux";
import { acTimer } from "./context/timer";
import { acDiscount } from "./context/action.js";
import { BsCheckLg } from "react-icons/bs";
import { FiArrowRight } from "react-icons/fi";

const CartModal = ({ setOpen, open, ScheduleFee, categoriesF }) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const discount = useSelector((state) => state.discount);
  const t = calculateTotal(cart, ScheduleFee, discount);
  const [load, setLoad] = useState(false);
  const [token, setToken] = useState(null);
  const [u_hash, setU_hash] = useState(null);
  let l = window.location.pathname;
  const time = useSelector((state) => state.time);

  function addPayment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());

    values.Phone = values.Phone.toString().replace("+", "");
    console.log({ ...values });

    var phantom_user_token = localStorage.getItem("phantom_user_token");
    var phantom_user_u_hash = localStorage.getItem("phantom_user_u_hash");

    ChangeUser(
      phantom_user_token,
      phantom_user_u_hash,
      values.Name,
      values.Email,
      values.Phone
    ).then((data) => {
      console.log("ChangeUser", data);
      if (
        data.status === "error" &&
        data.message.startsWith("busy user data:")
      ) {
        AuthUser(values.Email, values.Phone).then((data) => {
          localStorage.setItem("phantom_user_token", data.token);
          localStorage.setItem("phantom_user_u_hash", data.u_hash);
          console.log("USER STTTKOVKA", data);
          MoveCart(
            phantom_user_token,
            phantom_user_u_hash,
            JSON.parse(localStorage.getItem("cart")),
            data.u_id
          ).then((data) => {
            console.log("POINT: MoveCart-01:", data);
          });
        });
      } else if (data.message === "user or modified data not found") {
        console.log("CHANGE USER: ok, user already here");
      } else if (data.message === "database update failed") {
        console.log("BUG");
      }
    });

    // group seats by trip_id (t_id)
    var seats = JSON.parse(localStorage?.getItem("cart")) || [];
    seats = seats.reduce((acc, seat) => {
      if (!acc[seat.t_id]) {
        acc[seat.t_id] = {};
      }
      var seatFormat =
        seat.hall_id + ";" + seat.section + ";" + seat.row + ";" + seat.seat;
      acc[seat.t_id][seatFormat] = 1;
      return acc;
    }, {});

    var to_stripe_formatting_dancefloor_flag = false;
    for (var i = 0; i < cart.length; i++) {
      cart[i].name = "Row - " + cart[i].row + ", Seat - " + cart[i].seat;

      if (
        cart[i].category ===
          categoriesF.find((cat) => cat.code_type === "Dancefloor")?.value &&
        !to_stripe_formatting_dancefloor_flag
      ) {
        to_stripe_formatting_dancefloor_flag = true;
        cart[i].name = "DANCE FLOOR";
        cart[i].quantity = cart.filter(
          (x) =>
            x.category ===
            categoriesF.find((cat) => cat.code_type === "Dancefloor")?.value
        ).length;
      }
    }

    CreateOrder(seats, phantom_user_token, phantom_user_u_hash, 1).then(
      (data) => {
        console.log(data);
        var payment_link = data.data.payment;
        console.log("payment_link", payment_link);

        localStorage?.setItem("cart", JSON.stringify([]));

        setLoad(true);
        window.parent.postMessage(
          JSON.stringify({
            type: "submit",
            products: JSON.stringify([
              ...cart,
              { name: "fee", img: "", price: t.fee, id: "727430761" },
              { name: "discount", img: "", price: t.dis, id: "7266hgf61" },
            ]),
            data: { ...values },
            payment_link: payment_link,
          }),
          "*"
        );

        //window.location.href = payment_link
      }
    );
    /*
     */

    /*
        setTimeout(() => {
          localStorage.removeItem("cart");
          window.location.reload();
        }, 2000);
    */
  }

  useEffect(() => {
    setLoad(false);
  }, [l]);

  var first_dancefloor_seat_index = cart.findIndex(
    (x) =>
      x.category ===
      categoriesF.find((cat) => cat.code_type === "Dancefloor")?.value
  );

  const danceCtgy = categoriesF?.find(
    (x) => x.code_type === "Dancefloor"
  )?.value;
  const danceCtgyImg = categoriesF?.find(
    (x) => x.code_type === "Dancefloor"
  )?.img;
  const dancefloorCount = cart?.filter((x) => x.category === danceCtgy)?.length;
  return (
    <div className={`w100 df aic jcc modal-container ${open && "open"}`}>
      <div className="df fdc aic gap10 modal-content">
        <p className="w100 df aic jcc gap10 fs12 ticket-time">
          <MdOutlineAccessTime className="fs18" />
          Time left to place your order: <CountdownTimer initialTime={time} />
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
              const isDancefloor = chair?.category === danceCtgy;
              const chairCategoryImg = categoriesF?.find(
                (x) => x.value === chair?.category
              )?.img;

              if (isDancefloor && first_dancefloor_seat_index === ind) {
                return (
                  <label
                    className="df aic gap10 fs12 tag"
                    key={`${chair?.seat}_${ind}`}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: danceCtgyImg,
                      }}></div>
                    Dancefloor × {dancefloorCount}
                  </label>
                );
              } else if (!isDancefloor) {
                return (
                  <label
                    className="df aic gap10 fs12 tag"
                    key={`${chair?.seat}_${ind}`}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: chairCategoryImg,
                      }}></div>
                    <>
                      {chair?.row} {chair?.seat}
                    </>
                  </label>
                );
              }
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
            <button
              className="w100 df aic jcc gap10 fs16 basket-btn"
              type={"submit"}>
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

export const PromoCode = () => {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const checkPromo = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (code === "UVENTY2024") {
        setStatus(1);
        dispatch(acDiscount("SET_DISCOUNT", 5));
        setLoading(false);
      } else {
        setStatus(0);
        setLoading(false);
      }
    }, 1000);
  };

  const cancel = () => {
    setCode("");
    setStatus(null);
    dispatch(acDiscount("SET_DISCOUNT", 0));
  };

  return (
    <div className="w100 df fdc promo-container">
      <form className="w100 df aic gap5 promo-box" onSubmit={checkPromo}>
        {status !== null && <RxCross2 className="fs16 cp" onClick={cancel} />}
        <input
          type="text"
          placeholder="enter promo code"
          className="fs12"
          style={{
            color: status ? "#53BC6B" : status === 0 ? "#F66969" : "#F8F5EC",
          }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className={`df aic jcc cp ${
            (status === 0 || code?.length === 0) && "passive"
          } ${status === 1 && "success"}`}
          disabled={status === 1 || code?.length === 0}>
          {loading ? (
            <BiLoaderCircle className="svg-loader fs16" />
          ) : status === 1 ? (
            <BsCheckLg className="fs18" />
          ) : (
            <FiArrowRight className="fs16" />
          )}
        </button>
      </form>
      {status === 0 && (
        <p className="fs10" style={{ color: "#F66969" }}>
          Promo code is wrong
        </p>
      )}
    </div>
  );
};

export const calculateTotal = (data, percentage, discount) => {
  let totalQuantity = 0;
  const total = data?.reduce((acc, curr) => {
    if (curr?.type === "stand") {
      totalQuantity += curr?.quantity;
    } else {
      totalQuantity += 1;
    }
    return (
      acc +
      (curr?.type === "stand" ? curr?.price * curr?.quantity : curr?.price)
    );
  }, 0);

  const fee = (total / 100) * percentage;
  const roundedFee = (Math.ceil(fee * 100) / 100).toFixed(2);
  const totalDiscount = (total / 100) * discount || 0;

  return {
    total: (total + +roundedFee - totalDiscount).toFixed(2),
    fee: roundedFee,
    dis: totalDiscount?.toFixed(2),
    qty: totalQuantity,
  };
};

export const CountdownTimer = ({ initialTime, action }) => {
  const [time, setTime] = useState(() => {
    const savedTime = localStorage.getItem("remainingTime");
    return savedTime !== null ? Number(savedTime) : initialTime;
  });
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime === 0) {
          clearInterval(interval);
          localStorage.removeItem("remainingTime");
          return 0;
        }
        const newTime = prevTime - 1;
        localStorage.setItem("remainingTime", newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    dispatch(acTimer(time));
    if (time === 0) {
      localStorage.removeItem("cart");
      localStorage.removeItem("remainingTime");
      action((prev) => !prev);
    }
  }, [time, dispatch]);

  const formatTime = (time) => {
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return <span style={{ width: "45px" }}>{formatTime(time)}</span>;
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

export const calculateScale = (c_width, b_width) => {
  const mobile = window.innerWidth < 768;
  if (!mobile) {
    return false;
  }
  const scale = b_width / c_width;
  const scaledWidth = c_width * scale;
  if (scaledWidth > window.innerWidth) {
    return window.innerWidth / c_width;
  }
  return scale;
};
