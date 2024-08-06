import { useMemo } from 'react'
import classNames from 'classnames'
import { cn } from '@bem-react/classname'
import { ReactComponent as Close } from 'icons/close.svg'
import { ReactComponent as ArrowRight } from 'icons/arrow_right.svg'
import Button from 'components/button'
import './cart.scss'

const bem = cn('cart')

export default function Cart({ cart, categories, toggleInCart, setCartModal }) {
  const total = useMemo(() => Object.values(cart).reduce((acc, { sum }) => acc + sum, 0), [cart])
  const totalCount = useMemo(() => Object.values(cart).reduce((acc, { items }) => acc + items.length, 0), [cart])
  const isEmpty = !Object.values(cart).length
  return (
    <div className={bem()}>
      <div>
        <h2 className={bem('title')}>Your order:</h2>
        <div className={bem('delimiter')} />
      </div>
      <div className={bem('list')}>
        {isEmpty && <div className={bem('empty')}>Select a ticket</div>}
        {Object.values(cart).filter(({ data, items }) => !!data && !!items).map(({ data, sum, items }) => (
          <div className={bem('category')} key={data.value}>
            <div className={bem('category-title')} style={{ borderColor: data.color }}>
              <div className={bem('icon')} dangerouslySetInnerHTML={{ __html: data.icon}} style={{ color: data.color }} />
              <div className={bem('label')}>{data.label}</div>
              <div className={bem('count')}><Close style={{ width: 8 }} /> {items.length}</div>
              <div className={bem('price')}>{sum}</div>
              <button
                className={bem('remove')}
                onClick={() => {
                  items.forEach(item => toggleInCart(item, 0))
                }}
              >
                <Close style={{ width: 12, height: 12 }} />
              </button>
            </div>
            <div className={bem('items')}>
              {items.map(item => (
                <div className={bem('item')} key={item.id}>
                  <div className={bem('name')}>Row:</div>
                  <div className={bem('value')}>{item.row}</div>
                  <div className={bem('name')}>Seat:</div>
                  <div className={bem('value')}>{item.seat}</div>
                  <div className={bem('price')}>{item.price}</div>
                  <button className={bem('remove')} onClick={() => toggleInCart(item, 0)}><Close style={{ width: 10 }} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={bem('form')}>
        <div className={bem('delimiter')} />
        <div className={bem('promo')}>
          <input type='text' className={bem('input')} placeholder='enter promo code' />
          <Button className={bem('applyPromo')}><ArrowRight style={{ width: 9 }} /></Button>
        </div>
        <div className={bem('group')}>
          <div className={bem('summary')}>
            <div className={classNames('only-mobile')}>
              <div className={bem('fee')}>Selected tickets:</div>
              <div className={bem('fee')}>{totalCount}</div>
            </div>
            <div className={bem('total')}>
              <div className={bem('fee')}>transaction fee 5%:</div>
              <div className={bem('fee')}>{(total * 0.05).toFixed(2)}</div>
            </div>
            <div className={bem('total')}>
              <div className={bem('cost')}>Total:</div>
              <div className={bem('cost')}>{total - (total * 0.05).toFixed(2)}</div>
            </div>
          </div>

          <Button
            color='bordered'
            size='large'
            className={bem('submit')}
            onClick={() => setCartModal(true)}
            disabled={isEmpty}
          >
            Buy tickets
          </Button>
        </div>
      </div>
    </div>
  )
}