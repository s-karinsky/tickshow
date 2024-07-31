import { cn } from '@bem-react/classname'
import { ReactComponent as Close } from 'icons/close.svg'
import { ReactComponent as ArrowRight } from 'icons/arrow_right.svg'
import './cart.scss'
import Button from 'components/button'

const bem = cn('cart')

export default function Cart({ list, categories, toggleInCart}) {
  let total = 0;
  const grouped = list.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || { data: categories.find(cat => cat.value === item.category), sum: 0, items: [] }
    acc[item.category].items.push(item)
    acc[item.category].sum += item.price
    total += item.price
    return acc
  }, {})
  return (
    <div>

      <div className={bem()}>
        {Object.values(grouped).map(({ data, sum, items }) => (
          <div className={bem('category')} key={data.value}>
            <div className={bem('title')} style={{ borderColor: data.color }}>
              <div className={bem('icon')} dangerouslySetInnerHTML={{ __html: data.icon}} style={{ color: data.color }} />
              <div className={bem('label')}>{data.label}</div>
              <div className={bem('count')}><Close style={{ width: 8 }} /> {items.length}</div>
              <div className={bem('price')}>{sum}</div>
              <button className={bem('remove')}><Close style={{ width: 12, height: 12 }} /></button>
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
        <div className={bem('promo')}>
          <input type='text' className={bem('input')} placeholder='enter promo code' />
          <Button className={bem('applyPromo')}><ArrowRight style={{ width: 9 }} /></Button>
        </div>
        <div className={bem('total')}>
          <div className={bem('fee')}>Fee 5%:</div>
          <div className={bem('fee')}>{(total * 0.05).toFixed(2)}</div>
        </div>
        <div className={bem('total')}>
          <div className={bem('cost')}>Total:</div>
          <div className={bem('cost')}>{total - (total * 0.05).toFixed(2)}</div>
        </div>

        <Button color='bordered' size='large' className={bem('submit')}>
          Buy tickets
        </Button>
      </div>
    </div>
  )
}