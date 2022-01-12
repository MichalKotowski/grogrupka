import { Fragment } from "react"
import "./App.css"
import { BrowserRouter as Router, Route, Link } from "react-router-dom"
import OtherPage from "./OtherPage"
import MainComponent from "./MainComponent"

function App() {
    return (
        <Router>
            <Fragment>
                <header className="header">
                    <h1>Planszowy Gaming</h1>
                    <Link to="/">Ranking</Link>
                    <Link to="/otherpage">New game</Link>
                </header>
                <div className="main">
                    <Route exact path="/" component={MainComponent} />
                    <Route path="/otherpage" component={OtherPage} />
                </div>
            </Fragment>
        </Router>
    );
}

export default App