import axios from "axios"
import MD5 from "crypto-js/md5";
const ibronevik_api_link = "https://ibronevik.ru/taxi/c/TikShow/api/v1/"
async function make_async_request(url,data,method="POST") {
    var response = {};
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }
    if(method === "POST"){
        response = await axios.post(ibronevik_api_link+url,data,{headers:headers})
    }
    else if (method === "GET"){
        response = await axios.get(ibronevik_api_link+url,{headers:headers})
    }
    return response.data
}
export async function AuthUser(email="", phone="", auth_type="e-mail"){
    if (email === null || email === undefined){
        auth_type = "phone"
    }
    var data = {
        "login":(email||phone),
        "type":auth_type,
        "password": "ajekghet"

    }
    var auth_hash = await make_async_request("auth",data)
    auth_hash = auth_hash.auth_hash
    var req = await make_async_request("token",{"auth_hash":auth_hash})
    return {"token":req.data.token,"u_hash":req.data.u_hash,u_id:req.auth_user.u_id}
}
export async function RegisterUser(email="", phone="", name){
    var data = {
        "u_name":name,
        "u_role":"1",
        "u_phone":phone,
        "u_email":email,
        "data": JSON.stringify({
            "password":"ajekghet"
        }),
        "st":""

    }
    data = await make_async_request("register",data,"POST")
    if (data.code === "404"){
        return {"code":"404"}
    }
    data = {
        "token":data.data.token,
        "u_hash":data.data.u_hash
    }
    return data
}
export async function RegisterPhantomUser(){
    while (true){
        var now = new Date();
        var day = ("0" + now.getDate()).slice(-2);
        var month = ("0" + (now.getMonth() + 1)).slice(-2);
        var today = now.getFullYear() + "-" + (month) + "-" + (day)
        var hour = ("0" + now.getHours()).slice(-2);
        var minute = ("0" + now.getMinutes()).slice(-2);
        var second = ("0" + now.getSeconds()).slice(-2);
        var time = now.getFullYear() + "-" + (month) + "-" + (day) + " " + (hour) + ":" + (minute) + ":" + (second)

        var email = MD5(time + Math.random(3,1000000000000)).toString()+"@phantom.com"

        var data = {
            "u_name":"Phantom",
            "u_role":"1",
            "u_phone":Math.random(3,1000000000000),
            "u_email":email,
            "data": JSON.stringify({
                "password":"ajekghet"
            })
        }
        var resp = await make_async_request("register",data,"POST")
        if (resp.code !== "200"){
            continue
        }
        return email
    }
}
export async function CreateOrder(seats, token, u_hash){
    var data = {
        "token":token,
        "u_hash":u_hash,
        "appUrl":window.location.origin,
        "data":JSON.stringify({
            "b_payment_way":2,
            "b_options":{
                "tickets":{
                    "seats":seats
                }
            }
        })
    }
    return await make_async_request("drive",data,"POST")
}
export async function GetTrip(id_trip){
    return (await make_async_request("trip/get/"+id_trip))["data"]["trip"][id_trip]
}
async function GetTrips(config){
    return (await make_async_request("trip/get",config))["data"]
}
export async function GetStadium(sc_id){
    var data = {
        "sc_id":sc_id
    }
    data = await make_async_request("data/?fields=3",data)
    var stadium_id = data["data"]["data"]["schedule"][sc_id]["stadium"]
    return {
        stadium:data["data"]["data"]["stadiums"][stadium_id],
        schedule:data["data"]["data"]["schedule"][sc_id]
    }
}
export async function GetStadiumScheme(link){
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }
    var response = await axios.post(link,{},{headers:headers})
    return response.data
}
export async function CartSeat(token, u_hash, seat, trip_id, count=1){
    var data = {
        "token":token,
        "u_hash":u_hash
    }
    var url = "cart?prod=" + trip_id + "&prop=" + seat + "&count=" + count
    return await make_async_request(url,data,"POST")
}
export async function GetCart(token, u_hash){
    var data = {
        "token":token,
        "u_hash":u_hash
    }
    return await make_async_request("cart",data,"POST")
}
export async function ClearSeats(token, u_hash,items){
    var data = {
        "token":token,
        "u_hash":u_hash,
        "item":JSON.stringify(items)
    }
    return await make_async_request("cart/clear",data,"POST")
}
export async function ChangeUser(token,u_hash,name,email,phone){
    var data = {
        "token":token,
        "u_hash":u_hash,
        "data":JSON.stringify({
            "u_name":name,
            "u_email":email,
            "u_phone":phone
        })
    }
    return await make_async_request("user",data,"POST")

}
export async function MoveCart(token,u_hash,items,u_id){

    var new_tickets_grouped = {}

    items.forEach((item)=>{
        if (!new_tickets_grouped[item.t_id]){
            new_tickets_grouped[item.t_id] = []
        }
        new_tickets_grouped[item.t_id].push(item)
    })

    var data = {
        "token":token,
        "u_hash":u_hash,
        "item":JSON.stringify(new_tickets_grouped),
        "u_id":u_id
    }
    return await make_async_request("cart/move",data,"POST")
}
export async function GetLimitTime(){
    var response = {};
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }
        response = await axios.post("https://ibronevik.ru/taxi/cache/data_TikShow.(iso).json",{},{headers:headers})

    return response.data.data.site_constants.ticket_booking_duration.value
}
