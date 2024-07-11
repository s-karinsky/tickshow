import React, { useState, useMemo, useRef, Suspense, lazy } from "react";
import { useEffect } from "react";
import {
  calculateScale,
  calculateTotal,
  CountdownTimer,
  findMinMaxPrices,
  getSeats,
  PromoCode,
} from "./utility";
import { getUniqueCategory } from "./utility";
// import { generateSeat } from "./generate-fileld";
// import { mainData, data, categories, generateIcon } from "./generate-fileld";

// import { FaCheck } from "react-icons/fa6";
import {
  RiCheckboxBlankCircleFill,
  RiZoomInLine,
  RiZoomOutLine,
} from "react-icons/ri";
import {
  IoIosArrowDown,
  IoIosArrowUp,
  IoIosCheckmarkCircle,
} from "react-icons/io";
import { RiArrowGoBackLine } from "react-icons/ri";
import { RxPlus, RxMinus, RxCross2 } from "react-icons/rx";
import birds from "./images/EARLY BIRDS.svg";
import "./progress-bar.css";
import {
  AuthUser,
  CartSeat,
  ClearSeats,
  GetCart,
  GetLimitTime,
  GetStadium,
  GetStadiumScheme,
  RegisterPhantomUser,
} from "./tools/Ibronevik_API.jsx";
import { forwardRef, useCallback } from "react";
import s from "./svg-scheme.module.scss";
import { Tooltip } from "antd";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { reRendering } from "antd/es/watermark/utils";
import fetchTickets, { useTickets } from "./tools/tickets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import tickets from "./tools/tickets";
import { MdOutlineAccessTime, MdOutlineCheckCircle } from "react-icons/md";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useControls } from "react-zoom-pan-pinch";
import { useSelector } from "react-redux";
import arrow from "./images/Frame 6282.svg";
import { useParams } from "react-router-dom";

const schedule_id = "383";
const currenciesSymbols = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  RUB: "₽",
  UAH: "₴",
  BYR: "p",
  KZT: "₸",
  KGS: "₸",
  CNY: "¥",
  INR: "₹",
  JPY: "¥",
  TRY: "₺",
};
const CartModal = lazy(() => import("./utility"));

const addStyles = (el, styles) => Object.assign(el.style, styles);

