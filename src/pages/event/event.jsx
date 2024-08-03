import { useCallback, useState, useEffect, useMemo, Suspense, lazy, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import birds from "images/EARLY BIRDS.svg";
import { isEqualSeats } from "utils";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEventQuery } from "api/event";

import classNames from "classnames"
import { cn } from '@bem-react/classname'
import Button from "components/button";
import SvgScheme from "components/svg-scheme";
import TicketsCounter from "components/tickets-counter";
import CategorySelector from "components/category-selector";
import SeatingScheme from "components/seating-scheme";
import { useCountdown, useIsMobile, useLocalStorage } from "utils/hooks";
import { ReactComponent as IconArrow } from 'icons/arrow.svg'
import { updateCart } from "api/cart";
import './event.scss'
import Countdown from "components/countdown/countdown";
import { getFromLocalStorage } from "utils/common";
import { STORAGE_KEY_USER_EMAIL } from "const";
import Cart from "components/cart";

const bem = cn('event')

export default function Event() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { bookingExpired, bookingLimit, cart, categories, config, scheme, tickets, event } = useOutletContext()
  const isMobile = useIsMobile()
  const [ selectValue, setSelectValue ] = useState(null)
  const [ selectOpened, setSelectOpened ] = useState(!isMobile)
  const [ highlightCat, setHighlightCat ] = useState(null)

  useEffect(() => {
    if (!bookingExpired || !bookingExpired.length) return
    bookingExpired.forEach(item => updateCart(item, 0))
  }, [bookingExpired])

  const toggleInCart = useMutation({
    mutationFn: (item) => updateCart(item, Number(!item.inCart)),
    onMutate: async (ticket) => {
      const queryKey = ['tickets', id]
      await queryClient.cancelQueries({ queryKey })
      const previousCart = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, items =>  console.log(items, ticket) ||
        items.map(item => item.id === ticket.id ? { ...item, inCart: !item.inCart } : item)
      )
      return { previousCart }
    }
  })
  console.log(cart);
  
  return (
    <div className={bem('layout')}>
      <div className={bem('scheme')}>
        {!!bookingLimit && <Countdown to={bookingLimit} className={bem('countdown')} />}
        <SeatingScheme
          src={scheme}
          categories={categories}
          highlight={highlightCat || selectValue}
          cart={cart}
          tickets={tickets}
          toggleInCart={toggleInCart.mutate}
        />
      </div>
      <div className={classNames(bem('sidebar'), bem('categories'))}>
        <h2 className={bem('title')}>select a category:</h2>
        <CategorySelector
          defaultCurrency={config.currency}
          value={selectValue}
          options={categories}
          opened={selectOpened}
          setOpened={setSelectOpened}
          onChange={(val) => {
            if (selectOpened) setSelectValue(val)
              setSelectOpened(!selectOpened)
          }}
          onMouseOver={(e, val) => setHighlightCat(val.value)}
          onMouseOut={() => setHighlightCat(null)}
        />
        <Button
          color='ghost'
          className={bem('toggle-cat', { opened: selectOpened })}
          onClick={() => setSelectOpened(!selectOpened)}
        >
          <IconArrow />
        </Button>
      </div>
      <div className={classNames(bem('sidebar'), bem('order'))}>
        <h2 className={bem('title')}>Your order:</h2>
        <div className={bem('delimiter')} />
        <Cart
          categories={categories}
          cart={cart}
          toggleInCart={toggleInCart.mutate}
        />
      </div>
    </div>
  )
  // 

  // const [stadiumData, setStadiumData] = useState({})
  // const [stadiumDataReceived, setStadiumDataReceived] = useState(false)

  // const isMobile = useIsMobile()
  // // Выбранная категория
  // const [selected, setSelected] = useState(0)
  // const discount = 0
  // const [tickets, setTickets] = useState([])

  // // ------------------------------------------------------- //
  // // Видимость оверлея для блокировки событий схемы. Нужен для перехвата клика
  // // при маленьком масштабе
  // const [showSchemeOverlay, setShowSchemeOverlay] = useState(false)

  // // Состояние блоков с билетами и категории на мобиле
  // const [open, setOpen] = useState(false)
  // const [openB, setOpenB] = useState(false)
  // const [cartModal, setCartModal] = useState(false)

  // const [zoom, setZoom] = useState(0)
  // // Список уникльных категорий
  // let [categoriesF, setCategoriesF] = useState([])
  
  // const [currentCategory, setCurrentCategory] = useState("all")
  // const [ScheduleFee, setScheduleFee] = useState(0)
  // const [LimitTime, setLimitTime] = useState()
  // const { data, isLoading: isTicketsLoading } = useTickets({ event_id: schedule_id, skip: 0, limit: 30 }, {})

  // useEffect(() => {
  //   if (isTicketsLoading || !data) return
  //   setTickets([...data, ...cart])
  //   LoadStadiumData()
  // }, [isTicketsLoading])

  // useEffect(() => {
  //   const updateZoom = () => {
  //     const stageElement = document.getElementById("stage");
  //     if (stageElement) {
  //       const c_w = stageElement.clientWidth;
  //       const s = calculateScale(c_w, c_w);
  //       // setMobile(s);
  //     }
  //   };
  //   updateZoom();
  //   window.addEventListener("resize", updateZoom);
  //   return () => window.removeEventListener("resize", updateZoom);
  // }, [categoriesF.length]);

  // useEffect(() => {
  //   if (!LimitTime) {
  //     GetLimitTime().then((data) => {
  //       setLimitTime(data);
  //     });
  //   }
  //   if (!localStorage.getItem("phantom_user_token")) {
  //     RegisterPhantomUser().then((email) => {
  //       localStorage.setItem("phantom_user_email", email);
  //       AuthUser(email).then((phantom_auth_data) => {
  //         localStorage.setItem("phantom_user_token", phantom_auth_data.token);
  //         localStorage.setItem("phantom_user_u_hash", phantom_auth_data.u_hash);
  //       });
  //     });
  //   }
  // }, [])

  // const initialZoom = useRef(0)

  // const toggleInCart = useCallback(async (item, count) => {
  //   const { seat, row, section, category: cat } = item
  //   // Мешанина с category и section, как-то так вышло что одно значение в разных
  //   // местах называется по-разному. Пока такой хак дешевле, чем приводить все к одному виду
  //   const category = section || cat
  //   // Проверка на категорию без мест
  //   const isSeatWithoutNumber = row === '-1' || row === '0'
  //   // Для обычного места ищем билет в корзине, для категории без мест - все билеты
  //   const inCart = isSeatWithoutNumber ?
  //     cart.filter(item => item.section === category) :
  //     cart.find(item => isEqualSeats(item, { seat, row, category }))
  //   // Аналогично ищем билеты в наличии
  //   const ticket = isSeatWithoutNumber ?
  //     tickets.filter(item => item.section === category) :
  //     tickets.find(item => isEqualSeats(item, { seat, row, category }))
  //   if (!ticket) return Promise.resolve()
  //   // Для категории без мест используем аргумент count как абсолютное количество билетов,
  //   // которое должно быть в корзине. Если count не передан, то добавляем или удаляем один билет
  //   if (isSeatWithoutNumber) {
  //     count = count === undefined ? inCart.length + 1 : count
  //     if (count < inCart.length) {
  //       // Если в корзине больше билетов, чем нужно, удаляем лишние
  //       const deleteCount = inCart.length - (count || 0)
  //       const toDelete = []
  //       setCart([...cart.filter(item => {
  //         if (item.section === category) {
  //           if (toDelete.length < deleteCount) {
  //             toDelete.push(item)
  //             return false
  //           }
  //         }
  //         return true
  //       })])
  //       setTickets([...tickets, ...toDelete])
  //       return Promise.all(toDelete.map(item => updateCart(item, 0)))
  //     } else if (count > inCart.length) {
  //       // Если меньше - добавляем недостающие
  //       const addCount = count - inCart.length
  //       const toAdd = ticket.slice(0, addCount)
  //       setCart([...cart, ...toAdd])
  //       return Promise.all(toAdd.map(item => updateCart(item, 1)))
  //     }
  //   } else if (inCart) {
  //     // Обычное место в корзине удаляем
  //     setTickets([...tickets, inCart])
  //     setCart([...cart.filter(item => !isEqualSeats(item, inCart))])
  //   } else {
  //     // Или, если не в корзине, добавляем
  //     setCart([...cart, ticket])
  //   }
  //   return updateCart(ticket, Number(!inCart))
  // }, [cart, tickets])

  // const Controls = () => {
  //   const { zoomIn, zoomOut, resetTransform } = useControls();
  //   return (
  //     <>
  //       {" "}
  //       <div className="df aic zoom-box cp">
  //         <button
  //           className="df aic jcc fs18"
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             zoomOut();
  //           }}>
  //           <RiZoomOutLine />
  //         </button>
  //         <button
  //           className="df aic jcc fs18"
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             zoomIn();
  //           }}>
  //           <RiZoomInLine />
  //         </button>
  //       </div>
  //       {cart.length !== 0 && (
  //         <div className="df aic jcc gap10 zoom-box time-box" id="action">
  //           <MdOutlineAccessTime className="fs18" />
  //           <span className="timer-text">Time left to place your
  //             order:{" "}</span>
  //           {
  //             <CountdownTimer
  //               initialTime={LimitTime}
  //               action={() => {
  //                 var cart_tickets = cart;
  //                 var new_tickets = {};
  //                 for (var i = 0; i < cart_tickets.length; i++) {
  //                   if (!new_tickets[cart_tickets[i].t_id]) {
  //                     new_tickets[cart_tickets[i].t_id] = [];
  //                   }
  //                   new_tickets[cart_tickets[i].t_id].push(
  //                     cart_tickets[i].hall_id +
  //                     ";" +
  //                     cart_tickets[i].section +
  //                     ";" +
  //                     cart_tickets[i].row +
  //                     ";" +
  //                     cart_tickets[i].seat
  //                   );
  //                 }
  //                 var token = localStorage.getItem("phantom_user_token");
  //                 var u_hash = localStorage.getItem("phantom_user_u_hash");
  //                 ClearSeats(token, u_hash, new_tickets).then((res) => {
  //                   //console.log("Clearing Seats ",res)
  //                 });
  //                 setCart([]);
  //               }}
  //             />
  //           }
  //         </div>
  //       )}
  //       {(zoom > initialZoom.current || categoriesF[selected].type !== "all") && (
  //         <div
  //           className="df aic jcc back-btn cp"
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             setOpen(false);
  //             resetTransform();
  //             setCurrentCategory("all");
  //             setSelected(0);
  //           }}
  //           id="action">
  //           <button className="df aic jcc fs18">
  //             <RiArrowGoBackLine />
  //           </button>
  //         </div>
  //       )}
  //       {categoriesF[selected].type !== "all" && !isMobile && (
  //         <span
  //           className="df aic jcc fs12 cp bottom-back-btn"
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             setSelected(0);
  //             setCurrentCategory("all");
  //             setOpen(false);
  //           }}
  //           id="action">
  //           BACK TO ALL <br /> CATEGORIES
  //         </span>
  //       )}
  //     </>
  //   );
  // };

  // const actionCtgy = (s) => {
  //   if (categoriesF[s].id === "ct_all") {
  //     setCurrentCategory("all");
  //   } else {
  //     setCurrentCategory(categoriesF[s].name);
  //   }
  // };

  // const [totalC_V, setTotalC_V] = useState({});

  // //
  // const build_totalC_V = () => {
  //   if (!tickets || tickets?.length === 0) return;
  //   var prices = [];
  //   for (const t of tickets) {
  //     prices.push(t["price"]);
  //   }
  //   setTotalC_V({
  //     totalLeft: tickets.length,
  //     min: prices.reduce((a, b) => Math.min(a, b)),
  //     max: prices.reduce((a, b) => Math.max(a, b)),
  //   });
  // };
  // function LoadStadiumData() {
  //   return stadiumDataReceived ?
  //     Promise.resolve() :
  //     GetStadium(schedule_id).then((stadium_data) => {
  //       GetStadiumScheme(stadium_data["stadium"]["scheme_blob"]).then(
  //         (stadium_scheme) => {
  //           if (!stadiumDataReceived) {
  //             setScheduleFee(stadium_data.schedule.fee * 1)
  //             setStadiumData(stadium_scheme)
  //             setStadiumDataReceived(true)
  //           }
  //         }
  //       )
  //     })
  // }
  // const makeUpCategoriesF = () => {
  //   if (!tickets) {
  //     return;
  //   }
  //   var out = [];
  //   if (stadiumDataReceived) {
  //     out.push({
  //       id: "ct_all",
  //       name: "ALL CATEGORIES",
  //       seats: totalC_V.totalLeft,
  //       price: "",
  //       old_price: "",
  //       currency: "€",
  //       type: "all",
  //       early_bird: false,
  //       color: "#80ed99",
  //     });

  //     for (var i = 0; i < stadiumData["categories"].length; i++) {
  //       var cat = stadiumData["categories"][i];
  //       var tmp = {
  //         id: undefined,
  //         name: cat.label,
  //         value: cat.value,
  //         seats: undefined,
  //         price: undefined,
  //         old_price: undefined,
  //         currency: "€",
  //         type: "chair",
  //         early_bird: true,
  //         color: cat.color,
  //         img: cat.icon,
  //         code_type: undefined,
  //       };
  //       var cat_tickets = tickets?.filter(
  //         (ticket) => ticket.section === cat.value
  //       );

  //       var flag = true;
  //       for (var j = 0; j < cat_tickets.length; j++) {
  //         if (
  //           cat_tickets[j].row.toString() !== "-1" &&
  //           cat_tickets[j].row.toString() !== "0"
  //         ) {
  //           flag = false;
  //           break;
  //         }
  //       }
  //       if (flag && cat_tickets.length > 0) {
  //         tmp.code_type = "Dancefloor";
  //       }

  //       tmp.seats = cat_tickets.length ? cat_tickets.length : 0;
  //       tmp.price = cat_tickets[0]?.price;
  //       tmp.id = "ct_" + tmp.name;
  //       tmp.currency = cat_tickets[0]?.currency;
  //       if (tmp.img) {
  //         const parser = new DOMParser();
  //         const parsedDocument = parser.parseFromString(tmp.img, "text/html");
  //         //const svg_seats = parsedDocument.getElementsByTagName("path")
  //         const svg_seats = parsedDocument.getElementsByTagName("path");
  //         svg_seats[0].setAttribute("fill", tmp.color);
  //         var SvgToInsert = parsedDocument.getElementsByTagName("svg")[0];
  //         var s = new XMLSerializer();
  //         var str_svg = s.serializeToString(SvgToInsert);
  //         tmp.img = str_svg;
  //       }

  //       out.push(tmp);
  //     }

  //     setCategoriesF(out);
  //   }
  // };
  // useEffect(() => {
  //   build_totalC_V();
  //   makeUpCategoriesF();
  // }, [tickets, stadiumData])

  // const [touchDownPos, setTouchDownPos] = useState()


  // const nonSeats = useMemo(() => {
  //   if (!stadiumData || !stadiumData["scheme"]) return
  //   const parser = new DOMParser()
  //   const dom = parser.parseFromString(stadiumData["scheme"], "text/html")
  //   return Array.from(dom.querySelectorAll(['*[data-category][data-count]'])).map(el => el.getAttribute('data-category'))
  // }, [stadiumData])

  // // if (!isReady) {
  // if (categoriesF.length === 0) {
  //   return (
  //     <div className={"loading-screen"}>
  //       <div className="loader-wrapper-bg">
  //         <div className="loader-wrapper">
  //           <div className="loader">
  //             <div className="loader loader-inner"></div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }
  // const total = calculateTotal(cart, ScheduleFee, discount)

  // return (
  //   <div className="w100 gap15 wrapper">
  //     <TransformWrapper
  //       wheel={{
  //         activationKeys: ['Control'],
  //         step: 0.25
  //       }}
  //       doubleClick={{
  //         disabled: true
  //       }}
  //       panning={{
  //         excluded: ['scheme-overlay']
  //         // lockAxisY: isMobile
  //       }}
  //       onInit={ref => {
  //         ref.zoomToElement(schemeRef.current, undefined, 0)
  //         initialZoom.current = ref.state.scale
  //       }}
  //       onTransformed={({ state }) => {
  //         setShowSchemeOverlay(state.scale < 1.3)
  //         if (Math.abs(state.scale - zoom) > 0.01) setZoom(state.scale)
  //       }}
  //       onPanningStart={({ instance, state }) => {
  //         setTouchDownPos({ x: state.positionX, y: state.positionY })
  //         const el = instance.contentComponent.firstChild
  //         el.style.cursor = 'grabbing'
  //       }}
  //       onPanningStop={({ instance, state }, e) => {
  //         const pos = { x: state.positionX, y: state.positionY }
  //         if (touchDownPos && (Math.abs(pos.x - touchDownPos.x) > 5 || Math.abs(pos.y - touchDownPos.y) > 5)) {
  //           e.preventDefault()
  //           setTouchDownPos(null)
  //         }
  //         const el = instance.contentComponent.firstChild
  //         el.style.cursor = 'grab'
  //       }}
  //     >
  //       {({ zoomToElement, setTransform }) => (
  //         <div className={bem('df', 'aic', 'jcc', 'chairs-container')}>
  //           <Controls />
  //           <TransformComponent>
  //             {nonSeats.map((category) => (
  //               <TicketsCounter
  //                 key={category}
  //                 name={category}
  //                 value={cart.filter(x => x.section === category).length}
  //                 count={tickets.filter(x => x.section === category).length}
  //                 onChange={toggleInCart}
  //               />
  //             ))}
  //             <div className="ccc" style={{ cursor: 'grab' }}>
  //               <div
  //                 className="df fdc aic gap10 chairs-body"
  //                 style={{ position: 'relative' }}
  //               >
  //                 {showSchemeOverlay && <div
  //                   className="scheme-overlay"
  //                   onClick={() => !isMobile && zoomToElement(schemeRef.current)}
  //                   onTouchEnd={e => {
  //                     const diffScale = MAX_SCALE - initialZoom.current
  //                     const rect = e.target.getBoundingClientRect()
  //                     const touchLeft = e.changedTouches[0]?.clientX
  //                     const touchTop = e.changedTouches[0]?.clientY
  //                     const [x, y] = [rect.x - touchLeft, rect.y - touchTop].map(v => v * diffScale)
  //                     setTransform(x, y - window.innerHeight, MAX_SCALE)
  //                   }}
  //                 />}
  //                 <SvgScheme
  //                   ref={schemeRef}
  //                   src={stadiumData["scheme"]}
  //                   categories={stadiumData["categories"]}
  //                   tickets={tickets}
  //                   currentCategory={currentCategory}
  //                   onSeatClick={toggleInCart}
  //                   cart={cart}
  //                   tooltip={(data) => (
  //                     <SvgSchemeSeatPreview
  //                       className="svg-seat-preview"
  //                       categories={stadiumData["categories"]}
  //                       tickets={tickets}
  //                       cart={cart}
  //                       mobile={isMobile}
  //                       toggleInCart={toggleInCart}
  //                       {...data}
  //                     />
  //                   )}
  //                 />
  //               </div>
  //             </div>
  //           </TransformComponent>
  //         </div>
  //       )}
  //     </TransformWrapper>
  //     <div
  //       className="df fdc gap15 sidebar-filter"
  //       onClick={() => setOpenB(openB ? false : openB)}>
  //       <div className="w100 df aic jcsb">
  //         <p className="fs22">CATEGORIES:</p>
  //         {categoriesF[selected]?.old_price && (
  //           <p className="df aic gap5 fs12">
  //             <span style={{ color: "#aaa" }}>old price:</span>
  //             <span style={{ color: "#ddd", width: "47px" }}>new price:</span>
  //           </p>
  //         )}
  //       </div>
  //       <div className="w100 df fdc aic select-component">
  //         <div
  //           className={`w100 df aic gap10 cp component-label ${(open || selected) && "shadow-none"
  //             }`}
  //           onClick={() => setOpen(!open)}>
  //           <p className="df aic fs14 gap5">
  //             <span
  //               style={{ textTransform: "uppercase" }}
  //               className="df aic gap5 drop-down-title">
  //               {categoriesF[selected]?.img && (
  //                 <div
  //                   style={{ transform: "scale(0.95)" }}
  //                   dangerouslySetInnerHTML={{
  //                     __html: categoriesF[selected]?.img,
  //                   }}
  //                 />
  //               )}
  //               {categoriesF[selected]?.name}{" "}
  //             </span>{" "}
  //             <i
  //               className="fs12"
  //               style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
  //               {totalC_V?.totalLeft} <i>left</i>
  //             </i>
  //           </p>
  //           {selected === 0 ? (
  //             <i
  //               className="df aic fs12 gap5"
  //               style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
  //               {!isMobile && "from"}
  //               <b className="fs14" style={{ color: "#F8F5EC" }}>
  //                 {totalC_V?.min} €
  //               </b>{" "}
  //               {!isMobile && "to"}
  //               {isMobile && <b>-</b>}
  //               <b className="fs14" style={{ color: "#F8F5EC" }}>
  //                 {totalC_V?.max} €
  //               </b>
  //             </i>
  //           ) : (
  //             <p
  //               className="df aic gap10"
  //               style={{
  //                 color: "#f8f5ec4d",
  //                 fontWeight: "bold",
  //                 width: "auto",
  //               }}>
  //               {categoriesF[selected]?.early_bird && (
  //                 <img src={birds} alt="birds" className="early-birds" />
  //               )}
  //               {categoriesF[selected]?.old_price && (
  //                 <del className="fs12">
  //                   {categoriesF[selected].old_price} €
  //                 </del>
  //               )}
  //               <b style={{ color: "#f8f5ec80" }} className="fs14 price">
  //                 {categoriesF[selected].price} €
  //               </b>
  //             </p>
  //           )}
  //         </div>
  //         <div
  //           className={bem('catListWrapper', {
  //             'open': open
  //           })}
  //         >
  //           <div className={bem('w100', 'df', 'fdc', 'component-body')}>
  //             {categoriesF.map(
  //               (category, ind) =>
  //                 categoriesF[selected].id !== category.id && (
  //                   <label
  //                     key={category.id}
  //                     className={`w100 df aic jcsb gap5 component-option ${category?.type === "all" && "all"}`}
  //                     onClick={() => {
  //                       actionCtgy(ind);
  //                       setSelected(ind);
  //                     }}
  //                     onMouseEnter={() => actionCtgy(ind)}
  //                     onMouseLeave={() => actionCtgy(selected)}>
  //                     <p className="df aife gap5 fs14">
  //                       <span
  //                         className="df aic gap5 drop-down-title option"
  //                         style={{ textTransform: "uppercase" }}>
  //                         <div
  //                           dangerouslySetInnerHTML={{ __html: category?.img }}
  //                         />
  //                         {category.name}{" "}
  //                       </span>
  //                       <i
  //                         className="fs12"
  //                         style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
  //                         {category.seats} left
  //                       </i>
  //                     </p>
  //                     <i
  //                       className="df aife gap10"
  //                       style={{ color: "#f8f5ec4d", fontWeight: "bold" }}>
  //                       {category?.early_bird && (
  //                         <img src={birds} alt="birds" className="early-birds" />
  //                       )}
  //                       {category?.old_price && (
  //                         <del className="fs12">
  //                           {category.old_price}{" "}
  //                           {CURRENCY_SYMBOL_MAP[category?.currency]}
  //                         </del>
  //                       )}
  //                       <b
  //                         style={{
  //                           color: "#f8f5ec80",
  //                           width: "60px",
  //                           textAlign: "end",
  //                         }}
  //                         className="fs14">
  //                         {category.price}{" "}
  //                         {category.price &&
  //                           CURRENCY_SYMBOL_MAP[category?.currency]}
  //                       </b>
  //                     </i>
  //                   </label>
  //                 )
  //             )}
  //           </div>
  //         </div>
  //         {isMobile && (
  //           <div
  //             className="df aic fs18 select-arrow"
  //             style={{ color: "#f8f5ec4d" }}
  //             onClick={() => setOpen(!open)}>
  //             {open ? <IoIosArrowUp /> : <IoIosArrowDown />}
  //           </div>
  //         )}
  //       </div>
  //       {!isMobile && (
  //         <span
  //           className="df aic jcc fs18 cp mobile-arrow"
  //           style={{ color: "#f8f5ec4d" }}
  //           onClick={() => setOpen(!open)}>
  //           {open ? <IoIosArrowUp /> : <IoIosArrowDown />}
  //         </span>
  //       )}
  //     </div>
  //     <div
  //       className={`df fdc basket-box ${isMobile && openB ? "open" : ""}`}
  //       onClick={(e) => {
  //         if (e.target.tagName !== "BUTTON") {
  //           setOpenB(true);
  //         }
  //         if (e.target.tagName === "svg" || e.target.tagName === "LABEL") {
  //           setOpenB(!openB);
  //         }
  //         setOpen(open ? false : open);
  //       }}>
  //       <p className="w100 fs22">YOUR ORDER:</p>
  //       <div className="w100 df fdc aic gap25 basket-body">
  //         {getUniqueCategory(cart).length ? (
  //           getUniqueCategory(cart).map((category, ind) => {
  //             const seats = getSeats(cart, category);
  //             const ct = categoriesF?.find((x) => x.code_type === "Dancefloor") ? categoriesF?.find((x) => x.code_type === "Dancefloor") : { value: "" };
  //             return (
  //               <div className="w100 df fdc gap10" key={`${category}_${ind}`}>
  //                 <div
  //                   className="w100 df aic jcsb basket-header"
  //                   style={{
  //                     borderBottom: `1px solid ${categoriesF?.find((x) => x.name === category)?.color}99`,
  //                     paddingBottom: "8px",
  //                   }}>
  //                   <p
  //                     className="df aic gap10 fs14"
  //                     style={{ textTransform: "uppercase" }}>
  //                     <div
  //                       dangerouslySetInnerHTML={{
  //                         __html: categoriesF?.find(
  //                           (el) => el.name === category
  //                         )?.img,
  //                       }}
  //                     />
  //                     {category}{" "}
  //                     <span
  //                       style={{ color: "#f8f5ec4d" }}
  //                       className="df aic gap10 fs12"
  //                       onClick={() => cart.filter(item => item.section === category).map(toggleInCart)}
  //                     >
  //                       <RxCross2 className="fs9" />{" "}
  //                       {category === ct.value ? seats.length : seats.length}
  //                     </span>
  //                   </p>
  //                   <p className="df aic gap10 fs14">
  //                     {category === ct.value
  //                       ? seats
  //                         ?.reduce((acc, curr) => acc + curr?.price, 0)
  //                         ?.toFixed(2)
  //                       : seats
  //                         ?.reduce((acc, curr) => acc + curr?.price, 0)
  //                         ?.toFixed(2)}
  //                     {seats?.[0]?.currency || "€"}
  //                     <span
  //                       className="cp fs14 delete-btn"
  //                       onClick={() => {
  //                         toggleInCart({ category, row: '-1' }, 0);
  //                       }}>
  //                       <RxCross2 className="fs12" />
  //                     </span>
  //                   </p>
  //                 </div>
  //                 <div className="w100 df fdc gap5">
  //                   {seats.map((seat, index) => {
  //                     if (category === ct.value) {
  //                       return (
  //                         index === 0 && (
  //                           <label
  //                             key={`${seat.seat}_${index}`}
  //                             className="w100 df aic jcsb basket-item">
  //                             <p
  //                               className="df aic gap10 fs14"
  //                               style={{ color: "#f8f5ec4d" }}>
  //                               Quantity:
  //                             </p>
  //                             <i
  //                               className="df aic gap10 fs10"
  //                               style={{ color: "#f8f5ec4d" }}>
  //                               <span className="cp fs14 delete-btn">
  //                                 <span className="df aic gap5">
  //                                   <RxMinus
  //                                     onClick={() => toggleInCart(seat, seats.length - 1)}
  //                                   />
  //                                   {seats.length}
  //                                   <RxPlus onClick={() => toggleInCart(seat, seats.length + 1)} />
  //                                 </span>
  //                               </span>
  //                             </i>
  //                           </label>
  //                         )
  //                       );
  //                     } else {
  //                       return (
  //                         <label
  //                           key={`${seat.seat}_${index}`}
  //                           className="w100 df aic jcsb basket-item">
  //                           <p
  //                             className="df aic gap10 fs14"
  //                             style={{ color: "#f8f5ec4d" }}>
  //                             <>
  //                               <span className="df aic gap10">
  //                                 Row:{" "}
  //                                 <span style={{ color: "#f8f5ec" }}>
  //                                   {seat.row}
  //                                 </span>
  //                               </span>
  //                               <span className="df aic gap10">
  //                                 Seat:{" "}
  //                                 <span style={{ color: "#f8f5ec" }}>
  //                                   {seat.seat}
  //                                 </span>
  //                               </span>
  //                             </>
  //                           </p>
  //                           <i
  //                             className="df aic gap10 fs10"
  //                             style={{ color: "#f8f5ec4d" }}>
  //                             <b>
  //                               {seat.price} {seat.currency || "€"}
  //                             </b>
  //                             <span className="cp fs14 delete-btn">
  //                               {/* onClick={() => addToCart(seat)} */}
  //                               <button className="fs12l" onClick={() => toggleInCart(seat)}>
  //                                 <RxCross2 />
  //                               </button>
  //                             </span>
  //                           </i>
  //                         </label>
  //                       );
  //                     }
  //                   })}
  //                 </div>
  //               </div>
  //             );
  //           })
  //         ) : (
  //           <span style={{ color: "#aaa", margin: "auto" }} className="fs12">
  //             Select a ticket
  //           </span>
  //         )}
  //       </div>
  //       <PromoCode />
  //       <div className="w100 df fdc gap5 basket-footer">
  //         <div className="w100 df fdc gap5 price-info">
  //           <p className="w100 df aic jcsb price-info-mobile-title">
  //             <i className="fs14">Selected tickets:</i>
  //             <i className="fs14">
  //               <b>{total?.qty || 0}</b>
  //             </i>
  //           </p>
  //           {discount > 0 && (
  //             <p className="w100 df aic jcsb fs10" style={{ color: "#53BC6B" }}>
  //               <span>PROMOCODE -{discount}%:</span>
  //               <i>
  //                 <b>-{total?.dis || 0} €</b>
  //               </i>
  //             </p>
  //           )}
  //           <p className="w100 df aic jcsb fs10" style={{ color: "#f8f5ec4d" }}>
  //             <span>transaction fee {(ScheduleFee * 1).toPrecision(2)}%:</span>
  //             <i>
  //               <b>{total?.fee || 0} €</b>
  //             </i>
  //           </p>
  //           <p className="w100 df aic jcsb">
  //             <i className="fs14">Total price:</i>
  //             <i className="fs14">
  //               <b>{total?.total || 0} €</b>
  //             </i>
  //           </p>
  //         </div>
  //         <Button
  //           color='bordered'
  //           size='large'
  //           className={'buy-btn'}
  //           disabled={!getUniqueCategory(cart)?.length}
  //         >
  //           BUY TICKET
  //         </Button>
  //       </div>
  //       <label
  //         className="df aic jcc gap5 fs12 cp basket-arrow"
  //         style={{ color: "#f8f5ec4d" }}>
  //         <img src={arrow} alt="icon" className={`img ${openB && "down"}`} />{" "}
  //         <label style={{ fontWeight: "bold" }}>MORE DETAILS</label>
  //       </label>
  //     </div>
  //     {cartModal && (
  //       <Suspense>
  //         <CartModal
  //           setOpen={setCartModal}
  //           open={cartModal}
  //           ScheduleFee={ScheduleFee}
  //           categoriesF={categoriesF}
  //         />
  //       </Suspense>
  //     )}
  //   </div>
  // );
};
