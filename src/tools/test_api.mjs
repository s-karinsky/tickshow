import axios from "axios"
import MD5 from "crypto-js/md5.js";
//console.log(MD5("1").toString());
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
async function AuthUser(email="",phone="",name,password,auth_type="e-mail"){
    var data = {
        "login":(email||phone),
        "type":auth_type,
        "password": "ajekghet"

    }
    return await make_async_request("auth",data)
}
async function RegisterUser(email="",phone="",name){
    var data = {
        "u_name":name,
        "u_role":"1",
        "u_phone":phone,
        "u_email":email,
        "data": JSON.stringify({
            "password":"ajekghet"
        })

    }
    return await make_async_request("register",data,"POST")
}


async function GetTrip(id_trip){
    return (await make_async_request("trip/get/"+id_trip))["data"]["trip"][id_trip]
}
async function GetTrips(config){
    return (await make_async_request("trip/get",config))["data"]
}
async function GetStadium(sc_id){
    var data = {
        "sc_id":sc_id
    }
    data = await make_async_request("data/?fields=3",data)
    var stadium_id = data["data"]["data"]["schedule"][sc_id]["stadium"]
    return data["data"]["data"]["stadiums"][stadium_id]
}
async function GetStadiumScheme(link){
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }
    var response = await axios.post(link,{},{headers:headers})
    return response.data
}
function TEST_get_stadium_scheme_by_trip_id(){
    const trip_id = "3";
    var trip = GetTrip(trip_id)
    trip.then((trip_data)=>{
        var sc_id = trip_data["sc_id"]
        var stadium = GetStadium(sc_id)
        stadium.then((stadium_data)=>{
            console.log(stadium_data)
            var link = stadium_data["scheme_blob"]
            GetStadiumScheme(link).then((stadium_scheme)=>{
                console.log(stadium_scheme)
            })
        })
    })
}
//TEST_get_stadium_scheme_by_trip_id()


async function RegisterPhantomUser(){
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
async function CartSeat(token,u_hash,seat,trip_id){
    var data = {
        "token":token,
        "u_hash":u_hash
    }
    var url = "cart?prod=" + trip_id + "&prop=" + seat
    return await make_async_request(url,data,"POST")
}

export {
    AuthUser,
    RegisterUser
}