export default function SvgSchemeTooltop({ for: el, className, children }) {
  const [styles, setStyles] = useState();

  useEffect(() => {
    const isElem = el instanceof Element;
    const isString = typeof el === "string";
    if (!isElem && !isString) {
      setStyles();
      return;
    }
    const target = isElem ? el : document.querySelector(el);
    if (target) {
      const { x: left, y: top, width } = target.getBBox();
      setStyles({ left: left, top, opacity: 1 });
    }
  }, [el]);
  return (
    <div className={s.svgSchemeTooltip + " " + className} style={styles}>
      {children}
    </div>
  );
}
const SvgScheme = forwardRef(
  (
    {
      categories = [],
      seatSelector = ".svg-seat",
      src,
      tickets,
      currentCategory = "all",
      tooltip,
      onSeatClick,
      onSeatOver,
      onSeatOut,
      categoriesF = [],
      active = "all",
    },
    ref
  ) => {
    //console.log("POINT: SvgScheme-01 :", currentCategory)
    const [tooltipSeat, setTooltipSeat] = useState();
    const [refresh, setRefresh] = useState(false);
    //console.log(tickets.filter((ticket) => ticket.row.toString() === "-1" || ticket.row.toString() === "0"),
    //    tickets.filter((ticket) => ticket.category === "Dancefloor").length)
    const dancefloor_category_name = categoriesF.find(
      (cat) => cat.code_type === "Dancefloor"
    )?.value;
    //console.log("DCNAME",dancefloor_category_name)
    const handleClick = useCallback(
      async (e) => {
        const { target: el } = e;
        if (!el.matches(seatSelector)) return;
        if (!tickets) {
          console.log("no tickets,return", tickets);
          return;
        }
        if (el.getAttribute("data-disabled") === "true") {
          return;
        }
        const seatDataTransformer = {
          seat: el.getAttribute("data-seat"),
          row: el.getAttribute("data-row"),
          id: el.getAttribute("data-seat") + "_" + el.getAttribute("data-row"),
          price: undefined,
          category: el.getAttribute("data-category"),
          color: undefined,
          icon: undefined,
          el: el,
        };
        if (seatDataTransformer.category === dancefloor_category_name) {
          var dancefloor_tickets = tickets.filter(
            (ticket) => ticket.section === dancefloor_category_name
          );
          dancefloor_tickets.sort((a, b) => b.seat - a.seat);
          seatDataTransformer.price = dancefloor_tickets[0].price;
          seatDataTransformer.currency = dancefloor_tickets[0].currency;
          seatDataTransformer.seat = dancefloor_tickets[0].seat;
          seatDataTransformer.row = dancefloor_tickets[0].row;
        } else {
          for (const ticket of tickets) {
            if (
              ticket.row.toString() === seatDataTransformer.row.toString() &&
              ticket.seat.toString() === seatDataTransformer.seat.toString()
            ) {
              seatDataTransformer.price = ticket.price;
            }
          }
          for (const category of categories) {
            if (category.value === seatDataTransformer.category) {
              seatDataTransformer.color = category.color;
              seatDataTransformer.img = category.icon;
            }
          }
        }
        setRefresh(!refresh);
        onSeatClick && onSeatClick(seatDataTransformer);
      },
      [
        seatSelector,
        tickets,
        dancefloor_category_name,
        refresh,
        onSeatClick,
        categories,
      ]
    );

    const handleMouseOver = useCallback(
      (e) => {
        const { target: el } = e;
        if (!el.matches(seatSelector)) return;
        if (tooltip) setTooltipSeat(el);
        onSeatOver && onSeatOver(e);
      },
      [onSeatOver, seatSelector, tooltip]
    );

    const handleMouseOut = useCallback(
      (e) => {
        const { target: el } = e;
        if (!el.matches(seatSelector)) return;
        if (tooltip) setTooltipSeat(null);
        onSeatOut && onSeatOut(e);
      },
      [onSeatOut, seatSelector, tooltip]
    );

    const styles = useMemo(() => {
      return categories.reduce(
        (acc, cat) => {
          acc += `
        .svg-seat[data-category="${cat.value}"]:not([data-in-cart]) { fill: ${cat.color}; }
        .svg-seat[data-category="${cat.value}"]:not([data-disabled]):not([data-in-cart]):hover { stroke: ${cat.color}; stroke-width: 3px; }
        .svg-scheme-icon-cat-${cat.value} { color: ${cat.color}; }
        .svg-scheme-bg-cat-${cat.value} { background-color: ${cat.color}; }
      `;
          return acc;
        },
        `
      .svg-seat:not([data-disabled]) { cursor: pointer; }
      .svg-seat[data-disabled]:not([data-in-cart]) { fill: #666 !important; }
      .svg-seat[data-in-cart] { fill: black; }
    `
      );
    }, [categories]);
    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(src, "text/html");
    //const svg_seats = parsedDocument.getElementsByTagName("path")
    const svg_seats = parsedDocument.getElementsByClassName("svg-seat");
    if (currentCategory === "all") {
      for (var i = 0; i < svg_seats.length; i++) {
        var el = svg_seats[i];
        var el_data = {
          seat: el.getAttribute("data-seat"),
          row: el.getAttribute("data-row"),
          category: el.getAttribute("data-category"),
          disabled: el.getAttribute("data-disabled"),
        };

        var suitableTicket = false;
        if (el_data.category === dancefloor_category_name) {
          var dancefloor_tickets = tickets.filter(
            (ticket) => ticket.section === dancefloor_category_name
          );
          if (dancefloor_tickets.length > 0) {
            suitableTicket = true;
          }
        } else {
          for (var j = 0; j < tickets.length; j++) {
            if (
              tickets[j].row.toString() === el_data.row &&
              tickets[j].seat.toString() === el_data.seat
            ) {
              suitableTicket = true;

            }
          }
        }
        if (!suitableTicket) {
          el.setAttribute("data-disabled", true);
        }
      }
    } else {
      for (var i = 0; i < svg_seats.length; i++) {
        var el = svg_seats[i];
        var el_data = {
          seat: el.getAttribute("data-seat"),
          row: el.getAttribute("data-row"),
          category: el.getAttribute("data-category"),
          disabled: el.getAttribute("data-disabled"),
        };
        var suitableTicket = false;
        for (var j = 0; j < tickets.length; j++) {
          if (
            tickets[j].row.toString() === el_data.row &&
            tickets[j].seat.toString() === el_data.seat
          ) {
            suitableTicket = true;

          }
        }
        if (
          !suitableTicket ||
          el_data.category !== (active || currentCategory)
        ) {
          el.setAttribute("data-disabled", true);
        }
      }
    }

    var cart = JSON.parse(localStorage?.getItem("cart")) || [];
    for (var i = 0; i < svg_seats.length; i++) {
      var el = svg_seats[i];
      var el_data1 = {
        seat: el.getAttribute("data-seat"),
        row: el.getAttribute("data-row"),
        category: el.getAttribute("data-category"),
        disabled: el.getAttribute("data-disabled"),
      };
      for (var j = 0; j < cart.filter( (x) => x.category === el_data.category).length; j++) {
        if (
          cart[j].row.toString() === el_data1.row?.toString() &&
          cart[j].seat.toString() === el_data1.seat?.toString()
        ) {
          svg_seats[i].setAttribute("data-in-cart", true);
          svg_seats[i].setAttribute("data-disabled", false);
        }
      }
    }

    var SvgToInsert = parsedDocument.getElementsByTagName("svg")[0];
    if (!SvgToInsert) {
      return <div>Loading</div>;
    } else {
    }
    var s = new XMLSerializer();
    var str_svg = s.serializeToString(SvgToInsert);
    return (
      <div className={s.scheme} id="stage">
        {!!tooltip && (
          <SvgSchemeTooltop for={tooltipSeat}>
            {!!tooltipSeat && tooltip(Object.assign({}, tooltipSeat.dataset))}
          </SvgSchemeTooltop>
        )}
        <style>{styles}</style>
        <div
          ref={ref}
          className={s.svgContainer}
          dangerouslySetInnerHTML={{ __html: str_svg }}
          onClick={handleClick}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}></div>
      </div>
    );
  }
);

