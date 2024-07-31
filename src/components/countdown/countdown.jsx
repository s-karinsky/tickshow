import { useEffect } from 'react'
import { cn } from '@bem-react/classname'
import classNames from 'classnames'
import { ReactComponent as ClockIcon } from 'icons/clock.svg'
import { useCountdown } from 'utils/hooks'
import { msToTime } from 'components/seating-scheme/utils'
import './countdown.scss'

const bem = cn('countdown')

export default function Countdown({ to, className }) {
  const [msLeft, countdown] = useCountdown(to - Date.now())

  useEffect(() => {
    if (to > Date.now()) countdown.start()
  }, [])

  return (
    <div className={classNames(bem({ active: msLeft > 0 }), { [className]: className })}>
      <span className={bem('icon')}>
        <ClockIcon />
      </span>
      <span className={bem('text')}>
        Time left to place your order:
      </span>
      <span className={bem('time')}>
        {msToTime(msLeft)}
      </span>
    </div>
  )
}