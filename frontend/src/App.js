import './App.css';
import {Routes, Route} from 'react-router-dom'
import UserContextProvider from './context/userContext';


function App() {
    return (
        <div className="App">
            <UserContextProvider>
                <Routes>
                    <Route path='/' exact element={<Welcome/>}/>
                    <Route path='/login' element={<Login/>}/>
                    <Route path='/register' element={<Register/>}/>
                </Routes>
            </UserContextProvider>
        </div>
    );
}

export default App;
