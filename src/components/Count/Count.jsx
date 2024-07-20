import MinusComponent from '../../icons/MinusComponent'
import PlusComponent from '../../icons/PlusComponent'
import styles from './Count.module.scss'

const Count = ({ value, onChange,min,max }) => {

    return ( 
        <div className={styles.count}>
            <div className={styles.display}>

                <div>
                    <button disabled={value === min} className={styles.buttonMinus} onClick={() => onChange(value - 1)}>
                        <PlusComponent />
                    </button>
                </div>

                <div>
                    <input type="number" value={value} onChange={(event) => onChange(parseInt(event.target.value, 10))} min={min} max={max}/>
                </div>

                <div>
                    <button disabled={value === max} className={styles.buttonPlus} onClick={() => onChange(value + 1)}>
                        <MinusComponent />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Count