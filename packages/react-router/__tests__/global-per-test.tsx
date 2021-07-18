import React from 'react';
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Routes, useNavigate, MemoryRouter, useHref, useBlocker, useLocation } from "react-router";
import { Route } from '../index';

describe('global only use navigate performance', () => {
    let node: HTMLDivElement;
    beforeEach(() => {
      node = document.createElement("div");
      document.body.appendChild(node);
    });
  
    afterEach(() => {
      document.body.removeChild(node);
      node = null;
    });

    function Home(){
        return <div>home</div>
    }
    function About(){
        return <div>about</div>
    }

    it('global components not updated', ()=>{
        const fn = jest.fn()
        function LinkCom(){
            fn()
            const navigate = useNavigate()
            useHref('/')
            useBlocker(()=>{}, false)
            return(
                <ul>
                    <li id='home' onClick={()=> { navigate('/home') }}>home</li>
                    <li id='about' onClick={()=> { navigate('/about') }}>about</li>
                </ul>
            )
        }
        act(()=>{
            ReactDOM.render(
                <MemoryRouter initialEntries={['/']}>
                    <LinkCom />
                    <Routes>
                        <Route path='/about' element={<About />}/>
                        <Route path='/home' element={<Home />}/>
                    </Routes>
                </MemoryRouter>,
                node
            )
        })
        expect(fn).toBeCalledTimes(1)
        let homeBtn = document.getElementById('home')
        let aboutBtn = document.getElementById('about')
        act(()=> {
            homeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
        })
        expect(fn).toBeCalledTimes(1)
        act(()=> {
            aboutBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
        })
        expect(fn).toBeCalledTimes(1)
    })

    it('global components updated', ()=>{
        const fn = jest.fn()
        function LinkCom(){
            fn()
            const navigate = useNavigate()
            useLocation()
            return(
                <ul>
                    <li id='home' onClick={()=> { navigate('/home') }}>home</li>
                    <li id='about' onClick={()=> { navigate('/about') }}>about</li>
                </ul>
            )
        }
        act(()=>{
            ReactDOM.render(
                <MemoryRouter initialEntries={['/']}>
                    <LinkCom />
                    <Routes>
                        <Route path='/about' element={<About />}/>
                        <Route path='/home' element={<Home />}/>
                    </Routes>
                </MemoryRouter>,
                node
            )
        })
        expect(fn).toBeCalledTimes(1)
        let homeBtn = document.getElementById('home')
        let aboutBtn = document.getElementById('about')
        act(()=> {
            homeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
        })
        expect(fn).toBeCalledTimes(2)
        act(()=> {
            aboutBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
        })
        expect(fn).toBeCalledTimes(3)
    })

})