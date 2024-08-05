import {axios} from "../utils/axios";

export async function CreateOrder(seats, token, u_hash, appUrl = window.location.origin) {
    var data = {
        token: token,
        u_hash: u_hash,
        appUrl: appUrl,
        data: JSON.stringify({
            b_payment_way: 2,
            b_options: {
                tickets: {
                    seats: seats,
                },
            },
        }),
    };
    try {
        return await axios.post("drive", data, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
        });
    } catch (e) {
        console.log(e)
    }
}