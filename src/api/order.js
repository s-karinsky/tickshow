import {axios} from "../utils/axios";

export async function CreateOrder(seats, token, u_hash, appUrl = window.location.origin) {
    var data = {
      appUrl: appUrl,
      data: JSON.stringify({
        b_payment_way: 2,
        b_options: {
          tickets: {
            seats,
          },
        },
      }),
    };
    try {
      return await axios.post("drive", data);
    } catch (e) {
      console.log(e)
      return Promise.reject()
    }
}