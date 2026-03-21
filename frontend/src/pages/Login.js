import {useState} from "react";
import axios from "axios";

export default function Login(){

const [email,setEmail]=useState("");
const [password,setPassword]=useState("");

const login = async ()=>{

 const res = await axios.post("http://localhost:5000/api/auth/login",{
   email,password
 });

 localStorage.setItem("token",res.data.token);

 window.location="/dashboard";

};

return(

<div className="flex h-screen items-center justify-center">

<div className="bg-white p-8 shadow rounded">

<h2 className="text-xl mb-4">CRM Login</h2>

<input placeholder="Email"
className="border p-2 w-full mb-3"
onChange={e=>setEmail(e.target.value)}
/>

<input placeholder="Password" type="password"
className="border p-2 w-full mb-3"
onChange={e=>setPassword(e.target.value)}
/>

<button
className="bg-blue-600 text-white px-4 py-2 w-full"
onClick={login}
>
Login
</button>

</div>

</div>

);

}