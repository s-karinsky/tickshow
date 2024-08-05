import { useCallback, useMemo } from 'react'
import { cn } from '@bem-react/classname'
import classNames from 'classnames'
import { CURRENCY_SYMBOL_MAP } from 'const'
import './category-selector.scss'
import { useClickAway } from 'utils/hooks'

const bem = cn('category-selector')

export default function SelectCategory({
  defaultCurrency = '',
  options = [],
  valueKey = 'value',
  value,
  opened,
  className,
  style,
  onChange,
  onMouseOver,
  onMouseOut,
  ...rest
}) {
  const getCurrency = useCallback((item) => {
    const def = CURRENCY_SYMBOL_MAP[defaultCurrency] || defaultCurrency
    return item.currency ? (CURRENCY_SYMBOL_MAP[item.currency] || item.currency) : def
  }, [defaultCurrency])

  const selectedIndex = useMemo(() => options.findIndex(option => option[valueKey] === value), [options, value, valueKey])

  return (
    <ul
      className={classNames(bem({ opened }), { [className]: className })}
      style={{ ...style, height: opened ? (options.length - 1) * 24 + 46 : 30 }}
      {...rest}
    >
      {options.map(({ price, ...option }, i) => (
        <li
          key={option[valueKey]}
          className={bem('option', {
            selected: option[valueKey] === value,
            disabled: !option.count
          })}
          style={option[valueKey] === value ?
            undefined : {
              top: i * 24 + 38 - (selectedIndex > i ? 0 : 24)
            }
          }
          onClick={() => onChange(option[valueKey])}
          onMouseOver={e => {
            onMouseOver && option.count && onMouseOver(e, option)
          }}
          onMouseOut={() => onMouseOut && option.count && onMouseOut()}
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
          <span className={bem('count')}>{!!option.count && `${option.count} left`}</span>
          {!!option.sale && <span className={bem('old_price')}>{option.sale}</span>}
          <span className={bem('price')}>
            {!!price && (
              Array.isArray(price) ? <>
                <span className='only-desktop'>from</span> {price[0]}{`${getCurrency(option)} `}
                <span className={classNames(bem('price-del'), 'only-mobile')}>–</span>
                <span className='only-desktop'>to</span> {price[1]}{getCurrency(option)}
              </> :
              `${price}${getCurrency(option)}`
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}