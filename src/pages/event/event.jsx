import { useCallback, useState, useEffect, useMemo, Suspense, lazy, useRef } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import classNames from "classnames"
import { cn } from '@bem-react/classname'
import Button from "components/button";
import SvgScheme from "components/svg-scheme";
import TicketsCounter from "components/tickets-counter";
import CategorySelector from "components/category-selector";
import SeatingScheme from "components/seating-scheme";
import Countdown from "components/countdown/countdown";
import Cart from "components/cart/cart";
import CartModal from "components/modal/modal";
import birds from "images/EARLY BIRDS.svg";
import { ReactComponent as IconArrow } from 'icons/arrow.svg'
import { ReactComponent as IconArrowDouble } from 'icons/arrow_2_down.svg'
import { updateCart } from "api/cart";
import { getEventQuery } from "api/event";
import { useClickAway, useCountdown, useIsMobile, useLocalStorage } from "utils/hooks";
import { isEqualSeats } from "utils";
import { getFromLocalStorage } from "utils/common";
import { STORAGE_KEY_USER_EMAIL } from "const";
import './event.scss'



const bem = cn('event')

export default function Event() {
  const routeParams = useParams()
  const [searchParams] = useSearchParams()
  const id = routeParams.event_id || searchParams.get('event_id')
  const queryClient = useQueryClient()
  const { bookingExpired, bookingLimit, cart, cartByCategory, categories, config, scheme, tickets, event } = useOutletContext()
  const isMobile = useIsMobile()
  const [selectValue, setSelectValue] = useState(null)
  const [selectOpened, setSelectOpened] = useState(false)
  const [highlightCat, setHighlightCat] = useState(null)
  const [orderExpanded, setOrderExpanded] = useState(false)
  const [cartModal, setCartModal] = useState(false)

  const ref = useClickAway(() => setSelectOpened(false))

  useEffect(() => {
    setSelectOpened(!isMobile)
  }, [])

  useEffect(() => {
    if (selectOpened) {
      setOrderExpanded(false)
    }
  }, [selectOpened])

  useEffect(() => {
    if (!bookingExpired || !bookingExpired.length) return
    bookingExpired.forEach(item => updateCart(item, 0))
  }, [bookingExpired])

  const toggleInCart = useMutation({
    mutationFn: (item) => updateCart(item, Number(!item.inCart)),
    onMutate: async (ticket) => {
      const booking = ticket.inCart ? 0 : (bookingLimit || (Date.now() + 15 * 60 * 1000 + 59 * 1000))
      const queryKey = ['tickets', id]
      await queryClient.cancelQueries({ queryKey })
      const previousCart = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, items =>
        items.map(item => item.id === ticket.id ? {
          ...item, inCart: !item.inCart, bookingLimit: booking
        } : item)
      )
      return { previousCart }
    }
  })

  const clearCart = useCallback((queryKey) => {
    queryClient.resetQueries({ queryKey, exact: true })
  }, [])
  
  return (
    <div className={bem('layout')}>
      <div className={bem('scheme')}>
        <Countdown to={bookingLimit} className={bem('countdown')} />
        <SeatingScheme
          src={scheme}
          categories={categories}
          highlight={highlightCat || selectValue}
          cart={cartByCategory}
          tickets={tickets}
          toggleInCart={toggleInCart.mutate}
        />
      </div>
      <div className={classNames(bem('sidebar'), bem('categories'))} ref={ref}>
        <h2 className={bem('title')}>select a category:</h2>
        <CategorySelector
          defaultCurrency={config.currency}
          value={selectValue}
          options={categories}
          opened={selectOpened}
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
      <div className={classNames(bem('sidebar'), bem('order', { expanded: orderExpanded }))}>
        <button
          className={classNames(bem('toggleCart'), 'only-mobile')}
          onClick={() => {
            setOrderExpanded(!orderExpanded)
            setSelectOpened(false)
          }}
        >
          <IconArrowDouble style={{ width: 16 }} /> More details
        </button>
        <Cart
          categories={categories}
          cart={cartByCategory}
          toggleInCart={toggleInCart.mutate}
          setCartModal={setCartModal}
        />
      </div>
      {cartModal && (
        <Suspense>
          <CartModal
            setOpen={setCartModal}
            open={cartModal}
            ScheduleFee={event.fee * 1}
            categoriesF={categories}
            bookingLimit={bookingLimit}
            cart={cart}
            clearCart={clearCart}
          />
        </Suspense>
      )}
    </div>
  )
};
