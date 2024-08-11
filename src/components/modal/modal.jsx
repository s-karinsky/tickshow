import React, { useState, useEffect, useMemo, useRef } from "react";
import { Checkbox, ConfigProvider } from "antd";
import { MdOutlineAccessTime } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { BiLoaderCircle } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { getFromLocalStorage } from "../../utils/common";
import { DISTRIBUTE_PAGE_URL, STORAGE_KEY_USER_EMAIL, STORAGE_KEY_USER_HASH, STORAGE_KEY_USER_TOKEN } from "../../const";
import { ReactComponent as CheckboxIcon } from 'icons/checkbox.svg'
import { updateUser, AuthUser } from "../../api/user";
import { ClearSeats, MoveCart } from "../../api/cart";
import { CreateOrder } from "../../api/order"
import { useCountdown } from "../../utils/hooks";
import { msToTime } from "../seating-scheme/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Button from "components/button";
import { useLocation, useParams, useSearchParams } from "react-router-dom";

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

const CartModal = ({ setOpen, open, ScheduleFee, categoriesF, discount = 0, bookingLimit, cart, clearCart }) => {
  const t = useMemo(() => calculateTotal(cart, ScheduleFee, discount), [cart, ScheduleFee, discount])
  const queryClient = useQueryClient()
  const [load, setLoad] = useState(false);
  const [token, setToken] = useState(null);
  const [u_hash, setU_hash] = useState(null);
  const location = useLocation()
  const [msLeft, countdown] = useCountdown(bookingLimit - Date.now())
  const [correctUserData, setCorrectUserData] = useState(false)
  const [transitionClose, setTransitionClose] = useState(false)
  const [ searchParams ] = useSearchParams()
  const routeParams = useParams()
  const id = routeParams.event_id || searchParams.get('event_id')
  
  function addPayment(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const values = Object.fromEntries(formData.entries())
    values.Phone = values.Phone.toString().replace("+", "")
    setLoad(true)
    updateUser({
      u_name: values.Name,
      u_email: values.Email,
      u_phone: values.Phone
    }).then((data) => {
      if (
        data.status === "error" &&
        data.message.startsWith("busy user data:")
      ) {
        AuthUser(values.Email, values.Phone).then((data) => {
          localStorage.setItem("phantom_user_token", data.token);
          localStorage.setItem("phantom_user_u_hash", data.u_hash);
          MoveCart(
            getFromLocalStorage(STORAGE_KEY_USER_TOKEN),
            getFromLocalStorage(STORAGE_KEY_USER_HASH),
            JSON.parse(localStorage.getItem("cart")),
            data.u_id
          ).then((data) => {
            
          });
        });
      } else if (data.message === "user or modified data not found") {
        console.log("CHANGE USER: ok, user already here");
      } else if (data.message === "database update failed") {
        console.log("BUG");
      }
    });

    // group seats by trip_id (t_id)
    const seats = cart.reduce((acc, seat) => {
      if (!acc[seat.t_id]) {
        acc[seat.t_id] = {};
      }
      var seatFormat =
        seat.hall_id + ";" + (seat.section || seat.category) + ";" + seat.row + ";" + seat.seat;
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
    CreateOrder(seats, getFromLocalStorage(STORAGE_KEY_USER_TOKEN), getFromLocalStorage(STORAGE_KEY_USER_HASH), DISTRIBUTE_PAGE_URL).then(
      (data) => {
        var payment_link = data.data.payment;
        const b_id = data.data.b_id;
        const payment = data.data.payment;
        setLoad(false)
        if (payment) {
          window.location.href = payment
        }
        return

        if (typeof window !== 'undefined') {
          // const form = document.querySelector('form.t-form.js-form-proccess')
          const form = document.querySelector('#form771596234')
          if (form && typeof window.tcart__addProduct === 'function') {
            cart.map(ticket => {
              window.tcart__addProduct({ name: ticket.name, price: ticket.price, quantity: 1 })
            })
            values.order = b_id
            setTimeout(() => {
              window.tcart__closeCart && window.tcart__closeCart();
            }, 10)

            for (const key in values) {
              console.log(form.querySelector(`[name=${key}]`))
              form.querySelector(`[name=${key}]`).value = values[key]
            }

            form.querySelector('[type=submit]').click();
          } else {
            alert('Tilda form not found')
          }
        }
        clearCart(['tickets', id])
      }
    );
  }

  const actionOnTimeEnd = () => {
    /* ClearSeats(getFromLocalStorage(STORAGE_KEY_USER_TOKEN), getFromLocalStorage(STORAGE_KEY_USER_HASH), cart.map(i => [i.hall_id, i.category, i.row, i.seat].join(';'))).then((data) => {
      //console.log(data)
    })
    clearCart(['tickets', id]) */
  }


  const close = () => {
    const modal = contentRef.current
    const overlay = modal.parentNode
    modal.classList.add('modal-content_closing')
    overlay.style.opacity = 0;
    modal.addEventListener('transitionend', () => {
      setOpen(false)
      modal.classList.remove('modal-content_closing')
      overlay.style.opacity = null;
    }, {})
  }
// 1139193
  useEffect(() => {
    setLoad(false);
  }, [location]);

  useEffect(() => {
    if (bookingLimit > Date.now()) countdown.start()
    if (msLeft <= 0) {
      actionOnTimeEnd();
    }
  }, [])
  const contentRef = useRef(null)

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
    <div
      className={`w100 df aic jcc modal-container ${open && "open"}`}
      onClick={e => {
        if (contentRef.current && contentRef.current.contains(e.target)) return
        close()
      }}
    >
      <div className="df fdc aic gap10 modal-content" ref={contentRef}>
        <p className="w100 df aic jcc gap10 fs12 ticket-time">
          <MdOutlineAccessTime className="fs18" />
          Time left to place your order: <span style={{ width: "45px" }}>{msToTime(msLeft)}</span>
        </p>
        <div className="w100 df fdc aic gap10 modal-info">
          <div className="w100 df aic jcsb _info-title">
            <p className="fs22">YOUR TICKETS</p>
            <span className="fs18 cp" onClick={() => close()}>
              <RxCross2 className="close-icon" />
            </span>
          </div>
          <div className="w100 df aic fww gap10 tags">
            {cart?.map((chair, ind) => {
              const isDancefloor = chair?.category === danceCtgy;
              let chairCategoryImg = categoriesF?.find(
                (x) => x.value === chair?.category
              )?.icon;
              const chairCategoryColor = categoriesF?.find(
                (x) => x.value === chair?.category
              )?.color;
              // replace color in string svg
              chairCategoryImg = chairCategoryImg && chairCategoryImg.replace(
                "currentColor",
                chairCategoryColor
              );

              if (isDancefloor && first_dancefloor_seat_index === ind) {
                return (
                  <label
                    className="df aic gap8 fs12 tag"
                    key={`${chair?.seat}_${ind}`}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: danceCtgyImg,
                      }}
                      style={{ width: 12, height: 12 }}
                    />
                    Dancefloor × {dancefloorCount}
                  </label>
                );
              } else if (!isDancefloor) {
                return (
                  <label
                    className="df aic gap8 fs12 tag"
                    key={`${chair?.seat}_${ind}`}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: chairCategoryImg,
                      }}
                      style={{ width: 12, height: 12 }}
                    />
                    <span>
                      {`${chair?.row}${chair?.seat}`}
                    </span>
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
            className="w100 df fdc aic gap8  _info-form"
            onSubmit={addPayment}
          >
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
              onInput={() => {
                let email_input = document.querySelector("#modal-auth-email");
                if (email_input) {
                  email_input = email_input.value
                  if (email_input.match(/.+@.+\..+/i)) {
                    setCorrectUserData(true)
                  }
                  else {
                    setCorrectUserData(false)
                  }
                }
              }
              }
            />

            <label className='checkbox' style={{ paddingTop: 4 }}>
              <input type="checkbox" name='aggree' />
              <CheckboxIcon />
              <div>Checkbox txt on one line to <u>show</u> what it will.</div>
            </label>
            <Button
              color='bordered'
              size='large'
              type='submit'
              style={{ width: '100%', textTransform: 'uppercase' }}
              loading={load}
            >
              Buy tickets
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CartModal;