import {useState, useContext} from 'react';
import axios from "axios";
import UserContext from "./UserContext";
import {Navigate} from "react-router-dom";



function Login() {
    const user = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError,setLoginError] = useState(false);
    const [redirect,setRedirect] = useState(false);

    function loginUser(e){
        e.preventDefault();
        const data ={email, password}
        axios.post("http://localhost:4000/login", data, {withCredentials: true})
            .then(response => {
                user.setEmail(response.data.email);
                setEmail('');
                setPassword('');
                setLoginError(false);
                setRedirect(true);
            }).catch(() => {
            setLoginError(true);
        });
    }

    if (redirect) {
        return <Navigate to={'/'} />
    }

    return (
        <form action="" onSubmit={(e) => loginUser(e)}>
            {loginError && (
                <div>LOGIN ERROR! WRONG EMAIL OR PASSWORD!</div>
            )}
            <input type="email" placeholder="email" value={email} onChange={e =>setEmail(e.target.value)}/><br/>
            <input type="password" placeholder="password" value={password} onChange={e =>setPassword(e.target.value)}/><br/>
            <button type="submit">Login</button>
        </form>
    )
}

export default Login;