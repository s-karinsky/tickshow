import styles from './Count.module.scss'
import minus from './assets/Minus.svg'
import plus from './assets/Plus.svg'
const Count = ({ value, onChange }) => {

    return ( 
        <div className={styles.count}>
            <div className={styles.display}>

                <div>
                    <button className={styles.buttonMinus} onClick={() => onChange(value - 1)}><img src={minus} alt="" /></button>
                </div>

                <div>
                    <input type="number" value={value} onChange={event => onChange(event.target.value)}/>
                </div>

                <div>
                    <button className={styles.buttonPlus} onClick={() => onChange(value + 1)}><img src={plus} alt="" /></button>
                </div>
            </div>
        </div>
    )
}

export default Count