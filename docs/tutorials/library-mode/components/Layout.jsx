import {NavLink, Outlet} from 'react-router-dom'

export default function Layout(){
    return(
        <div>
            <nav>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/about">About</NavLink>
                <NavLink to="/user/profile">Profile</NavLink>
            </nav>

            {/* Outlet is where the Child Routes will appear*/}
            <Outlet/> 
        </div>
    )
}