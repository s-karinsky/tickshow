import { forwardRef, useEffect, useRef } from 'react';
import Hammer from 'hammerjs';
import useScheme from 'components/seating-scheme/hooks/useScheme';
import './seating-scheme.scss';

const EventHandler = forwardRef((props, ref) => {
  const { src, categories, tickets, cart } = props;
  const { refs } = useScheme(src, categories);
  const hammerRef = useRef(null);

  useEffect(() => {
    const hammer = new Hammer(hammerRef.current);

    const handleSwipe = (event) => {
      console.log('Swipe event:', event);
      // Handle swipe event here
    };

    hammer.on('swipe', handleSwipe);

    return () => {
      hammer.off('swipe', handleSwipe);
      hammer.destroy();
    };
  }, []);

  return (
    <div
      className='scheme-viewport'
      ref={(el) => {
        refs.viewport.current = el;
        hammerRef.current = el;
      }}
    >
      <div
        className='scheme-draggable'
        ref={refs.draggable}
      >
        <svg
          className='scheme-svg'
          xmlns='http://www.w3.org/2000/svg'
          ref={refs.scheme}
        />
      </div>
    </div>
  );
});

export default SeatingScheme;