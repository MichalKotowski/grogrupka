import { Component } from "react"
import { Link } from "react-router-dom"
import * as elo from "./elo.js"
import axios from "axios"

class OtherPage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            players: [],
            elo: [],
            date: '',
            game: '',
        }

        this.getAllUsers = this.getAllUsers.bind(this)
        this.handleRating = this.handleRating.bind(this)
        this.saveGame = this.saveGame.bind(this)
        this.handleInput = this.handleInput.bind(this)
        this.getCurrentElo = this.getCurrentElo.bind(this)
        this.saveElo = this.saveElo.bind(this)
    }

    getAllUsers = (async () => {
        const data = await axios.get("https://grogrupka.herokuapp.com/api/users/all")
        this.setState({
            players: data.data.rows.map(player => [player.username, player.user_id])
        })
    })

    getCurrentElo = (async () => {
        const data = await axios.get('https://grogrupka.herokuapp.com/api/elo/all')
        this.setState({
            elo: data.data.rows.map(player => [player.user_id, player.current_elo])
        })
    })

    handleRating = () => {
        let players = []
        let selectedElo = []
        const dataToPush = []
        const latestElo = this.state.elo

        for (const [key, value] of Object.entries(this.state)) {
            if (key.includes('user')) {
                let userId = key.charAt(key.length - 1)
                players.push([userId, value])
            }
        }

        players.sort((a, b) => (a[1] > b[1] ? 1 : -1))

        players.forEach(player => {
            latestElo.forEach(playerElo => {
                if (parseInt(player[0]) === parseInt(playerElo[0])) {
                    selectedElo.push(playerElo[1])
                }
            })
        })

        console.log(selectedElo)
        const newElo = elo.getEloRating(selectedElo, 64)
        console.log(newElo)

        players.forEach((player, i) => {
            dataToPush.push([parseInt(players[i][0]), parseInt(newElo[i])])
        })

        this.saveElo(dataToPush)
    }

    saveElo = (async (dataToPush) => {
        await axios.post("https://grogrupka.herokuapp.com/api/elo", {
            session: dataToPush
        }).then(response => {
            console.log(response)
        }).catch(error => {
            console.log(error)
        })
    })

    saveGame = (async event => {
        event.preventDefault()

        await axios.post("https://grogrupka.herokuapp.com/api/game", {
            session: this.state
        }).then(response => {
            console.log(response)
            this.handleRating()
        }).catch(error => {
            console.log(error)
        })
    })

    componentDidMount() {
        this.getAllUsers()
        this.getCurrentElo()
    }

    handleInput = name => event => {
        this.setState({
            [name]: event.target.value
        })
    }

    render() {
        return (
            <div>
                <form onSubmit={this.saveGame}>
                    <div className="inputs-wrapper">
                        {this.state.players.map(player => (
                            <label key={player[1]}>
                                {player[0]}
                                <input type="text" pattern="[0-9]*" onChange={this.handleInput(`user${player[1]}`)} />
                            </label>
                        ))}
                    </div>
                    <div className="inputs-wrapper">
                        <label>
                            Date
                            <input type="text" value={this.state.date} onChange={this.handleInput(`date`)} />
                        </label>
                        <label>
                            Game
                            <input type="text" value={this.state.game} onChange={this.handleInput(`game`)} />
                        </label>
                    </div>
                    <input type="submit" value="Submit" />
                </form>
            </div>
        )
    }
}

export default OtherPage