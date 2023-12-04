import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom'

import {NaviBar} from './Componets/NavBar.js'
import {Lectors} from './Lectors.js'
import {Groups} from './Groups.js'

function App() {
  return (
    <>
    <Router>
    <NaviBar/>
    <Routes>
      <Route path="/groups" element ={<Groups/>}></Route>
      <Route path="/lectors" element ={<Lectors/>}></Route>
    </Routes>
    </Router>
    </>
  );
}

export default App;
