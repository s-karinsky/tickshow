import { useCallback, useMemo } from 'react'
import { cn } from '@bem-react/classname'
import { CURRENCY_SYMBOL_MAP } from 'const'
import './category-selector.scss'

const bem = cn('category-selector')

export default function SelectCategory({
  defaultCurrency = '',
  options = [],
  valueKey = 'value',
  value,
  isOpen,
  onClick,
  onChange,
}) {
  const getCurrency = useCallback((item) => {
    const def = CURRENCY_SYMBOL_MAP[defaultCurrency] || defaultCurrency
    return item.currency ? (CURRENCY_SYMBOL_MAP[item.currency] || item.currency) : def
  }, [defaultCurrency])

  const selectedIndex = useMemo(() => options.findIndex(option => option[valueKey] === value), [options, value, valueKey])

  return (
    <ul
      className={bem({ opened: isOpen })}
      style={{ height: isOpen ? (options.length - 1) * 24 + 46 : 30 }}
      onClick={onClick}
    >
      {options.map(({ price, ...option }, i) => (
        <li
          key={option[valueKey]}
          className={bem('option', {
            selected: option[valueKey] === value
          })}
          style={option[valueKey] === value ?
            undefined : {
              top: i * 24 + 38 - (selectedIndex > i ? 0 : 24)
            }
          }
          onClick={() => onChange(option[valueKey])}
        >
          <span className={bem('column')}>
            {!!option.icon &&
              <span
                style={{ color: option.color }}
                className={bem('icon')}
                dangerouslySetInnerHTML={{ __html: option.icon }}
              />
            }
            <span className={bem('label')}>{option.label}</span>
          </span>
          <span className={bem('count')}>{!!option.ticketsCount && `${option.ticketsCount} left`}</span>
          {!!option.sale && <span className={bem('old_price')}>{option.sale}</span>}
          <span className={bem('price')}>
            {!!price && (
              Array.isArray(price) ? <>
                <span>from</span> {price[0]}{`${getCurrency(option)} `}
                <span>to</span> {price[1]}{getCurrency(option)}
              </> :
              `${price}${getCurrency(option)}`
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}