import cn from 'classnames'
import { MdOutlineCheckCircle } from 'react-icons/md';
import { isEqualSeats } from '../../tools/utils';
import s from './svg-scheme.module.scss'
import { CURRENCY_SYMBOL_MAP } from '../../const';

export default function SvgSchemeSeatPreview({
  className,
  category,
  categories,
  tickets,
  row,
  seat,
  text,
  icon,
  color,
  footer,
  mobile = false,
  cart
}) {
  const cat = categories.find((c) => c.value === category);
  const svg = icon || cat?.icon;
  const clr = color || cat?.color || "#fff";

  const ticket = tickets.find((item) => isEqualSeats(item, { seat, row, category }))
  const isInCart = cart.findIndex((item) => isEqualSeats(item, { seat, row, category })) !== -1
  const isMultiple = row === '-1' || row === '0'

  return (
    <div className={cn(s.preview, { [className]: !!className })}>
      <div className={s.block}>
        <div className={s.price}>
          {ticket?.price || '-'}&nbsp;{CURRENCY_SYMBOL_MAP[ticket?.currency] || ''}
        </div>
        {!!svg && (
          <div
            className={s.icon}
            style={{ color: clr }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
      <div className={cn(s.block, s.desc)} style={{ color: clr }}>
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
        className={cn(s.footer, {
          [s.selected]: isInCart || isMultiple,
          [s.select]: !isInCart && !isMultiple
        })}
        style={isMultiple || !isInCart ? { background: clr } : {}}
      >
        {isInCart ? (
          <>
            <MdOutlineCheckCircle style={{ marginRight: "3px" }} />
            <span>Selected</span>
          </>
        ) : (
          <span>{ticket ? `${mobile ? 'Tap' : 'Click'} to select` : 'Seat not available'}</span>
        )}
      </div>
    </div>
  );
}