function SvgSchemeSeatPreview({
  className,
  category,
  categories,
  price,
  tickets,
  row,
  seat,
  text,
  icon,
  color,
  footer,
  categoriesF = [],
}) {
  var currency = "€";
  var dancefloor_category_name = categoriesF.find(
    (cat) => cat.code_type === "Dancefloor"
  )?.value;
  var dancefloor_flag = false;

  var cart = JSON.parse(localStorage?.getItem("cart")) || [];
  if (
    cart.filter((item) => item.category === dancefloor_category_name).length > 0
  ) {
    dancefloor_flag = true;
  }
  if (!row || !seat) {
    currency = "";
    price = "-";
    if (category === dancefloor_category_name) {
      var dancefloor_tickets = tickets.filter(
        (ticket) => ticket.section === dancefloor_category_name
      );
      dancefloor_tickets.sort((a, b) => b.seat - a.seat);
      if (!dancefloor_tickets[0]) {
        dancefloor_tickets[0] = { price: 0, currency: "€" };
      } else {
        price = dancefloor_tickets[0].price;
        currency = dancefloor_tickets[0].currency;
      }
    }
  } else {
    var suitableTicket;
    suitableTicket = tickets.find(
      (t) =>
        t.row.toString() === row.toString() &&
        t.seat.toString() === seat.toString()
    );
    if (!suitableTicket) {
      price = "-";
      currency = "";
    } else {
      price = suitableTicket.price;
      currency = suitableTicket.currency;
    }
  }

  if (!currenciesSymbols[currency]) {
  } else {
    currency = currenciesSymbols[currency];
  }

  const cat = categories.find((c) => c.value === category);
  const svg = icon || cat?.icon;
  const clr = color || cat?.color || "#fff";
  var cart = JSON.parse(localStorage?.getItem("cart")) || [];
  var item = cart.find(
    (i) => i.category === category && i.row === row && i.seat === seat
  );

  //console.log(cat.value,dancefloor_category_name,dancefloor_flag)

  return (
    <div className={s.preview + " " + className}>
      <div className={s.block}>
        <div className={s.price}>
          {price}&nbsp;{currency}
        </div>
        {!svg ? (
          <div />
        ) : (
          <div
            className={s.icon}
            style={{ color: clr }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
      <div className={s.block + " " + s.desc} style={{ color: clr }}>
        <div className={s.category}>{cat?.label}</div>
        <div className={s.text}>{text}</div>
      </div>
      <div className={s.container}>
        <div className={s.row}>
          <span>Row:</span>
          {row || "-"}
        </div>
        <div className={s.seat}>
          <span>Seat:</span>
          {seat || "-"}
        </div>
      </div>
      {!!footer && <div className={s.footer}>{footer}</div>}
      <div
        className={
          s.footer +
          " " +
          (item || (cat.value === dancefloor_category_name && dancefloor_flag)
            ? s["selected"]
            : s["select"])
        }>
        {item || (cat.value === dancefloor_category_name && dancefloor_flag) ? (
          <>
            <MdOutlineCheckCircle style={{ marginRight: "3px" }} />
            <span>Selected</span>
          </>
        ) : (
          <span>{suitableTicket ? "Click To Select" : "Seat not avaible"}</span>
        )}
      </div>
    </div>
  );
}

export const App = () => {
  const [activeSeat, setActiveSeat] = useState(null);
  //const cart = useMemo(() => {
  //  return JSON.parse(localStorage.getItem("cart")) || [];
  //}, [update]);
  let [cart, setCart] = useState(
    JSON.parse(localStorage?.getItem("cart")) || []
  );
  const [selected, setSelected] = useState(0);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [cartModal, setCartModal] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [cursor, setCursor] = useState("grab");
  let [categoriesF, setCategoriesF] = useState([]);
  const [firstZ, setFirstZ] = useState(true);
  const discount = useSelector((state) => state.discount);
  // isLoading, error,


  const [tickets, setTickets] = useState();
  const [currentCategory, setCurrentCategory] = useState("all");
  const [ScheduleFee, setScheduleFee] = useState(0);
  const [LimitTime, setLimitTime] = useState();
  const searchParams = new URLSearchParams(window.location.search);
  const [ScheduleDoesNotExist, setScheduleDoesNotExist] = useState(false);
  const { a } = useParams();
  console.log(window.location.href.split("/").slice(-1)[0]);
  const schedule_id = !isNaN(+window.location.href.split("/").slice(-1)[0])
    ? window.location.href.split("/").slice(-1)[0]
    : null;
  var { data, refetch } = useTickets({ event_id: schedule_id, skip: 0, limit: 30 }, {});

  useEffect(() => {
    if(!LimitTime){
      GetLimitTime().then((data) => {
        setLimitTime(data);
      });
    }


    if (!localStorage.getItem("phantom_user_token")) {
      RegisterPhantomUser().then((email) => {
        localStorage.setItem("phantom_user_email", email);
        AuthUser(email).then((phantom_auth_data) => {
          localStorage.setItem("phantom_user_token", phantom_auth_data.token);
          localStorage.setItem("phantom_user_u_hash", phantom_auth_data.u_hash);
        });
      });
    }
    if (data) {
      setTickets(data);
    } else {
      refetch({
        event_id: schedule_id,
        skip: 0,
        limit: 30,
      }).then((data) => {
        setTickets(
          data.data.concat(JSON.parse(localStorage?.getItem("cart")) || [])
        );
      });
    }
    LoadStadiumData();
  }, [LoadStadiumData, data, refetch]);

  useEffect(() => {
    const updateZoom = () => {
      const stageElement = document.getElementById("stage");
      if (stageElement) {
        const c_w = stageElement.clientWidth;
        const s = calculateScale(c_w, c_w);
        setMobile(s);
      }
    };
    updateZoom();
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, [categoriesF.length]);

  const reloadCart = () => {
    setCart(JSON.parse(localStorage?.getItem("cart")) || []);
  };

  const GetSeat = (row, seat) => {
    return tickets?.find(
      (x) =>
        x?.row.toString() === row.toString() &&
        x?.seat.toString() === seat.toString()
    );
  };
  const GetFreeDancefloorTicket = () => {
    var dancefloor_tickets = tickets?.filter(
      (x) => x?.row === "-1" || x?.row === -1
    );
    dancefloor_tickets.sort((a, b) => b?.seat - a?.seat);
    for (var i = 0; i < dancefloor_tickets.length; i++) {
      var flag = true;
      for (var j = 0; j < cart.length; j++) {
        if (
          dancefloor_tickets[i].seat === cart[j].seat &&
          dancefloor_tickets[i].row === cart[j].row
        ) {
          flag = false;
        }
      }
      if (flag) {
        dancefloor_tickets[i].category = "Dancefloor";
        dancefloor_tickets[i].code_categoy = "Dancefloor";
        return dancefloor_tickets[i];
      }
    }
  };

  const addToCart = useCallback(
    (seat, st) => {
      //console.log("seat", seat, st);
      var dancefloor_category = categoriesF?.find(
        (x) => x?.code_type === "Dancefloor"
      )?.value;
      cart = JSON.parse(localStorage?.getItem("cart")) || [];
      //refresh_cart();
      var cartItem = cart?.find((x) => x?.id === seat?.id);
      if (cartItem || seat?.category === dancefloor_category) {
        if (seat.category === dancefloor_category) {
          if (st) {
            // minus seat to dancefloor
            var dancefloor_ticktes_in_cart = cart.filter(
              (x) => x?.row === "-1" || x?.row === -1
            );
            dancefloor_ticktes_in_cart.sort((a, b) => b.quantity - a.quantity);
            var tkt = dancefloor_ticktes_in_cart[0];
            cartItem = tkt;
            cart?.splice(cart?.indexOf(tkt), 1);
            CartSeat(
              localStorage.getItem("phantom_user_token"),
              localStorage.getItem("phantom_user_u_hash"),
              tkt.hall_id +
                ";" +
                tkt.section +
                ";" +
                tkt.row +
                ";" +
                tkt.seat +
                "",
              tkt.t_id,
              0
            ).then((data) => {
              //console.log("Cart Seat", data);
              if(data?.status === "error") {
                  alert("This place has just been reserved")
                refetch().then(r => {
                  setTickets(r.data);
                  localStorage?.setItem("cart", JSON?.stringify(cart));
                })
              }
            });
            localStorage?.setItem("cart", JSON?.stringify(cart));
            reloadCart();
            return;
          } else {
            //plus seat to dancefloor

            var free_dancefloor_ticket = GetFreeDancefloorTicket();
            if (!free_dancefloor_ticket) {
              return;
            }
            free_dancefloor_ticket.hall_id = GetSeat(
              free_dancefloor_ticket.row,
              free_dancefloor_ticket.seat
            )?.hall_id;
            free_dancefloor_ticket.section = GetSeat(
              free_dancefloor_ticket.row,
              free_dancefloor_ticket.seat
            )?.section;
            free_dancefloor_ticket.t_id = GetSeat(
              free_dancefloor_ticket.row,
              free_dancefloor_ticket.seat
            )?.t_id;
            free_dancefloor_ticket.event_id = GetSeat(
              free_dancefloor_ticket.row,
              free_dancefloor_ticket.seat
            )?.event_id;
            CartSeat(
              localStorage.getItem("phantom_user_token"),
              localStorage.getItem("phantom_user_u_hash"),
              free_dancefloor_ticket.hall_id +
                ";" +
                free_dancefloor_ticket.section +
                ";" +
                free_dancefloor_ticket.row +
                ";" +
                free_dancefloor_ticket.seat +
                "",
              free_dancefloor_ticket.t_id,
              1
            ).then((data) => {
              //console.log("Cart Seat", data);
              if(data?.status === "error") {
                alert("This place has just been reserved")
                refetch().then(r => {
                  setTickets(r.data);
                  localStorage?.setItem("cart", JSON?.stringify(cart));
                })
              }
            });
            cart?.push(free_dancefloor_ticket);
            localStorage?.setItem("cart", JSON?.stringify(cart));
            reloadCart();
            return;
          }
        }

        // Cart Seat
        if (seat.category !== dancefloor_category) {
          seat.el.style.fill = categoriesF.find(
            (x) => x.name === seat.category
          )?.color;
        }
        CartSeat(
          localStorage.getItem("phantom_user_token"),
          localStorage.getItem("phantom_user_u_hash"),
          cartItem.hall_id +
            ";" +
            cartItem.section +
            ";" +
            seat.row +
            ";" +
            seat.seat +
            "",
          cartItem.t_id,
          0
        ).then((data) => {
          //console.log("Cart Seat", data);
          refetch().then(r => {
            setTickets(r.data);

          })
        });
        cart?.splice(cart?.indexOf(cartItem), 1);
        localStorage?.setItem("cart", JSON?.stringify(cart));
      } else {
        // Cart Seat

        var ticket_Data = {
          t_id: GetSeat(seat?.row, seat?.seat).t_id,
          hall_id: GetSeat(seat?.row, seat?.seat).hall_id,
          event_id: GetSeat(seat?.row, seat?.seat).event_id,
          section: GetSeat(seat?.row, seat?.seat).section,
        };

        seat.t_id = ticket_Data.t_id;
        seat.hall_id = ticket_Data.hall_id;
        seat.event_id = ticket_Data.event_id;
        seat.section = ticket_Data.section;
        CartSeat(
          localStorage.getItem("phantom_user_token"),
          localStorage.getItem("phantom_user_u_hash"),
          ticket_Data.hall_id +
            ";" +
            ticket_Data.section +
            ";" +
            seat.row +
            ";" +
            seat.seat +
            "",
          ticket_Data.t_id,
          1
        ).then((data) => {
          //console.log("Cart Seat", data);
          if(data?.status === "error") {
            alert("This place has just been reserved")
            refetch().then(r => {
              setTickets(r.data);
              localStorage?.setItem("cart", JSON?.stringify(cart));
            })
          }
        });

        cart?.push(seat);
        localStorage.setItem("cart", JSON.stringify(cart));
      }
      reloadCart();
    },
    [tickets, categoriesF]
  );

  const deleteFromCart = (category) => {
    var items_to_delete = cart.filter((item) => item.category === category);

    var new_format_seats_to_delete = items_to_delete.map((item) => {
      return {
        prop:
          item.hall_id +
          ";" +
          item.section +
          ";" +
          item.row +
          ";" +
          item.seat +
          "",
        prod: item.t_id,
        count: 0,
      };
    });
    var new_total_seats_to_delete = {};
    for (const seat of new_format_seats_to_delete) {
      new_total_seats_to_delete[seat.prod] = [];
    }
    for (const seat of new_format_seats_to_delete) {
      new_total_seats_to_delete[seat.prod].push(seat.prop);
    }
    ClearSeats(
      localStorage.getItem("phantom_user_token"),
      localStorage.getItem("phantom_user_u_hash"),
      new_total_seats_to_delete
    ).then((data) => {
      //console.log("Delete Seats By Category", data)
    });
    var newCart = cart.filter((item) => item.category !== category);
    localStorage.setItem("cart", JSON.stringify(newCart));
    reloadCart();
  };

  const handleMouseDown = useCallback((e) => {
    setCursor("grabbing");
  }, []);

  const handleUp = useCallback(() => {
    setCursor("grab");
  }, []);

  const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
    return (
      <>
        {" "}
        <div className="df aic gap5 zoom-box cp">
          <button
            className="df aic jcc fs18"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
              setZoom(zoom - 1);
            }}>
            <RiZoomOutLine />
          </button>
          <button
            className="df aic jcc fs18"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
              setZoom(zoom + 1);
            }}>
            <RiZoomInLine />
          </button>
        </div>
        {cart.length !== 0 && (
          <div className="df aic jcc gap10 zoom-box time-box" id="action">
            <MdOutlineAccessTime className="fs18" /> Time left to place your
            order:{" "}
            {
              <CountdownTimer
                initialTime={LimitTime}
                action={() => {
                  var cart_tickets = cart;
                  var new_tickets = {};
                  for (var i = 0; i < cart_tickets.length; i++) {
                    if (!new_tickets[cart_tickets[i].t_id]) {
                      new_tickets[cart_tickets[i].t_id] = [];
                    }
                    new_tickets[cart_tickets[i].t_id].push(
                      cart_tickets[i].hall_id +
                        ";" +
                        cart_tickets[i].section +
                        ";" +
                        cart_tickets[i].row +
                        ";" +
                        cart_tickets[i].seat
                    );
                  }
                  var token = localStorage.getItem("phantom_user_token");
                  var u_hash = localStorage.getItem("phantom_user_u_hash");
                  ClearSeats(token, u_hash, new_tickets).then((res) => {
                    //console.log("Clearing Seats ",res)
                  });
                  setCart([]);
                  localStorage.setItem("cart", JSON.stringify([]));
                }}
              />
            }
          </div>
        )}
        {(zoom > 1 || categoriesF[selected].type !== "all") && (
          <div
            className="df aic jcc back-btn cp"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              resetTransform();
              setZoom(1);
              setFirstZ(true);
              setCurrentCategory("all");
              setSelected(0);
              setActive(0);
            }}
            id="action">
            <button className="df aic jcc fs18">
              <RiArrowGoBackLine />
            </button>
          </div>
        )}
        {categoriesF[selected].type !== "all" && (
          <span
            className="df aic jcc fs12 cp bottom-back-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(0);
              setCurrentCategory("all");
              setActive(0);
              setOpen(false);
            }}
            id="action">
            BACK TO ALL <br /> CATEGORIES
          </span>
        )}
      </>
    );
  };

  const firstZoom = useCallback(
    (e) => {
      if (firstZ && zoom <= 1) {
        const doubleClickEvent = new MouseEvent("dblclick", {
          bubbles: true,
          cancelable: true,
          clientX: e.changedTouches?.[0]?.clientX || e?.clientX,
          clientY: e.changedTouches?.[0]?.clientY || e?.clientY,
        });
        e?.currentTarget?.dispatchEvent(doubleClickEvent);
        setFirstZ(false);
        setZoom(zoom + 1);
      }
    },
    [firstZ, zoom]
  );

  const closeModal = () => {
    setOpenB(false);
    setOpen(false);
  };

  const selectActiveSeat = (e, seat) => {
    e.stopPropagation();
    if (seat.status === "available" && !mobile) {
      addToCart(seat);
    }
    if (mobile) {
      setActiveSeat(seat?.id);
    }
  };

  const cancel = (e) => {
    if (
      e?.target?.offsetParent?.className === "ant-tooltip-content" ||
      e.target.tagName === "path"
    ) {
      console.log("calismadi");
    } else {
      setActiveSeat(null);
    }
  };

  const actionCtgy = (s) => {
    if (categoriesF[s].id === "ct_all") {
      setCurrentCategory("all");
    } else {
      setCurrentCategory(categoriesF[s].name);
    }
  };

  const [totalC_V, setTotalC_V] = useState({});

  //
  const build_totalC_V = () => {
    if (!tickets || tickets?.length === 0) return;
    var prices = [];
    for (const t of tickets) {
      prices.push(t["price"]);
    }
    setTotalC_V({
      totalLeft: tickets.length,
      min: prices.reduce((a, b) => Math.min(a, b)),
      max: prices.reduce((a, b) => Math.max(a, b)),
    });
  };
  const [stadiumData, setStadiumData] = useState({});
  const [stadiumDataReceived, setStadiumDataReceived] = useState(false);
  function LoadStadiumData() {
    if (!stadiumDataReceived) {
      GetStadium(schedule_id).then((stadium_data) => {
        GetStadiumScheme(stadium_data["stadium"]["scheme_blob"]).then(
          (stadium_scheme) => {
            if (!stadiumDataReceived) {
              setScheduleFee(stadium_data.schedule.fee * 1);
              setStadiumData(stadium_scheme);
              setStadiumDataReceived(true);
            }
          }
        );
      });
    }
  }
  const makeUpCategoriesF = () => {
    if (!tickets) {
      return;
    }
    var out = [];
    if (stadiumDataReceived) {
      out.push({
        id: "ct_all",
        name: "ALL CATEGORIES",
        seats: totalC_V.totalLeft,
        price: "",
        old_price: "",
        currency: "€",
        type: "all",
        early_bird: false,
        color: "#80ed99",
      });

      for (var i = 0; i < stadiumData["categories"].length; i++) {
        var cat = stadiumData["categories"][i];
        var tmp = {
          id: undefined,
          name: cat.label,
          value: cat.value,
          seats: undefined,
          price: undefined,
          old_price: undefined,
          currency: "€",
          type: "chair",
          early_bird: true,
          color: cat.color,
          img: cat.icon,
          code_type: undefined,
        };
        var cat_tickets = tickets?.filter(
          (ticket) => ticket.section === cat.value
        );

        var flag = true;
        for (var j = 0; j < cat_tickets.length; j++) {
          if (
            cat_tickets[j].row.toString() !== "-1" &&
            cat_tickets[j].row.toString() !== "0"
          ) {
            flag = false;
            break;
          }
        }
        if (flag && cat_tickets.length > 0) {
          tmp.code_type = "Dancefloor";
        }

        tmp.seats = cat_tickets.length ? cat_tickets.length : 0;
        tmp.price = cat_tickets[0]?.price;
        tmp.id = "ct_" + tmp.name;
        tmp.currency = cat_tickets[0]?.currency;
        if (tmp.img) {
          const parser = new DOMParser();
          const parsedDocument = parser.parseFromString(tmp.img, "text/html");
          //const svg_seats = parsedDocument.getElementsByTagName("path")
          const svg_seats = parsedDocument.getElementsByTagName("path");
          svg_seats[0].setAttribute("fill", tmp.color);
          var SvgToInsert = parsedDocument.getElementsByTagName("svg")[0];
          var s = new XMLSerializer();
          var str_svg = s.serializeToString(SvgToInsert);
          tmp.img = str_svg;
        }

        out.push(tmp);
      }

      setCategoriesF(out);
    }
  };
  useEffect(() => {
    build_totalC_V();
    makeUpCategoriesF();
  }, [tickets, stadiumData]);
  if (categoriesF.length === 0)
    return (
      <div className={"loading-screen"}>
        <div className="loader-wrapper-bg">
          <div className="loader-wrapper">
            <div className="loader">
              <div className="loader loader-inner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  const total = calculateTotal(cart, ScheduleFee, discount);
  return (
    <div className="w100 gap15 wrapper">
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        wheel={{ wheelDisabled: true }}>
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <div
            className={`df aic jcc chairs-container  ${
              activeSeat && "show-off"
            }`}
            style={{ cursor: cursor }}
            onMouseDown={closeModal}
            onTouchStart={closeModal}
            onTouchEndCapture={cancel}
            onDoubleClick={() => setZoom(zoom + 1)}>
            <>
              <Controls />
              <TransformComponent>
                <div className="ccc">
                  <div
                    className="df fdc aic gap10 chairs-body"
                    onClick={firstZoom}
                    onTouchEnd={firstZoom}
                    onTouchMove={firstZoom}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleUp}
                    style={{
                      transform: `scale(${mobile ? mobile + 0.02 : 1})`,
                    }}>
                    <SvgScheme
                      src={stadiumData["scheme"]}
                      categories={stadiumData["categories"]}
                      tickets={tickets}
                      currentCategory={currentCategory}
                      onSeatClick={addToCart}
                      categoriesF={categoriesF}
                      active={active}
                      tooltip={(data) => (
                        <SvgSchemeSeatPreview
                          className={s.preview}
                          categories={stadiumData["categories"]}
                          price="16$"
                          tickets={tickets}
                          categoriesF={categoriesF}
                          {...data}
                        />
                      )}
                    />
                  </div>
                </div>
              </TransformComponent>
            </>
          </div>
        )}
      </TransformWrapper>
      <div
        className="df fdc gap15 sidebar-filter"
        onClick={() => setOpenB(openB ? false : openB)}>
        <div className="w100 df aic jcsb">
          <p className="fs22">CATEGORIES:</p>
          {categoriesF[selected]?.old_price && (
            <p className="df aic gap5 fs12">
              <span style={{ color: "#aaa" }}>old price:</span>
              <span style={{ color: "#ddd", width: "47px" }}>new price:</span>
            </p>
          )}
        </div>
        <div className="w100 df fdc aic select-component">
          <div
            className={`w100 df aic gap10 cp component-label ${
              (open || selected) && "shadow-none"
            }`}
            onClick={() => setOpen(!open)}>
            <p className="df aic fs14 gap5">
              <span
                style={{ textTransform: "uppercase" }}
                className="df aic gap5 drop-down-title">
                {categoriesF[selected]?.img && (
                  <div
                    style={{ transform: "scale(0.95)" }}
                    dangerouslySetInnerHTML={{
                      __html: categoriesF[selected]?.img,
                    }}
                  />
                )}
                {categoriesF[selected]?.name}{" "}
              </span>{" "}
              <i
                className="fs12"
                style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
                {totalC_V?.totalLeft} <i>left</i>
              </i>
            </p>
            {selected === 0 ? (
              <i
                className="df aic fs12 gap5"
                style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
                {!mobile && "from"}
                <b className="fs14" style={{ color: "#F8F5EC" }}>
                  {totalC_V?.min} €
                </b>{" "}
                {!mobile && "to"}
                {mobile && <b>-</b>}
                <b className="fs14" style={{ color: "#F8F5EC" }}>
                  {totalC_V?.max} €
                </b>
              </i>
            ) : (
              <p
                className="df aic gap10"
                style={{
                  color: "#f8f5ec4d",
                  fontWeight: "bold",
                  width: "auto",
                }}>
                {categoriesF[selected]?.early_bird && (
                  <img src={birds} alt="birds" className="early-birds" />
                )}
                {categoriesF[selected]?.old_price && (
                  <del className="fs12">
                    {categoriesF[selected].old_price} €
                  </del>
                )}
                <b style={{ color: "#f8f5ec80" }} className="fs14 price">
                  {categoriesF[selected].price} €
                </b>
              </p>
            )}
          </div>
          <div className={`w100 df fdc component-body ${!open && "close"}`}>
            {categoriesF.map(
              (category, ind) =>
                categoriesF[selected].id !== category.id && (
                  <label
                    key={category.id}
                    className={`w100 df aic jcsb gap5 component-option ${
                      category?.type === "all" && "all"
                    }`}
                    onClick={() => {
                      actionCtgy(ind);
                      setSelected(ind);
                    }}
                    onMouseEnter={() => actionCtgy(ind)}
                    onMouseLeave={() => actionCtgy(selected)}>
                    <p className="df aife gap5 fs14">
                      <span
                        className="df aic gap5 drop-down-title option"
                        style={{ textTransform: "uppercase" }}>
                        <div
                          dangerouslySetInnerHTML={{ __html: category?.img }}
                        />
                        {category.name}{" "}
                      </span>
                      <i
                        className="fs12"
                        style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
                        {category.seats} left
                      </i>
                    </p>
                    <i
                      className="df aife gap10"
                      style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
                      {category?.early_bird && (
                        <img src={birds} alt="birds" className="early-birds" />
                      )}
                      {category?.old_price && (
                        <del className="fs12">
                          {category.old_price}{" "}
                          {currenciesSymbols[category?.currency]}
                        </del>
                      )}
                      <b
                        style={{
                          color: "#f8f5ec80",
                          width: "60px",
                          textAlign: "end",
                        }}
                        className="fs14">
                        {category.price}{" "}
                        {category.price &&
                          currenciesSymbols[category?.currency]}
                      </b>
                    </i>
                  </label>
                )
            )}
            {mobile && (
              <span
                className="df aic fs18 select-arrow"
                style={{ color: "#f8f5ec4d" }}
                onClick={() => setOpen(!open)}>
                {open ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </span>
            )}
          </div>
        </div>
        {!mobile && (
          <span
            className="df aic jcc fs18 cp mobile-arrow"
            style={{ color: "#f8f5ec4d" }}
            onClick={() => setOpen(!open)}>
            {open ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </span>
        )}
      </div>
      <div
        className={`df fdc basket-box ${mobile && openB && "open"}`}
        onClick={(e) => {
          if (e.target.tagName !== "BUTTON") {
            setOpenB(true);
          }
          console.log(e.target.tagName);
          if (e.target.tagName === "svg" || e.target.tagName === "LABEL") {
            setOpenB(!openB);
          }
          setOpen(open ? false : open);
        }}>
        <p className="w100 fs22">YOUR ORDER:</p>
        <div className="w100 df fdc aic gap25 basket-body">
          {getUniqueCategory(cart).length ? (
            getUniqueCategory(cart).map((category, ind) => {
              const seats = getSeats(cart, category);
              const ct = categoriesF?.find((x) => x.code_type === "Dancefloor");
              return (
                <div className="w100 df fdc gap10" key={`${category}_${ind}`}>
                  <div
                    className="w100 df aic jcsb basket-header"
                    style={{
                      borderBottom: `1px solid ${
                        categoriesF?.find((x) => x.name === category)?.color
                      }99`,
                      paddingBottom: "8px",
                    }}>
                    <p
                      className="df aic gap10 fs14"
                      style={{ textTransform: "uppercase" }}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: categoriesF?.find(
                            (el) => el.name === category
                          )?.img,
                        }}
                      />
                      {category}{" "}
                      <span
                        style={{ color: "#f8f5ec4d" }}
                        className="df aic gap10 fs12">
                        <RxCross2 className="fs9" />{" "}
                        {category === ct.value ? seats.length : seats.length}
                      </span>
                    </p>
                    <p className="df aic gap10 fs14">
                      {category === ct.value
                        ? seats
                            ?.reduce((acc, curr) => acc + curr?.price, 0)
                            ?.toFixed(2)
                        : seats
                            ?.reduce((acc, curr) => acc + curr?.price, 0)
                            ?.toFixed(2)}
                      {seats?.[0]?.currency || "€"}
                      <span
                        className="cp fs14 delete-btn"
                        onClick={() => {
                          deleteFromCart(category);
                        }}>
                        <RxCross2 className="fs12" />
                      </span>
                    </p>
                  </div>
                  <div className="w100 df fdc gap5">
                    {seats.map((seat, index) => {
                      if (category === ct.value) {
                        return (
                          index === 0 && (
                            <label
                              key={`${seat.seat}_${index}`}
                              className="w100 df aic jcsb basket-item">
                              <p
                                className="df aic gap10 fs14"
                                style={{ color: "#f8f5ec4d" }}>
                                Quantity:
                              </p>
                              <i
                                className="df aic gap10 fs10"
                                style={{ color: "#f8f5ec4d" }}>
                                <span className="cp fs14 delete-btn">
                                  <span className="df aic gap5">
                                    <RxMinus
                                      onClick={() => addToCart(seat, true)}
                                    />
                                    {seats.length}
                                    <RxPlus onClick={() => addToCart(seat)} />
                                  </span>
                                </span>
                              </i>
                            </label>
                          )
                        );
                      } else {
                        return (
                          <label
                            key={`${seat.seat}_${index}`}
                            className="w100 df aic jcsb basket-item">
                            <p
                              className="df aic gap10 fs14"
                              style={{ color: "#f8f5ec4d" }}>
                              <>
                                <span className="df aic gap10">
                                  Row:{" "}
                                  <span style={{ color: "#f8f5ec" }}>
                                    {seat.row}
                                  </span>
                                </span>
                                <span className="df aic gap10">
                                  Seat:{" "}
                                  <span style={{ color: "#f8f5ec" }}>
                                    {seat.seat}
                                  </span>
                                </span>
                              </>
                            </p>
                            <i
                              className="df aic gap10 fs10"
                              style={{ color: "#f8f5ec4d" }}>
                              <b>
                                {seat.price} {seat.currency || "€"}
                              </b>
                              <span className="cp fs14 delete-btn">
                                {/* onClick={() => addToCart(seat)} */}
                                <span>
                                  <RxCross2 className="fs12" />
                                </span>
                              </span>
                            </i>
                          </label>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <span style={{ color: "#aaa", margin: "auto" }} className="fs12">
              Select a ticket
            </span>
          )}
        </div>
        <PromoCode />
        <div className="w100 df fdc gap5 basket-footer">
          <div className="w100 df fdc gap5 price-info">
            <p className="w100 df aic jcsb price-info-mobile-title">
              <i className="fs14">Selected tickets:</i>
              <i className="fs14">
                <b>{total?.total || 0}</b>
              </i>
            </p>
            {discount > 0 && (
              <p className="w100 df aic jcsb fs10" style={{ color: "#53BC6B" }}>
                <span>PROMOCODE -{discount}%:</span>
                <i>
                  <b>-{total?.dis || 0} €</b>
                </i>
              </p>
            )}
            <p className="w100 df aic jcsb fs10" style={{ color: "#f8f5ec4d" }}>
              <span>transaction fee {(ScheduleFee * 1).toPrecision(2)}%:</span>
              <i>
                <b>{total?.fee || 0} €</b>
              </i>
            </p>
            <p className="w100 df aic jcsb">
              <i className="fs14">Total price:</i>
              <i className="fs14">
                <b>{total?.total || 0} €</b>
              </i>
            </p>
          </div>
          <button
            className={`w100 fs16 basket-btn ${
              getUniqueCategory(cart)?.length ? "active" : ""
            }`}
            id="buy-ticket"
            onClick={() => {
              if (getUniqueCategory(cart).length) setCartModal(true);
            }}>
            BUY TICKET
          </button>
        </div>
        <label
          className="df aic jcc gap5 fs12 cp basket-arrow"
          style={{ color: "#f8f5ec4d" }}>
          <img src={arrow} alt="icon" className={`img ${openB && "down"}`} />{" "}
          <label style={{ fontWeight: "bold" }}>MORE DETAILS</label>
        </label>
      </div>
      {cartModal && (
        <Suspense>
          <CartModal
            setOpen={setCartModal}
            open={cartModal}
            ScheduleFee={ScheduleFee}
            categoriesF={categoriesF}
          />
        </Suspense>
      )}
    </div>
  );
};
