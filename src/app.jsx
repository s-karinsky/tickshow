import React, { useState, useMemo, useRef, useImperativeHandle, Suspense, lazy } from "react";
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
  updateCart,
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
import { addDef, createCheckElement, svgSeat } from "./utils/dom-scheme.js";
import { useIsMobile, useLocalStorage } from "./utils/hooks.js";
import { group, isEqualSeats } from "./tools/utils.js";
import { useParams } from "react-router-dom";

let test = {"row:": "-1", "seat": "0"};

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

export const CHECK_PATH_ID = 'checked-seat-path'
const SEAT_CLASS = 'svg-seat'
const SEAT_CLASS_ACTIVE = `${SEAT_CLASS}-active`

const CartModal = lazy(() => import("./utility"));

const byCategory = group('category')

const addStyles = (el, styles) => Object.assign(el.style, styles);

export default function SvgSchemeTooltop({ for: el, className, children, scale, handleClick = null }) {
  const inverseScale = 1 / scale;
  const [styles, setStyles] = useState()
  const [seat, setSeat] = useState(null)

  useEffect(() => {
    const isElem = el instanceof Element;
    const isString = typeof el === "string";
    if (!isElem && !isString) {
      setStyles({ transform: `scale(${inverseScale})` });
      return;
    }
    const target = isElem ? el : document.querySelector(el);
    // first way with to use element position
    const category = target?.getAttribute("data-category");
    if (target && category !== "Dancefloor") {
      setSeat(target)
      const { x, y, } = target.getBBox();
      const scaledLeft = (x - 305) * scale;
      const scaledTop = (y + 13) * scale;

      const left = x - 240;
      const top = y + 118;
      setStyles({ position: "absolute", left: `${left}px`, top: `${top}px`, opacity: 1 });
    }
    // second way with to use mouse position by scale
    // const handleMouseMove = (event) => {
    //   const category = target?.getAttribute("data-category");
    //   if (target && category !== "Dancefloor") {
    //     const left = event.clientX - 410;
    //     const top = event.clientY - 30;
    //     setStyles({ position: "absolute", left: `${left}px`, top: `${top}px`, opacity: 1, transform: `scale(${inverseScale})` });
    //   }
    // };

    // document.addEventListener('mousemove', handleMouseMove);

    // return () => {
    //   document.removeEventListener('mousemove', handleMouseMove);
    // };
  }, [el, inverseScale]);
  return (
    <div className={s.svgSchemeTooltip + " " + className} style={styles} onClick={handleClick && seat ? () => handleClick({ target: seat }) : null}>
      {children}
    </div>
  );
}
const SvgScheme = forwardRef(
  (
    {
      categories = [],
      seatSelector = `.${SEAT_CLASS}`,
      src,
      tickets,
      cart,
      currentCategory = "all",
      tooltip,
      onSeatClick,
      onSeatOver,
      onSeatOut,
      categoriesF = [],
      active = "all",
      zoom = 1,
    },
    ref
  ) => {
    const innerRef = useRef(null)
    useImperativeHandle(ref, () => innerRef.current, [])

    // console.log("ON INPUT SVG_SCHEME:",!!tickets.find((x) => x?.row === test?.row && x?.seat === test?.seat))

    //console.log("POINT: SvgScheme-01 :", currentCategory)
    const [tooltipSeat, setTooltipSeat] = useState();
    const [refresh, setRefresh] = useState(false);
    const mobile = useIsMobile();
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

    const mobileOnlick = useCallback(
      (e) => {
        const { target: el } = e;
        if (!el.matches(seatSelector)) return;
        if (tooltip) setTooltipSeat(el);
        onSeatOut && onSeatOut(e);
      },
      [onSeatOut, seatSelector, tooltip]
    )

    const handleMouseOut = useCallback(
      (e) => {
        const { target: el } = e;
        if (!el.matches(seatSelector)) return;
        if (tooltip) setTooltipSeat(null);
        onSeatOut && onSeatOut(e);
      },
      [onSeatOut, seatSelector, tooltip]
    );

    useEffect(() => {
      const root = innerRef.current
      if (!root) return
      const cat = currentCategory === 'all' ? null : currentCategory
      addDef(root, CHECK_PATH_ID, createCheckElement())
      const ticketMap = tickets.reduce((acc, { seat, row, section }) =>
        ({ ...acc, [row === '-1' ? section : [row, seat].join('-')]: true })
      , {})
      const cartMap = (cart || []).reduce((acc, { seat, row, section }) =>
        ({ ...acc, [row === '-1' ? section : [row, seat].join('-')]: true })
      , {})
      Array.from(root.querySelectorAll(`.${SEAT_CLASS}`)).forEach(el => {
        const seat = svgSeat(el)
        const inCart = !!cartMap[seat.getKey()]
        seat.checked(inCart)
        const ticket = ticketMap[seat.getKey()]
        if (ticket && (!cat || cat === seat.get('category'))) {
          el.classList.add(SEAT_CLASS_ACTIVE)
          el.removeAttribute('data-disabled')
          //seat.set('disabled', 'false')
        } else {
          if ((!cat || cat === seat.get('category')) && inCart) {
            el.removeAttribute('data-disabled')
          } else {
            seat.set('disabled', 'true')
          }
        }
      })
    }, [cart, currentCategory])

    const styles = useMemo(() => {
      return categories.reduce(
        (acc, cat) => {
          acc += `
        .${SEAT_CLASS}[data-category="${cat.value}"] { fill: ${cat.color}; stroke: ${cat.color}; stroke-width: 0; transition: ease-out .3s stroke-width; }
        .${SEAT_CLASS}[data-category="${cat.value}"]:not([data-disabled]):hover { stroke-width: 2px; }
        .${SEAT_CLASS}-icon-cat-${cat.value} { color: ${cat.color}; }
        .${SEAT_CLASS}-bg-cat-${cat.value} { background-color: ${cat.color}; }
      `;
          return acc;
        },
        `
      .${SEAT_CLASS}:not([data-disabled]) { cursor: pointer; }
      .${SEAT_CLASS}[data-disabled] { fill: #666 !important; }
    `
      );
    }, [categories]);
    const eventHandlers = !mobile ? {
      onClick: handleClick,
      onMouseOver: handleMouseOver,
      onMouseOut: handleMouseOut
    } : {
      onClick: mobileOnlick
    };
    return (
      <div className={s.scheme} id="stage">
        {!!tooltip && (
          <SvgSchemeTooltop for={tooltipSeat} scale={zoom} handleClick={mobile ? handleClick : null}>
            {!!tooltipSeat && tooltip(Object.assign({}, tooltipSeat.dataset))}
          </SvgSchemeTooltop>
        )}
        <style>{styles}</style>
        <div
          ref={innerRef}
          className={s.svgContainer}
          dangerouslySetInnerHTML={{ __html: src }}
          {...eventHandlers}
        />
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
  mobile = false
}) {
  var currency = "€";
  var dancefloor_category_name = categoriesF.find(
    (cat) => cat.code_type === "Dancefloor"
  )?.value;
  var dancefloor_flag = false;

  var [ cart ] = useLocalStorage('cart', []);
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
        } style={
        item || (cat.value === dancefloor_category_name && dancefloor_flag) ? {} : suitableTicket ? {background:clr} : {}
      }>
        {item || (cat.value === dancefloor_category_name && dancefloor_flag) ? (
          <>
            <MdOutlineCheckCircle style={{ marginRight: "3px" }} />
            <span>Selected</span>
          </>
        ) : (
          <span>{suitableTicket ? (mobile ? "Tap to select" : "Click To Select") : "Seat not avaible"}</span>
        )}
      </div>
    </div>
  );
}

