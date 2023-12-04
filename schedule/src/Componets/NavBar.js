import React from "react";
import {Navbar, Nav, Button} from 'react-bootstrap'
import { Link } from "react-router-dom";
import styled from "styled-components"


export function NaviBar(){
    return(
    <>
        <Navbar collapseOnselect expand="lg" bg="dark" variant="dark" >
        <Navbar.Brand>Расписание</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
        <Navbar.Collapse id = "responsive-navbar-nav">
            <Nav classname="mr-auto">
                <Nav.Link >
                    <Link to="/groups">Группы</Link>
                </Nav.Link>
                <Nav.Link >
                    <Link to="/lectors">Преподавателя</Link>
                </Nav.Link>
            </Nav>
        </Navbar.Collapse>
    </Navbar>
    </>
    )
}