export const App = (factory, deps) => {
  const [activeSeat, setActiveSeat] = useState(null);
  //const cart = useMemo(() => {
  //  return JSON.parse(localStorage.getItem("cart")) || [];
  //}, [update]);
  const { id: schedule_id } = useParams()
  const [ cart, setCart ] = useLocalStorage(`cart-${schedule_id}`, [])
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

  const [tickets, setTickets] = useState([])
  const allTickets = useMemo(()=>{
    return [...tickets, ...cart]
  },[tickets])

  const [currentCategory, setCurrentCategory] = useState("all");
  const [ScheduleFee, setScheduleFee] = useState(0);
  const [LimitTime, setLimitTime] = useState();
  var { data, refetch } = useTickets({ event_id: schedule_id, skip: 0, limit: 30 }, {});

  useEffect(() => {
    if (data) {
      setTickets(data);
    } else {
      refetch({
        event_id: schedule_id,
        skip: 0,
        limit: 30,
      }).then((data) => {
        setTickets(data.data);
      });
    }
    LoadStadiumData();
  }, [LoadStadiumData, data]);

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

  useEffect( () => {
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
  },[])

  const toggleInCart = useCallback(async (item, count) => {
    const { seat, row, section, category: cat } = item
    const category = section || cat
    const isMultiple = row === '-1' || row === '0'
    const inCart = isMultiple ?
      cart.filter(item => item.section === category) :
      cart.find(item => isEqualSeats(item, { seat, row, category }))
    const ticket = isMultiple ?
      allTickets.filter(item => item.section === category) :
      allTickets.find(item => isEqualSeats(item, { seat, row, category }))
    if (!ticket) return Promise.resolve()

    if (isMultiple) {
      count = count === undefined ? inCart.length + 1 : count
      if (count < inCart.length) {
        const deleteCount = inCart.length - (count || 0)
        const toDelete = []
        setCart([ ...cart.filter(item => {
          if (item.section === category) {
            if (toDelete.length < deleteCount) {
              toDelete.push(item)
              return false
            }
          }
          return true
        }) ])
        return Promise.all(toDelete.map(item => updateCart(item, 0)))
      } else if (count > inCart.length) {
        const addCount = count - inCart.length
        const toAdd = ticket.slice(0, addCount)
        setCart([ ...cart, ...toAdd ])
        return Promise.all(toAdd.map(item => updateCart(item, 1)))
      }
    } else if (inCart) {
      setCart([ ...cart.filter(item => !isEqualSeats(item, inCart)) ])
    } else {
      setCart([...cart, ticket])
    }
    return updateCart(ticket, Number(!inCart)).then(res => {
      
    })
  }, [cart, allTickets])

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
        wheel={{ wheelDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <div
            className={`df aic jcc chairs-container  ${activeSeat && "show-off"}`}
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
                    }}
                  >
                    <SvgScheme
                      src={stadiumData["scheme"]}
                      categories={stadiumData["categories"]}
                      tickets={allTickets}
                      currentCategory={currentCategory}
                      onSeatClick={toggleInCart}
                      categoriesF={categoriesF}
                      active={active}
                      cart={cart}
                      zoom={zoom}
                      tooltip={(data) => (
                        <SvgSchemeSeatPreview
                          className={s.preview}
                          categories={stadiumData["categories"]}
                          price="16$"
                          tickets={allTickets}
                          categoriesF={categoriesF}
                          mobile={mobile}
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
            className={`w100 df aic gap10 cp component-label ${(open || selected) && "shadow-none"
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
                    className={`w100 df aic jcsb gap5 component-option ${category?.type === "all" && "all"}`}
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
        className={`df fdc basket-box ${mobile && openB ? "open" : ""}`}
        onClick={(e) => {
          if (e.target.tagName !== "BUTTON") {
            setOpenB(true);
          }
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
              const ct = categoriesF?.find((x) => x.code_type === "Dancefloor") ? categoriesF?.find((x) => x.code_type === "Dancefloor") : {value:""};
              return (
                <div className="w100 df fdc gap10" key={`${category}_${ind}`}>
                  <div
                    className="w100 df aic jcsb basket-header"
                    style={{
                      borderBottom: `1px solid ${categoriesF?.find((x) => x.name === category)?.color}99`,
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
                        className="df aic gap10 fs12"
                        onClick={() => cart.filter(item => item.section === category).map(toggleInCart)}
                      >
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
                          toggleInCart({ category, row: '-1' }, 0);
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
                                      onClick={() => toggleInCart(seat, seats.length - 1)}
                                    />
                                    {seats.length}
                                    <RxPlus onClick={() => toggleInCart(seat, seats.length + 1)} />
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
                                <button className="fs12l" onClick={() => toggleInCart(seat)}>
                                  <RxCross2 />
                                </button>
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
                <b>{total?.qty || 0}</b>
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
            className={`w100 fs16 basket-btn ${getUniqueCategory(cart)?.length ? "active" : ""}`}
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
